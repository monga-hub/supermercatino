import { Scene, type GameObjects, type Input } from 'phaser';
import { setSpeed, togglePause, type GameState, type Speed } from '../../sim/state.ts';
import { ROOMS, OBJECTS, CATEGORIES, ONLY_IN, ROLES, TRAITS, ORDER_UNITS, UNIT_COST, REP_MIN, DAY_OPEN_MIN, BAD_DAYS, INSPECTION_DAY } from '../../sim/config.ts';
import type { Command } from '../../sim/build.ts';
import { CATEGORY_COLOR, ROOM_FLOOR } from '../../render/draw.ts';
import { gridToIso, TILE_H } from '../../render/iso.ts';
import type { Tool, Game } from './Game.ts';
import * as audio from '../../audio/synth.ts';
import { LEVELS, FREE_AFTER, allows, goalsOf, levelOf, levelOpen, freeOpen, PROGRESS_KEY } from '../../sim/levels.ts';
import { GUIDE, NEWS, guideStep, newsDue, markSeen } from '../../sim/tutorial.ts';
import { DPR } from '../dpr.ts';

const TEXT = { fontFamily: 'Arial Black', fontSize: 22, color: '#fff3d6', stroke: '#3a2418', strokeThickness: 5, resolution: DPR };
const LIGHT = '#fff3d6';
const DARK = '#3a2418';
const BTN_BG = '#7a2e1f';
const BTN_ACTIVE_BG = '#e0a030';
const GROUP_BG = '#3d5a80';
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
/** Icon height on buttons, CSS px. */
const ICON_H = 26;
const BAR_H = 20;

/** show: hidden (and left out of the layout) when it returns false, e.g. locked in this level. */
type Btn = { t: GameObjects.Text; icon?: GameObjects.Image; active: () => boolean; bg: string; fg?: string; show?: () => boolean };
/** Bottom bar group: opens a row of items, or a panel (Staff, Merce). */
type Group = { key: string; btn: Btn; items: Btn[] };

const STAFF_STATE: Record<string, string> = { arriving: 'in arrivo', idle: 'in attesa', cleaning: 'pulisce', cart: 'sposta un carrello', resting: 'in pausa', at_till: 'al suo posto', fetching: 'va in magazzino', delivering: 'porta la merce' };

// Overlay scene: own camera (zoomed by DPR, so everything here is in CSS px), doesn't pan with the shop.
export class Hud extends Scene {
    clock: GameObjects.Text;
    dayT: GameObjects.Text;
    money: GameObjects.Text;
    bars: GameObjects.Graphics;
    barTexts: GameObjects.Text[] = [];
    toast: GameObjects.Text;
    hint: GameObjects.Text;
    arrow: GameObjects.Text;
    speedBtns: Btn[] = [];
    groups: Group[] = [];
    catBtns: Btn[] = [];
    /** Group whose items row is open. */
    open: string | null = null;
    panel: GameObjects.Container | null = null;
    /** Day summary / level outcome card, rebuilt when its content changes. */
    card: GameObjects.Container | null = null;
    cardKey = '';
    /** Pina's bubble: guide step or "Novità". */
    bubble: GameObjects.Container | null = null;
    bubbleKey = '';
    news: { key: string; text: string } | null = null;
    panelKind: 'staff' | 'merce' = 'staff';
    panelKey = '';
    panelScroll = 0;
    panelRect = { x: 0, y: 0, w: 0, h: 0 };
    /** Bottom of the top HUD and top of the bottom rows (CSS px). */
    topH = 0;
    rowsTop = 0;
    barsBox = { x: 0, y: 0, w: 0 };
    /** Level the buttons were laid out for: another level shows other buttons. */
    lvl = -1;
    /** True if (x, y) (canvas px) is on the open panel: the shop ignores gestures that start there. */
    onPanel(x: number, y: number) {
        const r = this.panelRect;
        x /= DPR;
        y /= DPR;
        return !!this.panel && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    }
    /** Scrolls the open panel's body by dy pixels (set by openPanel). */
    scrollPanel = (_dy: number) => {};

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
    /** Screen size in CSS px. */
    get W() {
        return this.scale.width / DPR;
    }
    get H() {
        return this.scale.height / DPR;
    }

