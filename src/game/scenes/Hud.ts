import { Scene } from 'phaser';
import { setSpeed, togglePause, type GameState, type Speed } from '../../sim/state.ts';

const TEXT = { fontFamily: 'Arial Black', fontSize: 22, color: '#fff3d6', stroke: '#3a2418', strokeThickness: 5 };
const BTN_BG = '#7a2e1f';
const BTN_ACTIVE_BG = '#e0a030';

// Overlay scene: own camera, so it doesn't zoom/pan with the shop.
export class Hud extends Scene {
    clock: Phaser.GameObjects.Text;
    buttons: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('Hud');
    }

    get sim(): GameState {
        return this.registry.get('sim');
    }

    create() {
        this.clock = this.add.text(16, 16, '', TEXT);

        // index 0 = pause, 1..3 = speed
        ['II', '1x', '2x', '3x'].forEach((label, i) => {
            const b = this.add
                .text(16 + i * 62, 58, label, { ...TEXT, fontSize: 20, strokeThickness: 0, backgroundColor: BTN_BG, padding: { x: 12, y: 6 } })
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.press(i));
            this.buttons.push(b);
        });

        const kb = this.input.keyboard!;
        kb.on('keydown-SPACE', () => this.press(0));
        kb.on('keydown-ONE', () => this.press(1));
        kb.on('keydown-TWO', () => this.press(2));
        kb.on('keydown-THREE', () => this.press(3));
    }

    press(i: number) {
        if (i === 0) togglePause(this.sim);
        else setSpeed(this.sim, i as Speed);
    }

    update() {
        const s = this.sim;
        const hh = String(Math.floor(s.clockSec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((s.clockSec % 3600) / 60)).padStart(2, '0');
        this.clock.setText(`Giorno ${s.day}   ${hh}:${mm}`);
        const active = s.paused ? 0 : s.speed;
        this.buttons.forEach((b, i) => {
            b.setBackgroundColor(i === active ? BTN_ACTIVE_BG : BTN_BG);
            b.setColor(i === active ? '#3a2418' : '#fff3d6');
        });
    }
}
