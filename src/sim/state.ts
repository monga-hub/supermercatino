// Pure simulation: no Phaser. The whole game is one JSON-serializable object.
import { GRID_W, GRID_H, STEP_MS, DAY_OPEN_MIN, DAY_CLOSE_MIN, GAME_MIN_PER_SEC, SPEEDS, START_MONEY, ROOMS, OBJECTS, CATEGORIES, RNG_SEED } from './config.ts';
import { updateCustomers } from './customers.ts';
import type { Cell } from './path.ts';

export type Speed = (typeof SPEEDS)[number];

export type RoomType = keyof typeof ROOMS;
export type ObjectType = keyof typeof OBJECTS;
export type Category = (typeof CATEGORIES)[number];

export type Room = { id: number; type: RoomType; x: number; y: number; w: number; h: number };
export type ShopObject = { id: number; type: ObjectType; x: number; y: number; category?: Category; stock?: number };

export type CustomerState = 'shopping' | 'queueing' | 'paying' | 'leaving' | 'leaving_angry';
export type Customer = {
    id: number;
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
    /** Seconds left at the till while paying. */
    timer: number;
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
};

export function createState(): GameState {
    return {
        grid: { w: GRID_W, h: GRID_H },
        day: 1,
        clockSec: DAY_OPEN_MIN * 60,
        speed: 1,
        paused: false,
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
    };
}

/** One fixed step of game time. Speed is applied by running more steps, not bigger ones. */
export function tick(s: GameState): void {
    s.clockSec += (GAME_MIN_PER_SEC * 60 * STEP_MS) / 1000;
    if (s.clockSec >= DAY_CLOSE_MIN * 60) {
        s.day += 1;
        s.clockSec = DAY_OPEN_MIN * 60;
        s.servedToday = 0;
        s.lostToday = 0;
    }
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
    s.paused = false;
}

export function togglePause(s: GameState): void {
    s.paused = !s.paused;
}