    button(label: string, onClick: () => void, active: () => boolean, bg = BTN_BG, fg?: string, show?: () => boolean, frame?: string, size = 16): Btn {
        const t = this.add
            .text(0, 0, label, { ...TEXT, fontSize: size, strokeThickness: 0, backgroundColor: bg, padding: { x: 10, y: 7 } })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', onClick);
        let icon: GameObjects.Image | undefined;
        if (frame) {
            icon = this.add.image(0, 0, 'kit', frame).setOrigin(0.5).setDepth(1);
            icon.setScale(Math.min(ICON_H / icon.height, 30 / icon.width));
            t.setPadding(10 + icon.displayWidth + 5, 7, 10, 7);
        }
        return { t, icon, active, bg, fg, show };
    }

    create() {
        this.cameras.main.setZoom(DPR).setOrigin(0, 0);
        this.clock = this.add.text(10, 4, '', { ...TEXT, fontSize: 19, strokeThickness: 4 });
        this.dayT = this.add.text(10, 28, '', { ...TEXT, fontSize: 11, strokeThickness: 3 });
        this.money = this.add.text(0, 6, '', { ...TEXT, fontSize: 19, strokeThickness: 4 }).setOrigin(1, 0);
        this.bars = this.add.graphics();
        this.barTexts = [0, 1, 2].map(() => this.add.text(0, 0, '', { ...TEXT, fontSize: 12, strokeThickness: 3 }).setOrigin(0.5));
        this.hint = this.add.text(0, 0, '', { ...TEXT, fontSize: 15, strokeThickness: 4, backgroundColor: '#000000aa', padding: { x: 10, y: 6 } }).setOrigin(0.5, 0);
        this.toast = this.add.text(0, 100, '', { ...TEXT, fontSize: 17, strokeThickness: 4, backgroundColor: '#000000aa', padding: { x: 10, y: 6 }, align: 'center', wordWrap: { width: 360 } }).setOrigin(0.5, 0).setVisible(false).setDepth(10);
        this.arrow = this.add.text(0, 0, '▼', { ...TEXT, fontSize: 30, color: '#ffd23f', strokeThickness: 6 }).setOrigin(0.5, 1).setDepth(15).setVisible(false);

        // speed: index 0 = pause, 1..3 = speed
        this.speedBtns = ['II', '1x', '2x', '3x'].map((label, i) =>
            this.button(label, () => this.press(i), () => (this.sim.paused ? 0 : this.sim.speed) === i, BTN_BG, undefined, undefined, undefined, 15),
        );

        const same = (t: Tool) => JSON.stringify(this.tool) === JSON.stringify(t);
        const toggle = (t: Tool) => () => this.setTool(same(t) ? null : t);
        const isObj = (object: string) => () => this.tool?.kind === 'object' && this.tool.object === object;
        const has = (object: string) => () => allows(this.sim, 'objects', object);
        const free = () => !this.sim.level; // rooms are fixed in the campaign
        const obj = (o: keyof typeof OBJECTS, t: Tool = { kind: 'object', object: o }) =>
            this.button(`${OBJECTS[o].label} €${OBJECTS[o].cost}`, () => this.setTool(isObj(o)() ? null : t), isObj(o), BTN_BG, undefined, has(o), o, 15);
        const group = (key: string, label: string, items: Btn[], frame?: string, show?: () => boolean, onClick?: () => void): Group => ({
            key, items,
            btn: this.button(label, onClick ?? (() => this.openGroup(key)),
                () => this.open === key || (!!this.panel && this.panelKind === key), GROUP_BG, undefined, show, frame, 15),
        });

        this.groups = [
            // free shop: "Costruisci", with the rooms and the door first
            group('arredi', 'Arredi', [
                ...(Object.keys(ROOMS) as (keyof typeof ROOMS)[]).map((room) =>
                    this.button(ROOMS[room].label, toggle({ kind: 'room', room }), () => this.tool?.kind === 'room' && this.tool.room === room, hex(ROOM_FLOOR[room][1]), undefined, free, undefined, 15)),
                this.button(`Porta €${OBJECTS.porta.cost}`, toggle({ kind: 'object', object: 'porta' }), isObj('porta'), BTN_BG, undefined, free, 'porta_l', 15),
                obj('scaffale', { kind: 'object', object: 'scaffale', category: CATEGORIES[0] }),
                ...(['cassa', 'cestino', 'bancone', 'forno', 'frigo', 'armadietti'] as const).map((o) => obj(o)),
            ], 'scaffale'),
            group('staff', 'Staff', [], 'cassiere_walk_0', undefined, () => this.togglePanel('staff')),
            group('merce', 'Merce', [], 'magazziniere_carry_0', () => allows(this.sim, 'features', 'orders'), () => this.togglePanel('merce')),
            group('attrezzi', 'Attrezzi', [
                this.button('Ruota', toggle({ kind: 'rotate' }), () => this.tool?.kind === 'rotate', '#6b5a8e', undefined, undefined, undefined, 15),
                this.button('Demolisci', toggle({ kind: 'demolish' }), () => this.tool?.kind === 'demolish', '#4a4a4a', undefined, undefined, undefined, 15),
                this.button('Audio', () => audio.setMuted(!audio.muted), () => !audio.muted, GROUP_BG, undefined, undefined, undefined, 15),
            ]),
        ];
        for (const g of this.groups) g.btn.t.setPadding(g.btn.icon ? 8 + g.btn.icon.displayWidth + 4 : 8, 7, 8, 7); // tighter: the group bar fits a phone
        const special: string[] = Object.values(ONLY_IN);
        this.catBtns = CATEGORIES.filter((c) => !special.includes(c)).map((cat) => // salumi, pane, latticini: their own counter
            this.button(cat, () => this.setTool({ kind: 'object', object: 'scaffale', category: cat }),
                () => this.tool?.kind === 'object' && this.tool.category === cat, hex(CATEGORY_COLOR[cat]), DARK, undefined, undefined, 15),
        );

        const kb = this.input.keyboard!;
        kb.on('keydown-SPACE', () => this.press(0));
        kb.on('keydown-ONE', () => this.press(1));
        kb.on('keydown-TWO', () => this.press(2));
        kb.on('keydown-THREE', () => this.press(3));
        kb.on('keydown-ESC', () => {
            this.setTool(null);
            this.closePanel();
            this.open = null;
            this.layout();
        });

        this.game.events.on('toast', (msg: string) => this.showToast(msg));
        this.scale.on('resize', () => {
            this.layout();
            this.cardKey = ''; // rebuild the card and the bubble for the new size
            this.bubbleKey = '';
            if (this.panel) this.openPanel();
        });
        window.hudButtons = () => [...this.speedBtns, ...this.groups.flatMap((g) => [g.btn, ...g.items]), ...this.catBtns]
            .filter((b) => b.t.visible)
            .map((b) => ({ label: b.t.text, x: b.t.x + b.t.width / 2, y: b.t.y + b.t.height / 2, w: b.t.width, active: b.active() }));
        window.hudText = () => (this.children.list as GameObjects.Text[]).concat(...this.children.list.flatMap((c) => (c as GameObjects.Container).list ?? []) as GameObjects.Text[])
            .filter((o) => o.type === 'Text' && o.visible && o.text).map((o) => o.text);
        this.layout();
    }

