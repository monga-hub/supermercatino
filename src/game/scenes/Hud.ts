import { Scene, type GameObjects, type Input } from 'phaser';
import { setSpeed, togglePause, type GameState, type Speed } from '../../sim/state.ts';
import { ROOMS, OBJECTS, CATEGORIES, ONLY_IN, ROLES, TRAITS, ORDER_UNITS, UNIT_COST, REP_MIN, DAY_OPEN_MIN, BAD_DAYS, INSPECTION_DAY } from '../../sim/config.ts';
import type { Command } from '../../sim/build.ts';
import { CATEGORY_COLOR, ROOM_FLOOR } from '../../render/draw.ts';
import type { Tool, Game } from './Game.ts';
import * as audio from '../../audio/synth.ts';
import { LEVELS, FREE_AFTER, allows, goalsOf, levelOf, levelOpen, freeOpen } from '../../sim/levels.ts';

const TEXT = { fontFamily: 'Arial Black', fontSize: 22, color: '#fff3d6', stroke: '#3a2418', strokeThickness: 5 };
const LIGHT = '#fff3d6';
const DARK = '#3a2418';
const BTN_BG = '#7a2e1f';
const BTN_ACTIVE_BG = '#e0a030';
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

/** show: hidden (and left out of the layout) when it returns false, e.g. locked in this level. */
type Btn = { t: GameObjects.Text; active: () => boolean; bg: string; fg?: string; show?: () => boolean };

const STAFF_STATE: Record<string, string> = { arriving: 'in arrivo', idle: 'in attesa', cleaning: 'pulisce', cart: 'sposta un carrello', resting: 'in pausa', at_till: 'al suo posto', fetching: 'va in magazzino', delivering: 'porta la merce' };

