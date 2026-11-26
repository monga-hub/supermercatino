// Every balance/tuning number lives here. Values are provisional: tune in playtest.

/** Shop lot size in cells. */
export const GRID_W = 20;
export const GRID_H = 20;

/** Fixed simulation step, in real milliseconds at 1x. */
export const STEP_MS = 100;

/** Opening hours, in minutes since midnight. */
export const DAY_OPEN_MIN = 8 * 60;
export const DAY_CLOSE_MIN = 20 * 60;

/** Game minutes that pass per real second at 1x (12h day ≈ 4 real minutes at 1x).
 *  GAME_MIN_PER_SEC * 60 * STEP_MS / 1000 must be an integer (seconds per step). */
export const GAME_MIN_PER_SEC = 3;

export const SPEEDS = [1, 2, 3] as const;

/** Money in the till at level start (€). */
export const START_MONEY = 10_000;

/** Share of the build cost given back on demolition. */
export const DEMOLISH_REFUND = 0.5;

export const CATEGORIES = ['Pasta', 'Latticini', 'Salumi', 'Pane', 'Frutta', 'Detersivi'] as const;

/** Room types: cost per cell (€). Any size: same-type rooms side by side form one area. */
export const ROOMS = {
    sala_vendita: { label: 'Sala vendita', costPerCell: 20 },
    magazzino: { label: 'Magazzino', costPerCell: 15 },
    area_casse: { label: 'Area casse', costPerCell: 20 },
} as const;

/** Objects: cost (€) and the room type they must stand in. */
export const OBJECTS = {
    porta: { label: 'Porta', cost: 200, room: 'sala_vendita' },
    scaffale: { label: 'Scaffale', cost: 150, room: 'sala_vendita' },
    cassa: { label: 'Cassa', cost: 400, room: 'area_casse' },
} as const;

// --- Customers (milestone 03). "per second" = real second at 1x.

/** Units a shelf holds (and has when placed). */
export const SHELF_CAPACITY = 10;

/** Sale price per unit (€). */
export const PRICES = { Pasta: 2, Latticini: 3, Salumi: 6, Pane: 2, Frutta: 3, Detersivi: 5 } as const;

/** A new customer every N game minutes (only with a door and a reachable till). */
export const SPAWN_EVERY_MIN = 10;

/** Shopping list length range (categories). */
export const LIST_MIN = 1;
export const LIST_MAX = 3;

/** Walking speed, cells per second. */
export const CUSTOMER_SPEED = 2;

export const PATIENCE_START = 100;
/** Patience lost per second waiting in the till queue. */
export const PATIENCE_QUEUE_DRAIN = 4;
/** Patience lost per second walking (long routes annoy). */
export const PATIENCE_WALK_DRAIN = 0.5;
/** Patience lost when a list item is missing or its shelf is empty. */
export const PATIENCE_MISSING = 35;

/** Seconds the till needs per customer (automatic till until staff exists). */
export const PAY_SEC = 2;

/** Seed of the sim's random generator (shopping lists). */
export const RNG_SEED = 12345;

// --- Staff (milestone 04)

/** Staff roles. Later milestones add pulizie, banconiere. */
export const ROLES = { cassiere: { label: 'Cassiere' }, magazziniere: { label: 'Magazziniere' } } as const;

/** Candidates on offer for each role at any time. */
export const CANDIDATES_PER_ROLE = 3;

/** Traits: work speed multiplier and base wage (€/day). Chiacchierone gives paying customers patience back. */
export const TRAITS = {
    normale: { label: 'Normale', desc: 'fa il suo', speed: 1, wage: 60, patienceBonus: 0 },
    svelto: { label: 'Svelto', desc: 'lavora in fretta, costa di più', speed: 1.5, wage: 90, patienceBonus: 0 },
    chiacchierone: { label: 'Chiacchierone', desc: 'lento ed economico; alla cassa mette di buonumore', speed: 0.7, wage: 45, patienceBonus: 30 },
} as const;

/** Wage spread around the trait's base (± €). */
export const WAGE_SPREAD = 5;

export const STAFF_NAMES = ['Pina', 'Gino', 'Rosa', 'Tonino', 'Carla', 'Beppe', 'Lucia', 'Franco', 'Assunta', 'Mimmo', 'Teresa', 'Salvo'] as const;

/** Staff walking speed, cells per second. */
export const STAFF_SPEED = 2.5;

// --- Restocking (milestone 05)

/** Units in one ordered crate, delivered straight to the warehouse. */
export const ORDER_UNITS = 20;

/** Purchase cost per unit (€): roughly half the sale price. */
export const UNIT_COST = { Pasta: 1, Latticini: 2, Salumi: 3, Pane: 1, Frutta: 2, Detersivi: 3 } as const;

/** A stocker refills a shelf when its stock drops below this. */
export const RESTOCK_BELOW = 4;
