import { Scene } from 'phaser';
import { createState, tick, advance, type GameState } from '../../sim/state.ts';
import { STEP_MS } from '../../sim/config.ts';
import { gridToIso, TILE_W, TILE_H } from '../../render/iso.ts';

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const FLOOR_A = 0xf1e4c8; // linoleum crema
const FLOOR_B = 0xb5523b; // linoleum mattone

// Draws the sim and turns input into camera moves. No game logic here (ADR-0001).
export class Game extends Scene {
    sim: GameState;
    acc = 0;
    pinchDist = 0;
    // ?manual: sim advances only through window.advanceTime (deterministic browser tests)
    manual = new URLSearchParams(location.search).has('manual');

    constructor() {
        super('Game');
    }

    create() {
        this.sim = createState();
        this.registry.set('sim', this.sim);
        this.drawFloor();
        this.setupCamera();
        this.scene.launch('Hud');

        window.render_game_to_text = () => JSON.stringify(this.sim);
        window.advanceTime = (ms: number) => advance(this.sim, ms);
    }

    update(_time: number, delta: number) {
        if (this.manual || this.sim.paused) return;
        // ponytail: cap delta so a backgrounded tab doesn't replay minutes of ticks at once
        this.acc += Math.min(delta, 250) * this.sim.speed;
        while (this.acc >= STEP_MS) {
            tick(this.sim);
            this.acc -= STEP_MS;
        }
    }

    drawFloor() {
        const g = this.add.graphics();
        const { w, h } = this.sim.grid;
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                const p = gridToIso(x, y);
                g.fillStyle((x + y) % 2 ? FLOOR_B : FLOOR_A);
                g.beginPath();
                g.moveTo(p.x, p.y);
                g.lineTo(p.x + TILE_W / 2, p.y + TILE_H / 2);
                g.lineTo(p.x, p.y + TILE_H);
                g.lineTo(p.x - TILE_W / 2, p.y + TILE_H / 2);
                g.closePath();
                g.fillPath();
            }
        }
    }

    setupCamera() {
        const cam = this.cameras.main;
        cam.setBackgroundColor('#2b1d16');
        const c = gridToIso(this.sim.grid.w / 2, this.sim.grid.h / 2);
        cam.centerOn(c.x, c.y);

        this.input.addPointer(1); // second touch for pinch
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            const down = this.input.manager.pointers.filter((q) => q.isDown);
            if (down.length >= 2) {
                const d = Math.hypot(down[0].x - down[1].x, down[0].y - down[1].y);
                if (this.pinchDist) this.zoomBy(d / this.pinchDist);
                this.pinchDist = d;
                return;
            }
            this.pinchDist = 0;
            if (!p.isDown) return;
            cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
            cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
        });
        this.input.on('pointerup', () => (this.pinchDist = 0));
        this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.zoomBy(dy > 0 ? 0.9 : 1.1));
    }

    zoomBy(f: number) {
        const cam = this.cameras.main;
        cam.setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, cam.zoom * f)));
    }
}