    openGroup(key: string) {
        this.closePanel();
        this.open = this.open === key ? null : key;
        this.setTool(null);
        this.layout();
    }

    vis(b: Btn, v: boolean) {
        b.t.setVisible(v);
        b.icon?.setVisible(v);
    }

    /** Flow buttons left-to-right, wrapping; returns the height used. */
    flow(btns: Btn[], top: number, maxW: number, gap = 6) {
        let x = 10, y = top, rowH = 0;
        for (const b of btns) {
            if (b.show && !b.show()) {
                this.vis(b, false);
                continue;
            }
            this.vis(b, true);
            if (x + b.t.width > maxW - 10 && x > 10) {
                x = 10;
                y += rowH + gap;
                rowH = 0;
            }
            b.t.setPosition(x, y);
            b.icon?.setPosition(x + b.t.padding.left! - 5 - b.icon.displayWidth / 2, y + b.t.height / 2);
            x += b.t.width + gap;
            rowH = Math.max(rowH, b.t.height);
        }
        return y + rowH - top;
    }

    layout() {
        const { W, H } = this;
        this.lvl = this.sim?.level ?? -1;
        this.money.setX(W - 10);
        this.toast.setX(W / 2).setWordWrapWidth(Math.min(460, W - 24));
        // top: clock, speeds, money on one row; the goal bars beside them when wide, else under them
        let x = 10 + Math.max(this.clock.width, this.dayT.width, 58) + 8;
        for (const b of this.speedBtns) {
            b.t.setPosition(x, 6);
            x += b.t.width + 4;
        }
        const wide = W >= 700;
        this.barsBox = wide ? { x: x + 8, y: 10, w: W - 10 - 120 - x - 16 } : { x: 10, y: 46, w: W - 20 };
        this.topH = this.barsBox.y + BAR_H + 6;
        this.hint.setPosition(W / 2, this.topH + 6);
        this.toast.setY(this.topH + 44);
        // bottom: group bar, then the open group's items, then the shelf goods
        const groupBtns = this.groups.map((g) => g.btn);
        groupBtns[0].t.setText(this.sim?.level === 0 ? 'Costruisci' : 'Arredi');
        for (const b of groupBtns) b.t.setFontSize(W < 420 ? 14 : 15); // five groups on a narrow phone
        const gH = this.flow(groupBtns, 0, W);
        let top = H - 8 - gH;
        this.flow(groupBtns, top, W);
        for (const g of this.groups) for (const b of g.items) this.vis(b, false);
        const items = this.groups.find((g) => g.key === this.open)?.items ?? [];
        if (items.length) {
            const h = this.flow(items, 0, W);
            top -= 6 + h;
            this.flow(items, top, W);
        }
        const showCats = this.tool?.kind === 'object' && this.tool.object === 'scaffale';
        if (showCats) {
            const h = this.flow(this.catBtns, 0, W);
            top -= 6 + h;
            this.flow(this.catBtns, top, W);
        } else for (const b of this.catBtns) this.vis(b, false);
        this.rowsTop = top;
        this.bubbleKey = '';
    }