// Overlay scene: own camera, so it doesn't zoom/pan with the shop.
export class Hud extends Scene {
    clock: GameObjects.Text;
    money: GameObjects.Text;
    served: GameObjects.Text;
    toast: GameObjects.Text;
    hint: GameObjects.Text;
    speedBtns: Btn[] = [];
    toolBtns: Btn[] = [];
    catBtns: Btn[] = [];
    panel: GameObjects.Container | null = null;
    /** Day summary / level outcome card, rebuilt when its content changes. */
    card: GameObjects.Container | null = null;
    cardKey = '';
    panelKind: 'staff' | 'merce' = 'staff';
    panelKey = '';
    panelScroll = 0;
    panelRect = { x: 0, y: 0, w: 0, h: 0 };
    /** Level the buttons were laid out for: another level shows other buttons. */
    lvl = -1;
    /** True if (x, y) is on the open panel: the shop ignores gestures that start there. */
    onPanel(x: number, y: number) {
        const r = this.panelRect;
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

    button(label: string, onClick: () => void, active: () => boolean, bg = BTN_BG, fg?: string, show?: () => boolean): Btn {
        const t = this.add
            .text(0, 0, label, { ...TEXT, fontSize: 17, strokeThickness: 0, backgroundColor: bg, padding: { x: 10, y: 7 } })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', onClick);
        return { t, active, bg, fg, show };
    }

    create() {
        this.clock = this.add.text(12, 12, '', TEXT);
        this.money = this.add.text(0, 12, '', TEXT).setOrigin(1, 0);
        this.served = this.add.text(0, 44, '', { ...TEXT, fontSize: 14, strokeThickness: 4, align: 'right' }).setOrigin(1, 0);
        this.hint = this.add.text(0, 0, '', { ...TEXT, fontSize: 16, backgroundColor: '#000000aa', padding: { x: 10, y: 6 } }).setOrigin(0.5, 0);
        this.toast = this.add.text(0, 100, '', { ...TEXT, fontSize: 18, backgroundColor: '#000000aa', padding: { x: 10, y: 6 } }).setOrigin(0.5, 0).setVisible(false).setDepth(10);

        // speed: index 0 = pause, 1..3 = speed
        this.speedBtns = ['II', '1x', '2x', '3x'].map((label, i) =>
            this.button(label, () => this.press(i), () => (this.sim.paused ? 0 : this.sim.speed) === i),
        );
        this.speedBtns.push(
            this.button('Staff', () => this.togglePanel('staff'), () => !!this.panel && this.panelKind === 'staff', '#3d5a80'),
            this.button('Merce', () => this.togglePanel('merce'), () => !!this.panel && this.panelKind === 'merce', '#3d5a80', undefined, () => allows(this.sim, 'features', 'orders')),
            this.button('Audio', () => audio.setMuted(!audio.muted), () => !audio.muted, '#3d5a80'),
        );

        const same = (t: Tool) => JSON.stringify(this.tool) === JSON.stringify(t);
        const toggle = (t: Tool) => () => this.setTool(same(t) ? null : t);
        const isRoom = (room: string) => () => this.tool?.kind === 'room' && this.tool.room === room;
        const isObj = (object: string) => () => this.tool?.kind === 'object' && this.tool.object === object;
        const has = (object: string) => () => allows(this.sim, 'objects', object);
        const free = () => !this.sim.level; // rooms are fixed in the campaign

        this.toolBtns = [
            ...(Object.keys(ROOMS) as (keyof typeof ROOMS)[]).map((room) =>
                this.button(ROOMS[room].label, toggle({ kind: 'room', room }), isRoom(room), hex(ROOM_FLOOR[room][1]), undefined, free),
            ),
            this.button(OBJECTS.porta.label, toggle({ kind: 'object', object: 'porta' }), isObj('porta'), BTN_BG, undefined, free),
            this.button(OBJECTS.scaffale.label, () => this.setTool(isObj('scaffale')() ? null : { kind: 'object', object: 'scaffale', category: CATEGORIES[0] }), isObj('scaffale'), BTN_BG, undefined, has('scaffale')),
            this.button(OBJECTS.cassa.label, toggle({ kind: 'object', object: 'cassa' }), isObj('cassa'), BTN_BG, undefined, has('cassa')),
            this.button(OBJECTS.cestino.label, toggle({ kind: 'object', object: 'cestino' }), isObj('cestino'), BTN_BG, undefined, has('cestino')),
            ...(['bancone', 'forno', 'frigo', 'armadietti'] as const).map((object) => this.button(OBJECTS[object].label, toggle({ kind: 'object', object }), isObj(object), BTN_BG, undefined, has(object))),
            this.button('Ruota', toggle({ kind: 'rotate' }), () => this.tool?.kind === 'rotate', '#6b5a8e'),
            this.button('Demolisci', toggle({ kind: 'demolish' }), () => this.tool?.kind === 'demolish', '#4a4a4a'),
        ];
        const special: string[] = Object.values(ONLY_IN);
        this.catBtns = CATEGORIES.filter((c) => !special.includes(c)).map((cat) => // salumi, pane, latticini: their own counter
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
            this.cardKey = ''; // rebuild the card for the new size
            if (this.panel) this.openPanel();
        });
        this.layout();
    }

