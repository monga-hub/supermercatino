// Pure simulation: no Phaser. The whole game is one JSON-serializable object.
import { GRID_W, GRID_H, STEP_MS, DAY_OPEN_MIN, DAY_CLOSE_MIN, GAME_MIN_PER_SEC, SPEEDS, START_MONEY, ROOMS, OBJECTS, CATEGORIES, RNG_SEED, ROLES, TRAITS, REP_START, CUSTOMER_TYPES } from './config.ts';
import { closeDay } from './day.ts';
import { updateCustomers } from './customers.ts';
import { updateStaff, refillCandidates } from './staff.ts';
import { bake } from './bakery.ts';
import type { Cell } from './path.ts';
import type { Spill } from './dirt.ts';

export type Speed = (typeof SPEEDS)[number];

export type RoomType = keyof typeof ROOMS;
export type ObjectType = keyof typeof OBJECTS;
export type Category = (typeof CATEGORIES)[number];

export type Room = { id: number; type: RoomType; x: number; y: number; w: number; h: number };
/** rot: shelves and tills have two orientations (1 = turned 90°, drawn mirrored). */
export type ShopObject = { id: number; type: ObjectType; x: number; y: number; category?: Category; stock?: number; rot?: 0 | 1; /** oven: game s towards the next batch */ bake?: number };

export type Role = keyof typeof ROLES;
export type Trait = keyof typeof TRAITS;
export type Candidate = { id: number; role: Role; name: string; trait: Trait; wage: number };
export type StaffState = 'arriving' | 'idle' | 'at_till' | 'fetching' | 'delivering' | 'cleaning' | 'cart' | 'resting';
export type Staff = Candidate & {
    state: StaffState;
    x: number;
    y: number;
    path: Cell[];
    /** Till this cashier works at (walking there or seated). */
    tillId: number | null;
    /** Stocker trip: shelf to refill, units in hand (0 while fetching). */
    job: { shelfId: number; category: Category; units: number } | null;
    /** Cleaner: spill being walked to / mopped, seconds of mopping left. */
    clean?: { spillId: number; timer: number };
    /** Stocker: abandoned cart being walked to (milestone 14). */
    cart?: number;
    /** 0..ENERGY_MAX (milestone 18); low → break at the lockers, or slow. */
    energy: number;
};
export type Cart = { id: number; x: number; y: number };

export type CustomerState = 'shopping' | 'queueing' | 'paying' | 'ready' | 'leaving' | 'leaving_angry';
export type CustomerKind = keyof typeof CUSTOMER_TYPES;
export type Customer = {
    id: number;
    kind: CustomerKind;
    state: CustomerState;
    /** Position in grid cells (fractional while walking). */
    x: number;
    y: number;
    path: Cell[];
    /** Where the current path leads: a shelf/till object id, or the door. */
    goal: { kind: 'shelf' | 'till'; id: number } | { kind: 'door' } | null;
    list: Category[];
    /** Index of the next list item to look for. */
    next: number;
    basket: Category[];
    patience: number;
    /** Order of arrival at the till (FIFO). */
    queuedAt: number;
    /** Seconds left at the till while paying, then until the automatic checkout when ready. */
    timer: number;
    /** Furbetto only (milestone 15): what he will try at the till; cleared once caught or served. */
    trick?: 'cut' | 'run';
};

export type GameState = {
    grid: { w: number; h: number };
    day: number;
    /** Game seconds since midnight (integer: no float drift). */
    clockSec: number;
    speed: Speed;
    paused: boolean;
    money: number;
    rooms: Room[];
    objects: ShopObject[];
    nextId: number;
    customers: Customer[];
    servedToday: number;
    lostToday: number;
    /** Game seconds accumulated towards the next arrival. */
    spawnAcc: number;
    /** Arrival counter for till queues. */
    queueSeq: number;
    /** mulberry32 state. */
    rng: number;
    candidates: Candidate[];
    staff: Staff[];
    /** Units per category in the warehouse. */
    warehouse: Record<Category, number>;
    /** Shelf ids tapped for restocking, served first (FIFO). */
    restockQueue: number[];
    /** Yogurt on the floor (milestone 12); spill ids tapped for cleaning, served first. */
    spills: Spill[];
    cleanQueue: number[];
    /** Abandoned carts (block customers) and cart ids tapped for removal (milestone 14). */
    carts: Cart[];
    cartQueue: number[];
    /** Furbetti caught with a tap / run off with the goods (the HUD announces each). */
    furbetti: { caught: number; escaped: number };
    /** Game seconds of fresh-bread smell left (milestone 17): more arrivals. */
    scent: number;
    /** Outcome of the level's health inspection, once it happened. */
    inspection: { fine: number; rep: number } | null;
    /** 0–100: drives arrivals. */
    reputation: number;
    servedTotal: number;
    /** Bears that left happy (big bonus each); the HUD celebrates when it grows. */
    happyBears: number;
    /** Sales (and tips) and goods ordered today, for the day summary. */
    incomeToday: number;
    goodsToday: number;
    /** Closings in a row with money below BANKRUPT_BELOW / reputation below REP_MIN. */
    redDays: number;
    lowRepDays: number;
    /** Shown at closing; the game waits on it until the 'continue' command. */
    summary: DaySummary | null;
    /** Level over. */
    outcome: { win: boolean; reason: string } | null;
};

export type DaySummary = {
    day: number; income: number; goods: number; wages: number; rent: number;
    money: number; served: number; lost: number; reputation: number;
};

export function createState(): GameState {
    const s: GameState = {
        grid: { w: GRID_W, h: GRID_H },
        day: 1,
        clockSec: DAY_OPEN_MIN * 60,
        speed: 1,
        paused: true, // milestone 08: build first, start the clock with 1x
        money: START_MONEY,
        rooms: [],
        objects: [],
        nextId: 1,
        customers: [],
        servedToday: 0,
        lostToday: 0,
        spawnAcc: 0,
        queueSeq: 0,
        rng: RNG_SEED,
        candidates: [],
        staff: [],
        warehouse: Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>,
        restockQueue: [],
        spills: [],
        cleanQueue: [],
        carts: [],
        cartQueue: [],
        inspection: null,
        furbetti: { caught: 0, escaped: 0 },
        scent: 0,
        reputation: REP_START,
        servedTotal: 0,
        happyBears: 0,
        incomeToday: 0,
        goodsToday: 0,
        redDays: 0,
        lowRepDays: 0,
        summary: null,
        outcome: null,
    };
    refillCandidates(s);
    return s;
}

/** One fixed step of game time. Speed is applied by running more steps, not bigger ones. */
export function tick(s: GameState): void {
    if (s.summary || s.outcome) return; // waiting for the player at closing
    s.clockSec += (GAME_MIN_PER_SEC * 60 * STEP_MS) / 1000;
    if (s.clockSec >= DAY_CLOSE_MIN * 60) return closeDay(s);
    updateStaff(s);
    bake(s);
    updateCustomers(s);
}

/** Advance by `realMs` of wall-clock time at the current speed. Deterministic. */
export function advance(s: GameState, realMs: number): void {
    if (s.paused) return;
    const steps = Math.round((realMs / STEP_MS) * s.speed);
    for (let i = 0; i < steps; i++) tick(s);
}

export function setSpeed(s: GameState, speed: Speed): void {
    s.speed = speed;
    if (!s.summary && !s.outcome) s.paused = false;
}

export function togglePause(s: GameState): void {
    if (!s.summary && !s.outcome) s.paused = !s.paused;
}
