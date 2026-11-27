// Campaign (milestone 20, ADR-0003): pre-built shops, each unlocking a few mechanics. Pure data + helpers.
import { LEVEL, CATEGORIES, ONLY_IN } from './config.ts';
import type { GameState, RoomType, ObjectType, Category, Role, CustomerKind } from './state.ts';

export type Feature = 'orders' | 'spills' | 'carts' | 'inspection' | 'tiredness';
export type Level = {
    name: string;
    blurb: string;
    /** "Novità" lines on the briefing. */
    news: string[];
    grid: { w: number; h: number };
    rooms: { type: RoomType; x: number; y: number; w: number; h: number }[];
    door: { x: number; y: number };
    money: number;
    days: number;
    goals: { money: number; reputation: number; served: number };
    warehouse: Partial<Record<Category, number>>;
    objects: ObjectType[];
    roles: Role[];
    customers: CustomerKind[];
    features: Feature[];
};

export const LEVELS: Level[] = [
    {
        name: 'Alimentari da Pina',
        blurb: 'La bottega sotto casa: la signora Pina va in pensione e la lascia a te.',
        news: [
            'Metti gli scaffali nella sala e la cassa nell\'area casse.',
            'Assumi un cassiere e un magazziniere dal tasto Staff.',
            'Tocca 💰 sulla cassa: incassi subito, con la mancia.',
            'Tocca 📦 su uno scaffale che si svuota: il magazziniere lo riempie prima.',
        ],
        grid: { w: 12, h: 12 },
        rooms: [
            { type: 'magazzino', x: 1, y: 3, w: 3, h: 3 },
            { type: 'sala_vendita', x: 4, y: 3, w: 6, h: 5 },
            { type: 'area_casse', x: 4, y: 8, w: 3, h: 2 },
        ],
        door: { x: 9, y: 5 },
        money: 1500,
        days: 1, // playtest 2026-11-27: two days of the same taps were boring
        goals: { money: 850, reputation: 45, served: 45 },
        warehouse: { Pasta: 120, Frutta: 120, Detersivi: 120 },
        objects: ['scaffale', 'cassa'],
        roles: ['cassiere', 'magazziniere'],
        customers: ['signora', 'vecchietta'],
        features: [],
    },
    {
        name: 'Minimarket Il Girasole',
        blurb: 'Un minimarket di quartiere: più clienti, e la merce adesso la ordini tu.',
        news: [
            'Il magazzino è quasi vuoto: ordina la merce dal tasto Merce.',
            'Arrivano le mamme col bambino.',
        ],
        grid: { w: 14, h: 13 },
        rooms: [
            { type: 'magazzino', x: 1, y: 3, w: 3, h: 4 },
            { type: 'sala_vendita', x: 4, y: 3, w: 8, h: 6 },
            { type: 'area_casse', x: 4, y: 9, w: 5, h: 2 },
        ],
        door: { x: 11, y: 6 },
        money: 2000,
        days: 3,
        goals: { money: 1800, reputation: 60, served: 150 },
        warehouse: { Pasta: 20, Frutta: 20, Detersivi: 20 },
        objects: ['scaffale', 'cassa'],
        roles: ['cassiere', 'magazziniere'],
        customers: ['signora', 'mamma', 'vecchietta'],
        features: ['orders'],
    },
    {
        name: 'Superette San Rocco',
        blurb: 'Una superette in piazza: tanta gente, e qualcuno rovescia lo yogurt.',
        news: [
            'I clienti rovesciano lo yogurt: assumi un addetto pulizie.',
            'Tocca una macchia per farla pulire subito.',
            'Il cestino dimezza le macchie lì intorno.',
            'Arrivano i giovani: veloci e impazienti.',
        ],
        grid: { w: 16, h: 14 },
        rooms: [
            { type: 'magazzino', x: 1, y: 2, w: 3, h: 4 },
            { type: 'sala_vendita', x: 4, y: 2, w: 10, h: 7 },
            { type: 'area_casse', x: 4, y: 9, w: 7, h: 2 },
        ],
        door: { x: 13, y: 5 },
        money: 2500,
        days: 4,
        goals: { money: 2000, reputation: 60, served: 220 },
        warehouse: { Pasta: 20, Frutta: 20, Detersivi: 20 },
        objects: ['scaffale', 'cassa', 'cestino'],
        roles: ['cassiere', 'magazziniere', 'pulizie'],
        customers: ['signora', 'mamma', 'vecchietta', 'giovane'],
        features: ['orders', 'spills'],
    },
];

/** Level won to open the free shop. */
export const FREE_AFTER = 3;

export const levelOf = (s: GameState): Level | null => (s.level ? LEVELS[s.level - 1] : null);

/** Unlocked in this shop? The free shop (level 0) has everything. */
export function allows(s: GameState, kind: 'objects' | 'roles' | 'customers' | 'features', key: string) {
    const l = levelOf(s);
    return !l || (l[kind] as string[]).includes(key);
}

export const goalsOf = (s: GameState) => {
    const l = levelOf(s);
    return l ? { goals: l.goals, days: l.days } : { goals: LEVEL.goals, days: LEVEL.days };
};

/** Categories some unlocked object can hold: shelves take all but the special ones. */
export function sellable(s: GameState): Category[] {
    const special = ONLY_IN as Record<string, Category>;
    return CATEGORIES.filter((c) => {
        const by = Object.keys(special).find((o) => special[o] === c);
        return allows(s, 'objects', by ?? 'scaffale');
    });
}

/** Campaign progress, saved apart from the game: levels won, "Novità" already shown (milestone 21). */
export type Progress = { won: number[]; seen: string[] };
export const PROGRESS_KEY = 'supermercatino-campagna';

export function loadProgress(text: string | null): Progress {
    try {
        const { won, seen } = JSON.parse(text ?? '') ?? {};
        return { won: Array.isArray(won) ? won.filter(Number.isInteger) : [], seen: Array.isArray(seen) ? seen.filter((x) => typeof x === 'string') : [] };
    } catch {
        return { won: [], seen: [] };
    }
}

export const winLevel = (p: Progress, n: number): Progress => (p.won.includes(n) ? p : { ...p, won: [...p.won, n] });
export const levelOpen = (p: Progress, n: number) => n === 1 || p.won.includes(n - 1);
export const freeOpen = (p: Progress) => p.won.includes(FREE_AFTER);