    drawBars() {
        const s = this.sim;
        const { goals: g } = goalsOf(s);
        const { x, y, w } = this.barsBox;
        const bw = (w - 12) / 3;
        const eur = (n: number) => `€${n.toLocaleString('it-IT')}`;
        const items: [number, number, string][] = [
            [s.money, g.money, `${eur(s.money)} / ${eur(g.money)}`],
            [s.reputation, g.reputation, `Rep ${s.reputation}% / ${g.reputation}%`],
            [s.servedTotal, g.served, `Serviti ${s.servedTotal} / ${g.served}`],
        ];
        const b = this.bars.clear();
        items.forEach(([v, goal, label], i) => {
            const bx = x + i * (bw + 6);
            const f = Math.max(0, Math.min(1, v / goal));
            b.fillStyle(0x000000, 0.45).fillRect(bx, y, bw, BAR_H);
            b.fillStyle(f >= 1 ? 0x4caf50 : 0xe0a030, 1).fillRect(bx, y, bw * f, BAR_H);
            b.lineStyle(2, 0x3a2418, 1).strokeRect(bx, y, bw, BAR_H);
            const t = this.barTexts[i].setPosition(bx + bw / 2, y + BAR_H / 2);
            if (t.text !== label) t.setText(label);
            t.setScale(Math.min(1, (bw - 6) / t.width));
        });
    }

    run(cmd: Command) {
        return this.game_.run(cmd);
    }

    togglePanel(kind: 'staff' | 'merce') {
        const same = this.panel && this.panelKind === kind;
        this.closePanel();
        this.open = null;
        this.setTool(null);
        this.layout();
        if (!same) {
            this.panelKind = kind;
            this.panelScroll = 0;
            this.openPanel();
        }
    }

    closePanel() {
        this.panel?.destroy();
        this.panel = null;
    }

