import { Scene, type GameObjects } from 'phaser';
import { setSpeed, togglePause, type GameState, type Speed } from '../../sim/state.ts';
import { ROOMS, OBJECTS, CATEGORIES } from '../../sim/config.ts';
import { CATEGORY_COLOR, ROOM_FLOOR } from '../../render/draw.ts';
import type { Tool } from './Game.ts';

const TEXT = { fontFamily: 'Arial Black', fontSize: 22, color: '#fff3d6', stroke: '#3a2418', strokeThickness: 5 };
const LIGHT = '#fff3d6';
const DARK = '#3a2418';
const BTN_BG = '#7a2e1f';
const BTN_ACTIVE_BG = '#e0a030';
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

type Btn = { t: GameObjects.Text; active: () => boolean; bg: string; fg?: string };

// Overlay scene: own camera, so it doesn't zoom/pan with the shop.
export class Hud extends Scene {
    clock: GameObjects.Text;
    money: GameObjects.Text;
    served: GameObjects.Text;
    toast: GameObjects.Text;
    speedBtns: Btn[] = [];
    toolBtns: Btn[] = [];
    catBtns: Btn[] = [];

    constructor() {
        super('Hud');
    }

    get sim(): GameState {
        return this.registry.get('sim');
    }
    get tool(): Tool {
        return this.registry.get('tool');
    }
    setTool(t: Tool) {
        this.registry.set('tool', t);
    }

    button(label: string, onClick: () => void, active: () => boolean, bg = BTN_BG, fg?: string): Btn {
        const t = this.add
            .text(0, 0, label, { ...TEXT, fontSize: 17, strokeThickness: 0, backgroundColor: bg, padding: { x: 10, y: 7 } })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', onClick);
        return { t, active, bg, fg };
    }

    create() {
        this.clock = this.add.text(12, 12, '', TEXT);
        this.money = this.add.text(0, 12, '', TEXT).setOrigin(1, 0);
        this.served = this.add.text(0, 44, '', { ...TEXT, fontSize: 16, strokeThickness: 4 }).setOrigin(1, 0);
        this.toast = this.add.text(0, 100, '', { ...TEXT, fontSize: 18, backgroundColor: '#000000aa', padding: { x: 10, y: 6 } }).setOrigin(0.5, 0).setVisible(false);

        // speed: index 0 = pause, 1..3 = speed
        this.speedBtns = ['II', '1x', '2x', '3x'].map((label, i) =>
            this.button(label, () => this.press(i), () => (this.sim.paused ? 0 : this.sim.speed) === i),
        );

        const same = (t: Tool) => JSON.stringify(this.tool) === JSON.stringify(t);
        const toggle = (t: Tool) => () => this.setTool(same(t) ? null : t);
        const isRoom = (room: string) => () => this.tool?.kind === 'room' && this.tool.room === room;
        const isObj = (object: string) => () => this.tool?.kind === 'object' && this.tool.object === object;

        this.toolBtns = [
            ...(Object.keys(ROOMS) as (keyof typeof ROOMS)[]).map((room) =>
                this.button(ROOMS[room].label, toggle({ kind: 'room', room }), isRoom(room), hex(ROOM_FLOOR[room][1])),
            ),
            this.button(OBJECTS.porta.label, toggle({ kind: 'object', object: 'porta' }), isObj('porta')),
            this.button(OBJECTS.scaffale.label, () => this.setTool(isObj('scaffale')() ? null : { kind: 'object', object: 'scaffale', category: CATEGORIES[0] }), isObj('scaffale')),
            this.button(OBJECTS.cassa.label, toggle({ kind: 'object', object: 'cassa' }), isObj('cassa')),
            this.button('Demolisci', toggle({ kind: 'demolish' }), () => this.tool?.kind === 'demolish', '#4a4a4a'),
        ];
        this.catBtns = CATEGORIES.map((cat) =>
            this.button(cat, () => this.setTool({ kind: 'object', object: 'scaffale', category: cat }),
                () => this.tool?.kind === 'object' && this.tool.category === cat, hex(CATEGORY_COLOR[cat]), DARK),
        );

        const kb = this.input.keyboard!;
        kb.on('keydown-SPACE', () => this.press(0));
        kb.on('keydown-ONE', () => this.press(1));
        kb.on('keydown-TWO', () => this.press(2));
        kb.on('keydown-THREE', () => this.press(3));
        kb.on('keydown-ESC', () => this.setTool(null));

        this.game.events.on('toast', (msg: string) => this.showToast(msg));
        this.scale.on('resize', () => this.layout());
        this.layout();
    }

    /** Flow buttons left-to-right, wrapping; returns the height used. */
    flow(btns: Btn[], top: number, maxW: number, gap = 6) {
        let x = 12, y = top, rowH = 0;
        for (const b of btns) {
            if (x + b.t.width > maxW - 12 && x > 12) {
                x = 12;
                y += rowH + gap;
                rowH = 0;
            }
            b.t.setPosition(x, y);
            x += b.t.width + gap;
            rowH = Math.max(rowH, b.t.height);
        }
        return y + rowH - top;
    }

    layout() {
        const { width, height } = this.scale;
        this.money.setX(width - 12);
        this.served.setX(width - 12);
        this.toast.setX(width / 2);
        this.flow(this.speedBtns, 50, width);
        // toolbar anchored to the bottom: measure, then place
        const toolsH = this.flow(this.toolBtns, 0, width);
        this.flow(this.toolBtns, height - 12 - toolsH, width);
        const catH = this.flow(this.catBtns, 0, width);
        this.flow(this.catBtns, height - 12 - toolsH - 8 - catH, width);
    }

    showToast(msg: string) {
        this.toast.setText(msg).setVisible(true).setAlpha(1);
        this.tweens.killTweensOf(this.toast);
        this.tweens.add({ targets: this.toast, alpha: 0, delay: 1500, duration: 500, onComplete: () => this.toast.setVisible(false) });
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
        this.money.setText(`€ ${s.money.toLocaleString('it-IT')}`);
        this.served.setText(`Serviti ${s.servedToday} · Persi ${s.lostToday}`);
        for (const b of [...this.speedBtns, ...this.toolBtns, ...this.catBtns]) {
            const on = b.active();
            b.t.setBackgroundColor(on ? BTN_ACTIVE_BG : b.bg);
            b.t.setColor(on ? DARK : (b.fg ?? LIGHT));
        }
        const showCats = this.tool?.kind === 'object' && this.tool.object === 'scaffale';
        for (const b of this.catBtns) b.t.setVisible(showCats);
    }
}
