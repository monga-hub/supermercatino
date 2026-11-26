import { Scene, type GameObjects } from 'phaser';
import { setSpeed, togglePause, type GameState, type Speed } from '../../sim/state.ts';
import { ROOMS, OBJECTS, CATEGORIES, ROLES, TRAITS } from '../../sim/config.ts';
import type { Command } from '../../sim/build.ts';
import { CATEGORY_COLOR, ROOM_FLOOR } from '../../render/draw.ts';
import type { Tool, Game } from './Game.ts';

const TEXT = { fontFamily: 'Arial Black', fontSize: 22, color: '#fff3d6', stroke: '#3a2418', strokeThickness: 5 };
const LIGHT = '#fff3d6';
const DARK = '#3a2418';
const BTN_BG = '#7a2e1f';
const BTN_ACTIVE_BG = '#e0a030';
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

type Btn = { t: GameObjects.Text; active: () => boolean; bg: string; fg?: string };

const STAFF_STATE: Record<string, string> = { arriving: 'in arrivo', idle: 'senza cassa', at_till: 'alla cassa' };

// Overlay scene: own camera, so it doesn't zoom/pan with the shop.
export class Hud extends Scene {
    clock: GameObjects.Text;
    money: GameObjects.Text;
    served: GameObjects.Text;
    toast: GameObjects.Text;
    speedBtns: Btn[] = [];
    toolBtns: Btn[] = [];
    catBtns: Btn[] = [];
    panel: GameObjects.Container | null = null;
    panelKey = '';

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
        this.toast = this.add.text(0, 100, '', { ...TEXT, fontSize: 18, backgroundColor: '#000000aa', padding: { x: 10, y: 6 } }).setOrigin(0.5, 0).setVisible(false).setDepth(10);

        // speed: index 0 = pause, 1..3 = speed
        this.speedBtns = ['II', '1x', '2x', '3x'].map((label, i) =>
            this.button(label, () => this.press(i), () => (this.sim.paused ? 0 : this.sim.speed) === i),
        );
        this.speedBtns.push(this.button('Staff', () => this.togglePanel(), () => !!this.panel, '#3d5a80'));

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
        kb.on('keydown-ESC', () => {
            this.setTool(null);
            this.closePanel();
        });

        this.game.events.on('toast', (msg: string) => this.showToast(msg));
        this.scale.on('resize', () => {
            this.layout();
            if (this.panel) this.openPanel();
        });
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
        // served/lost under the money, or below the speed row when the screen is narrow
        const rowEnd = Math.max(...this.speedBtns.map((b) => b.t.x + b.t.width));
        this.served.setY(rowEnd + 16 > width - 12 - this.served.width ? 92 : 44);
        // toolbar anchored to the bottom: measure, then place
        const toolsH = this.flow(this.toolBtns, 0, width);
        this.flow(this.toolBtns, height - 12 - toolsH, width);
        const catH = this.flow(this.catBtns, 0, width);
        this.flow(this.catBtns, height - 12 - toolsH - 8 - catH, width);
    }

    run(cmd: Command) {
        return (this.scene.get('Game') as Game).run(cmd);
    }

    togglePanel() {
        if (this.panel) this.closePanel();
        else this.openPanel();
    }

    closePanel() {
        this.panel?.destroy();
        this.panel = null;
    }

    /** Staff panel: candidates to hire, staff to fire. Rebuilt whenever what it shows changes. */
    openPanel() {
        this.closePanel();
        const s = this.sim;
        this.panelKey = this.staffKey();
        const { width, height } = this.scale;
        const w = Math.min(520, width - 24);
        const x0 = (width - w) / 2, y0 = 124;
        const c = (this.panel = this.add.container(0, 0).setDepth(5));
        const bg = this.add.rectangle(x0, y0, w, height - y0 - 90, 0x2b1d16, 0.96).setOrigin(0).setStrokeStyle(3, 0xe0a030);
        bg.setInteractive(); // swallow taps so they don't reach the shop below
        c.add(bg);
        let y = y0 + 12;
        const small = { ...TEXT, fontSize: 14, strokeThickness: 0, color: '#d9c7a7' };
        const row = (title: string, sub: string, label: string, cmd: Command) => {
            c.add(this.add.text(x0 + 12, y, title, { ...TEXT, fontSize: 17, strokeThickness: 0 }));
            const subT = this.add.text(x0 + 12, y + 22, sub, { ...small, wordWrap: { width: w - 140 } });
            c.add(subT);
            const b = this.add
                .text(x0 + w - 12, y + 6, label, { ...TEXT, fontSize: 16, strokeThickness: 0, backgroundColor: BTN_BG, padding: { x: 10, y: 6 } })
                .setOrigin(1, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.run(cmd);
                    this.openPanel();
                });
            c.add(b);
            y += Math.max(50, 22 + subT.height + 10);
        };
        const header = (t: string) => {
            c.add(this.add.text(x0 + 12, y, t, { ...TEXT, fontSize: 19, color: '#e0a030', strokeThickness: 0 }));
            y += 30;
        };
        c.add(
            this.add.text(x0 + w - 12, y0 + 10, '✕', { ...TEXT, fontSize: 22, strokeThickness: 0 })
                .setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.closePanel()),
        );
        header('Candidati');
        for (const k of s.candidates)
            row(`${k.name} · €${k.wage}/giorno`, `${ROLES[k.role].label} · ${TRAITS[k.trait].label}: ${TRAITS[k.trait].desc}`, 'Assumi', { type: 'hire', candidateId: k.id });
        y += 8;
        header('Assunti');
        if (!s.staff.length) {
            c.add(this.add.text(x0 + 12, y, 'Nessuno. Senza cassiere le casse non servono!', small));
            y += 30;
        }
        for (const st of s.staff)
            row(`${st.name} · €${st.wage}/giorno`, `${ROLES[st.role].label} · ${STAFF_STATE[st.state]}`, 'Licenzia', { type: 'fire', staffId: st.id });
    }

    staffKey() {
        const s = this.sim;
        return JSON.stringify([s.candidates.map((c) => c.id), s.staff.map((st) => [st.id, st.state])]);
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
        const servedText = `Serviti ${s.servedToday} · Persi ${s.lostToday}`;
        if (this.served.text !== servedText) {
            this.served.setText(servedText);
            this.layout();
        }
        for (const b of [...this.speedBtns, ...this.toolBtns, ...this.catBtns]) {
            const on = b.active();
            b.t.setBackgroundColor(on ? BTN_ACTIVE_BG : b.bg);
            b.t.setColor(on ? DARK : (b.fg ?? LIGHT));
        }
        if (this.panel && this.staffKey() !== this.panelKey) this.openPanel();
        const showCats = this.tool?.kind === 'object' && this.tool.object === 'scaffale';
        for (const b of this.catBtns) b.t.setVisible(showCats);
    }
}