    /** Staff panel (hire/fire) or Merce panel (order goods). Rebuilt whenever what it shows changes. */
    openPanel() {
        this.closePanel();
        const s = this.sim;
        this.panelKey = this.panelState();
        const w = Math.min(520, this.W - 24);
        // between the top bar and the bottom rows
        const x0 = (this.W - w) / 2;
        const y0 = this.topH + 4;
        const viewH = this.rowsTop - 8 - y0;
        this.panelRect = { x: x0, y: y0, w, h: viewH };
        const c = (this.panel = this.add.container(0, 0).setDepth(5));
        const bg = this.add.rectangle(x0, y0, w, viewH, 0x2b1d16, 0.96).setOrigin(0).setStrokeStyle(3, 0xe0a030);
        // swallows taps so they don't reach the shop below; drag or wheel scrolls the body
        bg.setInteractive()
            .on('pointermove', (p: Input.Pointer) => p.isDown && this.scrollPanel((p.prevPosition.y - p.y) / DPR))
            .on('wheel', (_p: unknown, _dx: number, dy: number) => this.scrollPanel(dy));
        c.add(bg);
        // scrollable body: rows outside the panel are hidden (hidden objects get no taps)
        const body = this.add.container(0, 0);
        c.add(body);
        let y = y0 + 48; // body starts under the fixed title row
        const small = { ...TEXT, fontSize: 14, strokeThickness: 0, color: '#d9c7a7' };
        const row = (title: string, sub: string, label: string, cmd: Command) => {
            body.add(this.add.text(x0 + 12, y, title, { ...TEXT, fontSize: 17, strokeThickness: 0 }));
            const subT = this.add.text(x0 + 12, y + 22, sub, { ...small, wordWrap: { width: w - 140 } });
            body.add(subT);
            const b = this.add
                .text(x0 + w - 12, y + 6, label, { ...TEXT, fontSize: 16, strokeThickness: 0, backgroundColor: BTN_BG, padding: { x: 10, y: 6 } })
                .setOrigin(1, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.run(cmd);
                    this.openPanel();
                });
            body.add(b);
            y += Math.max(50, 22 + subT.height + 10);
        };
        const header = (t: string) => {
            body.add(this.add.text(x0 + 12, y, t, { ...TEXT, fontSize: 19, color: '#e0a030', strokeThickness: 0 }));
            y += 30;
        };
        c.add(this.add.text(x0 + 12, y0 + 12, this.panelKind === 'merce' ? 'Merce in magazzino' : 'Staff', { ...TEXT, fontSize: 19, color: '#e0a030', strokeThickness: 0 }));
        c.add(
            this.add.text(x0 + w - 12, y0 + 10, '✕', { ...TEXT, fontSize: 22, strokeThickness: 0 })
                .setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.closePanel()),
        );
        if (this.panelKind === 'merce') {
            if (!s.rooms.some((r) => r.type === 'magazzino')) {
                body.add(this.add.text(x0 + 12, y, 'Costruisci un magazzino per ordinare.', small));
                y += 30;
            }
            for (const cat of CATEGORIES.filter((c) => c !== 'Pane')) // bread: the oven bakes it
                row(`${cat} · ${s.warehouse[cat]} pezzi`, `Cassa da ${ORDER_UNITS} pezzi: €${ORDER_UNITS * UNIT_COST[cat]}`, 'Ordina', { type: 'order', category: cat });
            const note = this.add.text(x0 + 12, y, 'Il magazziniere porta la merce agli scaffali quasi vuoti.', { ...small, wordWrap: { width: w - 24 } });
            body.add(note);
            y += note.height + 12;
        } else {
            header('Candidati');
            for (const k of s.candidates)
                row(`${k.name} · €${k.wage}/giorno`, `${ROLES[k.role].label} · ${TRAITS[k.trait].label}: ${TRAITS[k.trait].desc}`, 'Assumi', { type: 'hire', candidateId: k.id });
            y += 8;
            header('Assunti');
            if (!s.staff.length) {
                body.add(this.add.text(x0 + 12, y, 'Nessuno. Senza cassiere le casse non servono!', small));
                y += 30;
            }
            for (const st of s.staff)
                row(`${st.name} · €${st.wage}/giorno`, `${ROLES[st.role].label} · ${STAFF_STATE[st.state]} · energia ${Math.round(st.energy)}%`, 'Licenzia', { type: 'fire', staffId: st.id });
        }
        const maxScroll = Math.max(0, y - y0 - viewH + 8);
        const more = this.add.text(x0 + w / 2, y0 + viewH - 4, '▼ trascina per vedere il resto', { ...small, backgroundColor: '#2b1d16' }).setOrigin(0.5, 1);
        c.add(more);
        this.scrollPanel = (dy) => {
            this.panelScroll = Math.min(maxScroll, Math.max(0, this.panelScroll + dy));
            body.y = -this.panelScroll;
            for (const o of body.list as GameObjects.Text[]) {
                const top = o.y - this.panelScroll - (o.originY ?? 0) * o.height;
                o.setVisible(top >= y0 + 44 && top + o.height <= y0 + viewH - (this.panelScroll < maxScroll ? 24 : 4));
            }
            more.setVisible(this.panelScroll < maxScroll);
        };
        this.scrollPanel(0);
    }

    panelState() {
        const s = this.sim;
        return JSON.stringify([this.panelKind, s.candidates.map((c) => c.id), s.staff.map((st) => [st.id, st.state]), s.warehouse, s.rooms.length]);
    }

    showToast(msg: string) {
        this.toast.setText(msg).setVisible(true).setAlpha(1);
        this.tweens.killTweensOf(this.toast);
        this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 500, onComplete: () => this.toast.setVisible(false) });
    }

    press(i: number) {
        if (i === 0) togglePause(this.sim);
        else setSpeed(this.sim, i as Speed);
    }

    get game_(): Game {
        return this.scene.get('Game') as unknown as Game;
    }

    /** Pina's bubble above the bottom rows: a "Novità" (tap to close) or the level 1 guide step. */
    updateBubble(blocked: boolean) {
        const s = this.sim;
        const game = this.game_;
        const step = guideStep(s);
        if (step >= 0) {
            // the guide teaches these taps itself: no "Novità" for them later
            const aim = GUIDE[step].aim;
            if (NEWS.some((n) => n.key === aim) && !game.progress.seen.includes(aim)) this.remember(aim);
        } else if (!this.news && !blocked) {
            this.news = newsDue(s, game.progress.seen);
            if (this.news) this.remember(this.news.key);
        }
        const text = this.news?.text ?? (step >= 0 ? GUIDE[step].text : '');
        const show = !!text && !blocked && !this.panel;
        const key = show ? `${text}|${this.rowsTop}|${this.W}|${this.H}` : '';
        if (key === this.bubbleKey) return;
        this.bubbleKey = key;
        this.bubble?.destroy();
        this.bubble = null;
        if (!show) return;
        // phone sideways: beside the group bar, small; else above the bottom rows, leaving room for the arrow
        const low = this.H < 500;
        const g = this.groups.map((x) => x.btn.t).filter((x) => x.visible);
        const x0 = low ? Math.max(...g.map((x) => x.x + x.width)) + 10 : 10;
        const w = low ? this.W - 10 - x0 : Math.min(460, this.W - 20);
        const pina = this.add.image(0, 0, 'kit', 'signora_idle');
        pina.setOrigin(0, 1).setScale((low ? 44 : 64) / pina.height);
        const tw = w - pina.displayWidth - 28;
        const t = this.add.text(0, 0, text + (this.news ? (low ? ' (tocca per chiudere)' : '\n(tocca per chiudere)') : ''), { ...TEXT, fontSize: low ? 13 : 14, strokeThickness: 0, color: DARK, wordWrap: { width: tw }, lineSpacing: 2 });
        const h = Math.max(low ? 48 : 70, t.height + (low ? 12 : 20));
        const y0 = low ? this.H - 8 - h : this.rowsTop - 34 - h;
        const bg = this.add.rectangle(x0, y0, w, h, 0xfff3d6, 0.97).setOrigin(0).setStrokeStyle(3, 0xe0a030);
        pina.setOrigin(0, 1).setPosition(x0 + 6, y0 + h - 4);
        t.setPosition(x0 + pina.displayWidth + 16, y0 + (h - t.height) / 2);
        const c = (this.bubble = this.add.container(0, 0, [bg, pina, t]).setDepth(8));
        if (this.news) bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => (this.news = null));
        else bg.setInteractive(); // swallow taps: the shop below ignores them
        c.setData('top', y0);
    }

    remember(key: string) {
        const game = this.game_;
        game.progress = markSeen(game.progress, key);
        if (game.saving) localStorage.setItem(PROGRESS_KEY, JSON.stringify(game.progress));
    }

    /** Bouncing arrow on what the current guide step needs: a button, a room, or a tap icon. */
    updateArrow(time: number, blocked: boolean) {
        const step = guideStep(this.sim);
        const at = step < 0 || blocked || this.news ? null : this.aimAt(GUIDE[step].aim);
        this.arrow.setVisible(!!at);
        if (at) this.arrow.setPosition(at.x, at.y - 2 + Math.sin(time / 150) * 5);
    }

    aimAt(aim: string): { x: number; y: number } | null {
        const top = (b: Btn) => (b.t.visible ? { x: b.t.x + b.t.width / 2, y: b.t.y } : null);
        const grp = (k: string) => this.groups.find((g) => g.key === k)!;
        const game = this.game_;
        const cam = game.cameras.main;
        const toHud = (wx: number, wy: number) => ({ x: ((wx - cam.worldView.x) * cam.zoom) / DPR, y: ((wy - cam.worldView.y) * cam.zoom) / DPR });
        if (aim === 'scaffale' || aim === 'cassa') {
            if (this.tool?.kind === 'object' && this.tool.object === aim) {
                const r = this.sim.rooms.find((x) => x.type === OBJECTS[aim].room);
                if (!r) return null;
                const p = gridToIso(r.x + (r.w - 1) / 2, r.y + (r.h - 1) / 2);
                return toHud(p.x, p.y + TILE_H / 2);
            }
            const arr = grp('arredi');
            return this.open === 'arredi' ? top(arr.items[aim === 'scaffale' ? 0 : 1]) : top(arr.btn);
        }
        if (aim === 'staff') return this.panel ? null : top(grp('staff').btn);
        if (aim === 'play') return top(this.speedBtns[1]);
        const frame = aim === 'collect' ? 'icona_soldi' : 'icona_restock';
        for (const i of game.icons.values())
            if (i.visible && i.frame.name === frame) return toHud(i.x, i.y - i.displayHeight);
        return null;
    }

    /** Start menu, campaign levels, level briefing, closing summary or level outcome. Blocks taps on the shop below. */
    showCard() {
        const s = this.sim;
        const game = this.game_;
        const menu = this.registry.get('menu') as 'start' | 'levels' | 'briefing' | null;
        const key = JSON.stringify([menu, s.level, s.summary, s.outcome, game.progress.won]);
        if (key === this.cardKey) return;
        this.cardKey = key;
        this.card?.destroy();
        this.card = null;
        const eur = (n: number) => `€${n.toLocaleString('it-IT')}`;
        const { goals: g, days } = goalsOf(s);
        const lv = levelOf(s);
        const close = () => this.registry.set('menu', null);
        const toMenu = { label: 'Menu', fn: () => { game.saved = null; this.registry.set('menu', 'levels'); } }; // the finished level erased its save
        if (menu === 'start')
            return this.drawCard('Il Supermercatino', [
                'Un supermercato di quartiere, anni \'80.',
                'Arreda, assumi, rifornisci e servi i clienti.',
            ], [
                ...(game.saved ? [{ label: 'Continua', fn: () => game.continueSaved() }] : []),
                { label: 'Campagna', fn: () => this.registry.set('menu', 'levels') },
                ...(freeOpen(game.progress) ? [{ label: 'Negozio libero', fn: () => game.restart(0) }] : []),
            ]);
        if (menu === 'levels')
            return this.drawCard('Campagna', [
                'Ogni negozio è già costruito: tu metti gli arredi, assumi e servi.',
                `Il Negozio libero si apre dopo il livello ${FREE_AFTER}.`,
            ], [
                ...LEVELS.map((l, i) => {
                    const n = i + 1, open = levelOpen(game.progress, n);
                    return open
                        ? { label: `${n}. ${l.name}${game.progress.won.includes(n) ? ' ✓' : ''}`, fn: () => game.restart(n) }
                        : { label: `🔒 ${n}. ${l.name}`, fn: () => this.showToast(`Vinci prima il livello ${n - 1}`) };
                }),
                { label: 'Indietro', fn: () => this.registry.set('menu', 'start') },
            ]);
        if (menu === 'briefing')
            return this.drawCard(lv ? `Livello ${s.level}: ${lv.name}` : 'Negozio libero', [
                ...(lv ? [lv.blurb, ''] : []),
                `Hai ${days} giorni per arrivare a:`,
                `• Cassa ${eur(g.money)}`,
                `• Reputazione ${g.reputation}%`,
                `• ${g.served} clienti serviti`,
                ...(lv ? ['', 'Novità:', ...lv.news.map((x) => `• ${x}`)] : []),
                '',
                `Perdi se chiudi ${BAD_DAYS} giorni di fila in rosso o con la reputazione sotto il ${REP_MIN}%.`,
            ], [{ label: 'Inizia', fn: close }]);
        const sum = s.summary;
        if (!sum) return;
        const mark = (ok: boolean) => (ok ? '✓' : '✗');
        const o = s.outcome;
        const compact = this.H < 500; // phone held sideways
        const body = [
            `Incasso: ${eur(sum.income)}`,
            ...(compact
                ? [`Merce: −${eur(sum.goods)} · Stipendi: −${eur(sum.wages)} · Affitto: −${eur(sum.rent)}`]
                : [`Merce: −${eur(sum.goods)}`, `Stipendi: −${eur(sum.wages)}`, `Affitto: −${eur(sum.rent)}`]),
            `Serviti ${sum.served} · Persi ${sum.lost}`,
            '',
            'Obiettivi:',
            `${mark(sum.money >= g.money)} Cassa ${eur(sum.money)} / ${eur(g.money)}`,
            `${mark(sum.reputation >= g.reputation)} Reputazione ${sum.reputation}% / ${g.reputation}%`,
            `${mark(s.servedTotal >= g.served)} Serviti ${s.servedTotal} / ${g.served}`,
        ];
        if (!o && sum.day === INSPECTION_DAY - 1 && allows(s, 'features', 'inspection')) body.push('', 'Domani passa l\'ispettore sanitario: tieni pulito!');
        if (o) body.push('', o.reason);
        else if (sum.reputation < REP_MIN) body.push('', `Attenzione: reputazione sotto il ${REP_MIN}%. Un'altra chiusura così e perdi.`);
        else if (sum.money < 0) body.push('', 'Attenzione: cassa in rosso. Un\'altra chiusura così e perdi.');
        const next = o?.win && s.level && s.level < LEVELS.length ? [{ label: 'Livello successivo', fn: () => game.restart(s.level + 1) }] : [];
        const end = [...next, { label: o?.win ? 'Rigioca' : 'Riprova', fn: () => game.restart() }, ...(s.level ? [toMenu] : [])];
        this.drawCard(o ? (o.win ? 'Hai vinto!' : 'Hai perso') : `Fine giornata ${sum.day} di ${days}`, body,
            o ? end : [{ label: 'Continua', fn: () => this.run({ type: 'continue' }) }],
            !!o && !o.win);
    }

    /** Centred card over a dark shade: title, text, stacked buttons. */
    drawCard(title: string, body: string[], buttons: { label: string; fn: () => void }[], bad = false) {
        this.closePanel();
        const { W: width, H: height } = this;
        const compact = height < 500;
        if (compact) body = body.filter((l) => l !== '');
        const w = Math.min(compact ? 560 : 420, width - 24);
        const c = (this.card = this.add.container(0, 0).setDepth(20));
        c.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0).setInteractive());
        const x0 = (width - w) / 2;
        const titleT = this.add.text(x0 + 16, 0, title, { ...TEXT, fontSize: 22, color: bad ? '#ff8a7a' : '#e0a030', strokeThickness: 0 });
        const bodyT = this.add.text(x0 + 16, 0, body.join('\n'), { ...TEXT, fontSize: compact ? 14 : 15, strokeThickness: 0, lineSpacing: compact ? 1 : 4, wordWrap: { width: w - 32 } });
        const btns = buttons.map((b) => this.add
            .text(0, 0, b.label, { ...TEXT, fontSize: 19, strokeThickness: 0, backgroundColor: BTN_ACTIVE_BG, color: DARK, padding: { x: 18, y: 9 } })
            .setOrigin(0.5, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', b.fn));
        const btnsH = btns.reduce((h, b) => h + b.height + 10, -10);
        const h = 16 + titleT.height + 10 + bodyT.height + 16 + btnsH + 16;
        const y0 = Math.max(8, (height - h) / 2);
        const bg = this.add.rectangle(x0, y0, w, h, 0x2b1d16, 0.97).setOrigin(0).setStrokeStyle(3, 0xe0a030);
        titleT.setY(y0 + 16);
        bodyT.setY(titleT.y + titleT.height + 10);
        let y = bodyT.y + bodyT.height + 16;
        for (const b of btns) {
            b.setPosition(width / 2, y);
            y += b.height + 10;
        }
        c.add([bg, titleT, bodyT, ...btns]);
    }

    /** Tool last laid out for: the goods row shows with the shelf tool. */
    toolKey = '';

    update(time: number) {
        const s = this.sim;
        const hh = String(Math.floor(s.clockSec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((s.clockSec % 3600) / 60)).padStart(2, '0');
        const { days } = goalsOf(s);
        this.clock.setText(`${hh}:${mm}`);
        this.dayT.setText(`giorno ${s.day} di ${days}`);
        this.money.setText(`€ ${s.money.toLocaleString('it-IT')}`);
        const toolKey = JSON.stringify(this.tool);
        if (s.level !== this.lvl || toolKey !== this.toolKey) {
            this.toolKey = toolKey;
            this.layout();
        }
        this.drawBars();
        for (const b of [...this.speedBtns, ...this.groups.flatMap((g) => [g.btn, ...g.items]), ...this.catBtns]) {
            const on = b.active();
            b.t.setBackgroundColor(on ? BTN_ACTIVE_BG : b.bg);
            b.t.setColor(on ? DARK : (b.fg ?? LIGHT));
        }
        const menu = this.registry.get('menu');
        const blocked = !!(menu || s.summary || s.outcome);
        const fresh = s.day === 1 && s.clockSec === DAY_OPEN_MIN * 60;
        this.hint.setText(fresh ? (s.level ? 'Metti gli arredi, assumi, poi premi 1x' : 'Costruisci il negozio, poi premi 1x') : 'In pausa: premi 1x')
            .setVisible(s.paused && !blocked && !this.panel && guideStep(s) < 0);
        if (this.panel && this.panelState() !== this.panelKey) this.openPanel();
        this.showCard();
        this.updateBubble(blocked);
        this.updateArrow(time, blocked);
    }
}
