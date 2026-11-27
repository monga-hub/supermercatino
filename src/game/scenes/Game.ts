import * as Phaser from 'phaser';
import { Scene, type GameObjects, type Input } from 'phaser';
import { createState, tick, advance, type GameState, type RoomType, type ObjectType, type Category } from '../../sim/state.ts';
import { apply, check, objectAt, roomAt, type Command } from '../../sim/build.ts';
import { STEP_MS, TAP_ICON_BELOW, BEAR_BONUS_MONEY, BEAR_BONUS_REP, INSPECTION_DAY } from '../../sim/config.ts';
import { readyAt, tricking } from '../../sim/customers.ts';
import { tired } from '../../sim/staff.ts';
import { saveGame, loadGame, SAVE_KEY } from '../../sim/save.ts';
import { loadProgress, winLevel, PROGRESS_KEY, type Progress } from '../../sim/levels.ts';
import { gridToIso, cellAt, TILE_H, TILE_W } from '../../render/iso.ts';
import { drawFloor, drawThings, drawObject, tile, putProp, GROUND, type Put } from '../../render/draw.ts';
import { carAt } from '../../render/scenery.ts';
import { LEVELS } from '../../sim/levels.ts';
import { KIT_SCALE } from '../../render/sprites.ts';
import type { Hud } from './Hud.ts';
import { snap, cues, type Snap } from '../../audio/cues.ts';
import { play } from '../../audio/synth.ts';
import { DPR } from '../dpr.ts';

// zooms are in CSS px per world px; the camera's own zoom is DPR times that (main.ts)
const ZOOM_MIN = 0.4;
/** Tap icons float just above the shelf (80 px) / till (51 px) sprite, low over a spill (by key prefix). */
const ICON_LIFT: Record<string, number> = { s: 86, t: 58, p: 24, c: 50, f: 66, w: 62, v: 44 };
/** Smaller status icons (not tappable): spills, staff on a break or tired. */
const ICON_SCALE: Record<string, number> = { p: 0.75, w: 0.6, v: 0.6 };
const ZOOM_MAX = 2.5;
const TAP_SLOP = 10; // px a pointer may move and still count as a tap
const LONG_MS = 450; // hold this long on an object to edit it (milestone 21)
const OK = 0x4caf50;
const BAD = 0xe53935;

/** UI-only state, set by the Hud. Not part of the sim. */
export type Tool =
    | { kind: 'room'; room: RoomType }
    | { kind: 'object'; object: ObjectType; category?: Category }
    | { kind: 'demolish' }
    | { kind: 'rotate' }
    | null;

type Cell = { x: number; y: number };

// Draws the sim and turns input into camera moves and sim commands. No game logic here (ADR-0001).
export class Game extends Scene {
    sim: GameState;
    acc = 0;
    floor: GameObjects.Graphics;
    things: GameObjects.Graphics;
    over: GameObjects.Graphics;
    /** Pooled atlas images, reused every frame by put(). */
    sprites: GameObjects.Image[] = [];
    used = 0;
    preview: GameObjects.Graphics;
    pinch: { d: number; mx: number; my: number } | null = null;
    pinched = false; // a pinch happened during this touch: its pointerup must not build
    /** Tap icons over shelves and tills, pooled by key; each carries its command in data 'cmd'. */
    zoomMin = ZOOM_MIN;
    icons = new Map<string, GameObjects.Image>();
    /** happyBears last seen, to celebrate each new one. */
    bears = 0;
    // ?manual: sim advances only through window.advanceTime (deterministic browser tests)
    manual = new URLSearchParams(location.search).has('manual');
    /** Menu + autosave in localStorage (milestone 11); browser tests opt in with ?manual&save. */
    saving = !this.manual || new URLSearchParams(location.search).has('save');
    /** The game found in localStorage at startup ("Continua"), if any. */
    saved: GameState | null = null;
    /** Campaign levels won (milestone 20), kept apart from the save. */
    progress: Progress = { won: [], seen: [] };
    saveAt = 0;
    /** Object being edited after a long press (UI only); moving: the next tap on a cell moves it there. */
    edit: { id: number; moving: boolean; room?: { x: number; y: number } } | null = null; // room: free shop, only remove
    /** The press that may become a long press, and whether the current one already did. */
    press: { t: number } | null = null;
    longFired = false;
    sel: GameObjects.Graphics;