    /** Flow buttons left-to-right, wrapping; returns the height used. */
    flow(btns: Btn[], top: number, maxW: number, gap = 6) {
        let x = 12, y = top, rowH = 0;
        for (const b of btns) {
            if (b.show) b.t.setVisible(b.show());
            if (!b.t.visible && b.show) continue;
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
        const rowsEnd = Math.max(...this.speedBtns.map((b) => b.t.y + b.t.height));
        this.served.setY(rowEnd + 16 > width - 12 - this.served.width || rowsEnd > 92 ? rowsEnd + 8 : 44);
        this.hint.setPosition(width / 2, this.served.y + this.served.height + 8);
        // toolbar anchored to the bottom: measure, then place
        this.lvl = this.sim?.level ?? -1;
        const toolsH = this.flow(this.toolBtns, 0, width);
        this.flow(this.toolBtns, height - 12 - toolsH, width);
        const catH = this.flow(this.catBtns, 0, width);
        this.flow(this.catBtns, height - 12 - toolsH - 8 - catH, width);
    }

    run(cmd: Command) {
        return this.game_.run(cmd);
    }

    togglePanel(kind: 'staff' | 'merce') {
        const same = this.panel && this.panelKind === kind;
        this.closePanel();
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
        const { width } = this.scale;
        const w = Math.min(520, width - 24);
        // between the top bar and the toolbar
        const x0 = (width - w) / 2;
        const y0 = Math.max(...this.speedBtns.map((b) => b.t.y + b.t.height), this.served.y + this.served.height) + 8;
        const viewH = Math.min(...this.toolBtns.filter((b) => b.t.visible).map((b) => b.t.y)) - 8 - y0;
        this.panelRect = { x: x0, y: y0, w, h: viewH };
        const c = (this.panel = this.add.container(0, 0).setDepth(5));
        const bg = this.add.rectangle(x0, y0, w, viewH, 0x2b1d16, 0.96).setOrigin(0).setStrokeStyle(3, 0xe0a030);
        // swallows taps so they don't reach the shop below; drag or wheel scrolls the body
        bg.setInteractive()
            .on('pointermove', (p: Input.Pointer) => p.isDown && this.scrollPanel(p.prevPosition.y - p.y))
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
        this.tweens.add({ targets: this.toast, alpha: 0, delay: 1500, duration: 500, onComplete: () => this.toast.setVisible(false) });
    }

    press(i: number) {
        if (i === 0) togglePause(this.sim);
        else setSpeed(this.sim, i as Speed);
    }

    get game_(): Game {
        return this.scene.get('Game') as unknown as Game;
    }

    /** Start menu, campaign levels, level briefing, closing summary or level outcome. Blocks taps on the shop below. */
    showCard() {
        const s = this.sim;
        const game = this.game_;
        const menu = this.registry.get('menu') as 'start' | 'levels' | 'briefing' | null;
        const key = JSON.stringify([menu, s.level, s.summary, s.outcome, game.progress]);
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
        const compact = this.scale.height < 500; // phone held sideways
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
        const { width, height } = this.scale;
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

    update() {
        const s = this.sim;
        const hh = String(Math.floor(s.clockSec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((s.clockSec % 3600) / 60)).padStart(2, '0');
        if (s.level !== this.lvl) this.layout();
        const { goals: g, days } = goalsOf(s);
        this.clock.setText(`Giorno ${s.day}/${days}   ${hh}:${mm}`);
        this.money.setText(`€ ${s.money.toLocaleString('it-IT')}`);
        const servedText = `Serviti ${s.servedToday} · Persi ${s.lostToday} · Rep ${s.reputation}%\n`
            + `Obiettivi: €${g.money.toLocaleString('it-IT')} · rep ${g.reputation}% · serviti ${s.servedTotal}/${g.served}`;
        if (this.served.text !== servedText) {
            this.served.setText(servedText);
            this.layout();
        }
        for (const b of [...this.speedBtns, ...this.toolBtns, ...this.catBtns]) {
            const on = b.active();
            b.t.setBackgroundColor(on ? BTN_ACTIVE_BG : b.bg);
            b.t.setColor(on ? DARK : (b.fg ?? LIGHT));
        }
        const fresh = s.day === 1 && s.clockSec === DAY_OPEN_MIN * 60;
        this.hint.setText(fresh ? (s.level ? 'Metti scaffali e cassa, assumi, poi premi 1x' : 'Costruisci il negozio, poi premi 1x') : 'In pausa: premi 1x')
            .setVisible(s.paused && !s.summary && !s.outcome && !this.registry.get('menu'));
        if (this.panel && this.panelState() !== this.panelKey) this.openPanel();
        this.showCard();
        const showCats = this.tool?.kind === 'object' && this.tool.object === 'scaffale';
        for (const b of this.catBtns) b.t.setVisible(showCats);
    }
}
