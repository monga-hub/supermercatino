import { Scene, type GameObjects, type Input } from 'phaser';
import { createState, tick, advance, type GameState, type RoomType, type ObjectType, type Category } from '../../sim/state.ts';
import { apply, check, type Command } from '../../sim/build.ts';
import { STEP_MS } from '../../sim/config.ts';
import { gridToIso, cellAt } from '../../render/iso.ts';
import { drawFloor, drawThings, drawObject, tile } from '../../render/draw.ts';

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const TAP_SLOP = 10; // px a pointer may move and still count as a tap
const OK = 0x4caf50;
const BAD = 0xe53935;

/** UI-only state, set by the Hud. Not part of the sim. */
export type Tool =
    | { kind: 'room'; room: RoomType }
    | { kind: 'object'; object: ObjectType; category?: Category }
    | { kind: 'demolish' }
    | null;

type Cell = { x: number; y: number };

// Draws the sim and turns input into camera moves and sim commands. No game logic here (ADR-0001).
export class Game extends Scene {
    sim: GameState;
    acc = 0;
    floor: GameObjects.Graphics;
    things: GameObjects.Graphics;
    preview: GameObjects.Graphics;
    pinch: { d: number; mx: number; my: number } | null = null;
    pinched = false; // a pinch happened during this touch: its pointerup must not build
    // ?manual: sim advances only through window.advanceTime (deterministic browser tests)
    manual = new URLSearchParams(location.search).has('manual');

    constructor() {
        super('Game');
    }

    get tool(): Tool {
        return this.registry.get('tool') ?? null;
    }

    create() {
        this.sim = createState();
        this.registry.set('sim', this.sim);
        this.registry.set('tool', null);
        this.floor = this.add.graphics();
        this.preview = this.add.graphics();
        this.things = this.add.graphics();
        drawFloor(this.floor, this.sim);
        this.setupCamera();
        this.setupInput();
        this.registry.events.on('changedata-tool', () => this.preview.clear());
        this.scene.launch('Hud');

        window.render_game_to_text = () => JSON.stringify(this.sim);
        window.advanceTime = (ms: number) => advance(this.sim, ms);
        window.dispatch = (cmd: Command) => this.run(cmd);
        window.selectTool = (t: Tool) => this.registry.set('tool', t);
    }

    update(_time: number, delta: number) {
        if (!this.manual && !this.sim.paused) {
            // ponytail: cap delta so a backgrounded tab doesn't replay minutes of ticks at once
            this.acc += Math.min(delta, 250) * this.sim.speed;
            while (this.acc >= STEP_MS) {
                tick(this.sim);
                this.acc -= STEP_MS;
            }
        }
        drawThings(this.things, this.sim);
    }

    run(cmd: Command) {
        const r = apply(this.sim, cmd);
        if (r.ok) drawFloor(this.floor, this.sim);
        else this.game.events.emit('toast', r.reason);
        return r;
    }

    cellOf(p: Input.Pointer): Cell {
        return cellAt(p.worldX, p.worldY);
    }

    /** Cell under the point where this pointer went down (screen coords -> world). */
    downCell(p: Input.Pointer): Cell {
        const w = this.cameras.main.getWorldPoint(p.downX, p.downY);
        return cellAt(w.x, w.y);
    }

    /** The command the current tool would issue for this pointer, if any. */
    commandFor(p: Input.Pointer): Command | null {
        const t = this.tool;
        const c = this.cellOf(p);
        if (!t) return null;
        if (t.kind === 'room') {
            const a = p.isDown || p.leftButtonReleased() ? this.downCell(p) : c;
            return {
                type: 'buildRoom', room: t.room,
                x: Math.min(a.x, c.x), y: Math.min(a.y, c.y),
                w: Math.abs(a.x - c.x) + 1, h: Math.abs(a.y - c.y) + 1,
            };
        }
        if (t.kind === 'object') return { type: 'placeObject', object: t.object, category: t.category, ...c };
        return { type: 'demolish', ...c };
    }

    drawPreview(p: Input.Pointer) {
        const g = this.preview;
        g.clear();
        const cmd = this.commandFor(p);
        if (!cmd) return;
        const color = check(this.sim, cmd).ok ? OK : BAD;
        if (cmd.type === 'buildRoom') {
            for (let x = cmd.x; x < cmd.x + cmd.w; x++) for (let y = cmd.y; y < cmd.y + cmd.h; y++) tile(g, x, y, color, 0.45);
        } else if (cmd.type === 'placeObject') {
            tile(g, cmd.x, cmd.y, color, 0.45);
            drawObject(g, { type: cmd.object, x: cmd.x, y: cmd.y, category: cmd.category as Category }, 0.6);
        } else if (cmd.type === 'demolish') {
            tile(g, cmd.x, cmd.y, BAD, 0.5);
        }
    }

    setupCamera() {
        const cam = this.cameras.main;
        cam.setBackgroundColor('#2b1d16');
        const c = gridToIso(this.sim.grid.w / 2, this.sim.grid.h / 2);
        cam.centerOn(c.x, c.y);
        this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.zoomBy(dy > 0 ? 0.9 : 1.1));
    }

    // Input never relies on 'pointerdown': a fast click can deliver down+up in one frame and
    // Phaser then skips the scene's pointerdown. Pointer.downX/downY and getDistance() are always set.
    setupInput() {
        const cam = this.cameras.main;
        this.input.addPointer(1); // second touch for pinch
        this.input.mouse?.disableContextMenu();
        const downPointers = () => this.input.manager.pointers.filter((q) => q.isDown);
        const buildsOnDrag = (p: Input.Pointer) =>
            this.tool?.kind === 'room' && !p.rightButtonDown() && !p.middleButtonDown();

        this.input.on('pointermove', (p: Input.Pointer) => {
            const down = downPointers();
            if (down.length >= 2) {
                const [a, b] = down;
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                if (this.pinch) {
                    this.zoomBy(d / this.pinch.d);
                    cam.scrollX -= (mx - this.pinch.mx) / cam.zoom;
                    cam.scrollY -= (my - this.pinch.my) / cam.zoom;
                }
                this.pinch = { d, mx, my };
                this.pinched = true;
                this.preview.clear();
                return;
            }
            this.pinch = null;
            if (p.isDown && !this.pinched && buildsOnDrag(p)) return this.drawPreview(p);
            if (p.isDown) {
                // drag pans (room tool builds with left drag; right/middle always pan)
                cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
                cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
                this.preview.clear();
                return;
            }
            if (this.tool && !p.wasTouch) this.drawPreview(p); // hover preview, mouse only
        });

        this.input.on('pointerup', (p: Input.Pointer) => {
            const wasPinch = this.pinched;
            if (downPointers().length === 0) {
                this.pinch = null;
                this.pinched = false;
            }
            if (wasPinch || !this.tool || !p.leftButtonReleased()) return;
            const isTap = p.getDistance() <= TAP_SLOP;
            if (this.tool.kind === 'room' || isTap) {
                const cmd = this.commandFor(p);
                if (cmd) this.run(cmd);
            }
            if (p.wasTouch) this.preview.clear();
            else this.drawPreview(p);
        });
    }

    zoomBy(f: number) {
        const cam = this.cameras.main;
        cam.setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, cam.zoom * f)));
    }
}