    constructor() {
        super('Game');
    }

    get tool(): Tool {
        return this.registry.get('tool') ?? null;
    }

    preload() {
        this.load.atlas('kit', 'assets/kit.png', 'assets/kit.json');
    }

    put: Put = (frame, x, y, depth, flip = false) => {
        if (!this.textures.get('kit').has(frame)) return false;
        const im = (this.sprites[this.used++] ??= this.add.image(0, 0, 'kit').setOrigin(0.5, 1).setScale(KIT_SCALE));
        im.setFrame(frame).setPosition(x, y).setDepth(depth).setFlipX(flip).setVisible(true);
        return true;
    };

    create() {
        this.sim = createState();
        this.heard = snap(this.sim);
        this.registry.set('sim', this.sim);
        this.registry.set('tool', null);
        this.floor = this.add.graphics();
        this.preview = this.add.graphics();
        this.things = this.add.graphics();
        this.over = this.add.graphics().setDepth(9000);
        this.sel = this.add.graphics().setDepth(8999);
        drawFloor(this.floor, this.sim);
        this.drawSign();
        this.setupCamera();
        this.setupInput();
        this.registry.events.on('changedata-tool', () => this.preview.clear());
        this.saved = this.saving ? loadGame(localStorage.getItem(SAVE_KEY)) : null;
        if (this.saving) this.progress = loadProgress(localStorage.getItem(PROGRESS_KEY));
        this.registry.set('menu', this.saving ? 'start' : null);
        document.addEventListener('visibilitychange', () => document.hidden && this.store());
        window.addEventListener('pagehide', () => this.store());
        this.scene.launch('Hud');

        window.render_game_to_text = () => JSON.stringify(this.sim);
        window.advanceTime = (ms: number) => advance(this.sim, ms);
        window.dispatch = (cmd: Command) => this.run(cmd);
        window.selectTool = (t: Tool) => this.registry.set('tool', t);
        window.menuState = () => this.registry.get('menu') ?? null;
        window.cellToScreen = (x, y, lift = 0) => {
            const cam = this.cameras.main;
            const p = gridToIso(x, y);
            return { x: ((p.x - cam.worldView.x) * cam.zoom) / DPR, y: ((p.y + TILE_H / 2 - lift - cam.worldView.y) * cam.zoom) / DPR, zoom: cam.zoom / DPR };
        };
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
        if (this.sim.happyBears > this.bears)
            this.game.events.emit('toast', `L'orso è contento! +€${BEAR_BONUS_MONEY} e +${BEAR_BONUS_REP} reputazione`);
        this.bears = this.sim.happyBears;
        this.events_();
        const lv = this.sim.level;
        if (this.sim.outcome?.win && lv && !this.progress.won.includes(lv)) {
            this.progress = winLevel(this.progress, lv);
            if (this.saving) localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progress));
        }
        const now = snap(this.sim);
        play(cues(this.heard, now));
        this.heard = now;
        if (_time > this.saveAt) {
            this.saveAt = _time + 3000;
            this.store();
        }
        this.checkLongPress();
        this.drawSelection();
        this.used = 0;
        drawThings(this.things, this.over, this.sim, this.put);
        const car = carAt(this.sim, _time);
        if (car) putProp(this.put, car, 1 + car.x + car.y);
        for (let i = this.used; i < this.sprites.length; i++) this.sprites[i].setVisible(false);
        this.drawIcons(_time);
    }

    /** Day and inspection seen last frame, to announce changes once (milestone 14). */
    seen = { day: 0, inspection: false, caught: 0, escaped: 0 };
    /** Sim as the audio last heard it (milestone 16). */
    heard: Snap;
    events_() {
        const s = this.sim;
        if (s.day !== this.seen.day && s.day === INSPECTION_DAY && !s.inspection) this.game.events.emit('toast', 'Oggi passa l\'ispettore sanitario: tieni pulito!');
        const i = s.inspection;
        if (i && !this.seen.inspection)
            this.game.events.emit('toast', i.fine ? `Ispezione: multa di €${i.fine} per lo sporco!` : `Ispezione superata! +${i.rep} reputazione`);
        if (s.furbetti.caught > this.seen.caught) this.game.events.emit('toast', 'Beccato! Il furbetto paga tutto');
        if (s.furbetti.escaped > this.seen.escaped) this.game.events.emit('toast', 'Il furbetto è scappato senza pagare!');
        this.seen = { day: s.day, inspection: !!i, ...s.furbetti };
    }

    /** Held still on an object with no tool: edit it (move, rotate, remove). */
    checkLongPress() {
        const p = this.input.activePointer;
        if (!this.press || !p.isDown || this.pinched || this.tool || p.getDistance() > TAP_SLOP * DPR) return;
        if (this.time.now - this.press.t < LONG_MS) return;
        this.press = null;
        const c = this.downCell(p);
        const o = objectAt(this.sim, c.x, c.y);
        if (o) this.edit = { id: o.id, moving: false };
        else if (!this.sim.level && roomAt(this.sim, c.x, c.y)) this.edit = { id: -1, moving: false, room: c };
        else return;
        this.longFired = true;
    }

    drawSelection() {
        const g = this.sel.clear();
        const e = this.edit, r = e?.room && roomAt(this.sim, e.room.x, e.room.y);
        if (r) {
            for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) tile(g, x, y, 0xffd23f, 0.35);
            return;
        }
        const o = e && this.sim.objects.find((x) => x.id === e.id);
        if (e && !o) this.edit = null; // removed
        if (o) tile(g, o.x, o.y, 0xffd23f, this.edit!.moving ? 0.35 + 0.25 * Math.sin(this.time.now / 120) : 0.55);
    }

    /** Painted badges: restock over shelves running low (delivery once on their way), money over tills with a bill ready. */
    drawIcons(time: number) {
        const s = this.sim;
        const want: { key: string; x: number; y: number; frame: string; cmd: Command | null }[] = [];
        for (const o of s.objects) {
            if (o.category && o.type !== 'forno' && o.stock! < TAP_ICON_BELOW) {
                const busy = s.restockQueue.includes(o.id) || s.staff.some((st) => st.job?.shelfId === o.id);
                want.push({ key: `s${o.id}`, x: o.x, y: o.y, frame: busy ? 'icona_arrivo' : 'icona_restock', cmd: busy ? null : { type: 'restock', shelfId: o.id } });
            }
            if (o.type === 'cassa' && readyAt(s, o.id)) want.push({ key: `t${o.id}`, x: o.x, y: o.y, frame: 'icona_soldi', cmd: { type: 'collect', tillId: o.id } });
        }
        for (const c of s.customers)
            if (tricking(c)) want.push({ key: `f${c.id}`, x: c.x, y: c.y, frame: 'icona_beccato', cmd: { type: 'catch', customerId: c.id } });
        for (const c of s.carts) {
            const busy = s.cartQueue.includes(c.id) || s.staff.some((st) => st.cart === c.id);
            if (!busy) want.push({ key: `c${c.id}`, x: c.x, y: c.y, frame: 'icona_carrello', cmd: { type: 'removeCart', cartId: c.id } });
        }
        for (const st of s.staff) {
            if (st.state !== 'resting' && !tired(st)) continue;
            const frame = st.state === 'resting' ? 'icona_pausa' : 'icona_stanco';
            // seated at the till: drawn right of the cell centre and lower (draw.ts SEAT_PX)
            if (st.state === 'at_till') want.push({ key: `v${st.id}`, x: st.x + 0.13, y: st.y - 0.13, frame, cmd: null });
            else want.push({ key: `w${st.id}`, x: st.x, y: st.y, frame, cmd: null });
        }
        for (const p of s.spills) {
            const busy = s.cleanQueue.includes(p.id) || s.staff.some((st) => st.clean?.spillId === p.id);
            if (!busy) want.push({ key: `p${p.id}`, x: p.x, y: p.y, frame: 'icona_pulisci', cmd: { type: 'clean', spillId: p.id } });
        }
        for (const [k, t] of this.icons) {
            if (want.some((w) => w.key === k)) t.setVisible(false);
            else (t.destroy(), this.icons.delete(k)); // spill cleaned: drop its icon
        }
        const scale = 1 / Math.min(1, this.cameras.main.zoom / DPR); // keep icons finger-sized when zoomed out
        for (const w of want) {
            let t = this.icons.get(w.key);
            if (!t) {
                t = this.add.image(0, 0, 'kit', 'icona_soldi').setOrigin(0.5, 1).setDepth(9500);
                // tappable: a warm glow (WebGL filters; the canvas renderer has none and just pulses)
                if (this.renderer.type === Phaser.WEBGL) t.setData('glow', t.enableFilters().filters!.internal.addGlow(0xffe27a, 4, 0, 1, false, 8, 10).setPaddingOverride(null)); // padded: the halo isn't cut square
                this.icons.set(w.key, t);
            }
            const p = gridToIso(w.x, w.y);
            const beat = Math.sin(time / 160);
            const bob = w.cmd ? beat * 3 : 0;
            const pulse = w.cmd ? 1 + 0.07 * beat : 1; // milestone 21: tap me
            const glow = t.getData('glow') as { active: boolean; outerStrength: number } | undefined;
            if (glow) {
                glow.active = !!w.cmd;
                glow.outerStrength = 3 + 2 * beat;
            }
            const lift = ICON_LIFT[w.key[0]];
            t.setFrame(w.frame).setOrigin(0.5, 1).setPosition(p.x, p.y + TILE_H / 2 - lift + bob).setScale(scale * pulse * KIT_SCALE * (ICON_SCALE[w.key[0]] ?? 1)).setVisible(true).setData('cmd', w.cmd).setData('cell', `${w.x},${w.y}`);
        }
    }

    /** The command of the tap icon under this pointer, or (no tool active) of the object tapped. */
    iconCommand(p: Input.Pointer): Command | null {
        const c = this.cellOf(p);
        for (const t of this.icons.values()) {
            if (!t.visible || !t.getData('cmd')) continue;
            const b = t.getBounds();
            const pad = (10 * t.scaleX) / KIT_SCALE;
            const onIcon = p.worldX > b.x - pad && p.worldX < b.right + pad && p.worldY > b.y - pad && p.worldY < b.bottom + pad;
            if (onIcon || (!this.tool && t.getData('cell') === `${c.x},${c.y}`)) return t.getData('cmd');
        }
        return null;
    }

    /** Write the game to localStorage (not while the start menu still offers the old one); a finished level is erased. */
    store() {
        if (!this.saving || ['start', 'levels'].includes(this.registry.get('menu'))) return;
        if (this.sim.outcome) localStorage.removeItem(SAVE_KEY);
        else localStorage.setItem(SAVE_KEY, saveGame(this.sim));
    }

    /** "Continua": the saved game, paused. */
    continueSaved() {
        this.useState({ ...this.saved!, paused: true });
        this.registry.set('menu', null);
    }

    /** A level from scratch (0 = free shop; default: the same one again): the briefing first. */
    restart(level = this.sim.level) {
        this.useState(createState(level));
        if (this.saving) this.registry.set('menu', 'briefing');
        this.store();
    }

    useState(s: GameState) {
        this.sim = s;
        this.bears = s.happyBears;
        this.seen = { day: s.day, inspection: !!s.inspection, ...s.furbetti };
        this.heard = snap(s);
        this.registry.set('sim', this.sim);
        this.registry.set('tool', null);
        this.edit = null;
        for (const t of this.icons.values()) t.destroy();
        this.icons.clear();
        drawFloor(this.floor, this.sim);
        this.drawSign();
        this.frameLot();
    }

    /** Shop sign over the door: the level's name (milestone 21b). */
    sign: GameObjects.Text | null = null;
    drawSign() {
        this.sign?.destroy();
        this.sign = null;
        const d = this.sim.objects.find((o) => o.type === 'porta');
        if (!d) return;
        const p = gridToIso(d.x, d.y);
        const name = LEVELS[this.sim.level - 1]?.name ?? 'Il Supermercatino';
        this.sign = this.add.text(p.x + TILE_W / 4, p.y + TILE_H - 62, name, {
            fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: 9, color: '#fff3d6', backgroundColor: '#8e2a1f',
            padding: { x: 4, y: 2 }, resolution: DPR * 3,
        }).setOrigin(0.5, 1).setDepth(1 + d.x + d.y + 0.7);
    }

    run(cmd: Command) {
        const r = apply(this.sim, cmd);
        if (r.ok) {
            drawFloor(this.floor, this.sim);
            this.drawSign();
            this.store();
        }
        else this.game.events.emit('toast', r.reason);
        return r;
    }

    /** The staff member drawn under this pointer: a box over the body standing on its feet. */
    staffAt(p: Input.Pointer) {
        return this.sim.staff.find((st) => {
            const f = gridToIso(st.x, st.y);
            const dx = p.worldX - f.x, dy = p.worldY - (f.y + TILE_H / 2);
            return Math.abs(dx) < 16 && dy < 8 && dy > -52;
        });
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
        return { type: t.kind, ...c };
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
        } else if (cmd.type === 'demolish' || cmd.type === 'rotate') {
            tile(g, cmd.x, cmd.y, cmd.type === 'rotate' ? color : BAD, 0.5);
        }
    }

    /** Fit the whole lot between the HUD bars (milestone 08); pinch can't zoom out further than this. */
    frameLot() {
        const cam = this.cameras.main;
        const { w, h } = this.sim.grid;
        const wide = cam.width / DPR >= 700, low = cam.height / DPR < 500;
        // ponytail: HUD heights in CSS px (Hud.layout: top row + goal bars; bottom bar + Pina's bubble); measure from Hud if its layout changes
        const top = (wide ? 40 : 72) * DPR, bottom = (low ? 60 : 140) * DPR;
        const WALL = 64; // world px the back walls rise above the floor diamond
        const fitOf = (bw: number, bh: number) => Math.min(cam.width / (((bw + bh) * TILE_W) / 2 + 8), (cam.height - top - bottom) / (((bw + bh) * TILE_H) / 2 + WALL + 8));
        const fit = fitOf(w, h);
        this.zoomMin = Math.min(ZOOM_MIN * DPR, fit);
        // campaign (milestone 20): frame the pre-built shop, not the empty lot around it
        const rs = this.sim.level ? this.sim.rooms : [];
        const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
        const box = rs.length ? { x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 } : { x: 0, y: 0, w, h };
        cam.setZoom(Math.max(this.zoomMin, Math.min((rs.length ? 2 : 1) * DPR, fitOf(box.w, box.h))));
        const c = gridToIso(box.x + box.w / 2, box.y + box.h / 2); // centre of the framed diamond
        cam.centerOn(c.x, c.y - WALL / 2 - (top - bottom) / 2 / cam.zoom);
    }

    setupCamera() {
        const cam = this.cameras.main;
        cam.setBackgroundColor(GROUND.grass[1]); // milestone 21b: the town goes on forever
        this.frameLot();
        let w = cam.width;
        this.scale.on('resize', () => cam.width !== w && ((w = cam.width), this.frameLot())); // turned sideways: refit (not when the address bar hides)
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

        const hud = this.scene.get('Hud') as Hud;
        const onPanel = (p: Input.Pointer) => p.isDown && hud.onPanel(p.downX, p.downY);
        this.input.on('pointermove', (p: Input.Pointer) => {
            if (onPanel(p)) return;
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

        this.input.on('pointerdown', () => (this.press = { t: this.time.now }));
        this.input.on('pointerup', (p: Input.Pointer) => {
            const wasPinch = this.pinched;
            this.press = null;
            if (downPointers().length === 0) {
                this.pinch = null;
                this.pinched = false;
            }
            if (this.longFired) return void (this.longFired = false); // the long press opened the editor
            if (wasPinch || !p.leftButtonReleased() || hud.onPanel(p.downX, p.downY)) return;
            const isTap = p.getDistance() <= TAP_SLOP * DPR;
            if (isTap && this.edit) {
                if (this.edit.room) return void (this.edit = null);
                const o = this.sim.objects.find((x) => x.id === this.edit!.id)!;
                const c = this.cellOf(p);
                if (!this.edit.moving) this.edit = null; // tapped elsewhere: done
                else if (this.run({ type: 'move', x: o.x, y: o.y, toX: c.x, toY: c.y }).ok) this.edit = null;
                return;
            }
            const tapped = isTap && this.iconCommand(p);
            if (tapped) return void this.run(tapped);
            const st = isTap && !this.tool && this.staffAt(p);
            if (st) return void hud.openSheet(st.id); // the worker's card
            if (!this.tool) return;
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
        cam.setZoom(Math.min(ZOOM_MAX * DPR, Math.max(this.zoomMin, cam.zoom * f)));
    }
}
