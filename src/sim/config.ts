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
export const START_MONEY = 5_000;

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
export const PRICES = { Pasta: 4, Latticini: 6, Salumi: 12, Pane: 3, Frutta: 5, Detersivi: 8 } as const;


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

/** Purchase cost per unit (€): about a third of the sale price. */
export const UNIT_COST = { Pasta: 1, Latticini: 2, Salumi: 4, Pane: 1, Frutta: 2, Detersivi: 3 } as const;

// --- Taps (milestone 05b, ADR-0002): tapping speeds things up, automation is slower.

/** Without a tap, a stocker refills a shelf only when its stock drops below this. */
export const AUTO_RESTOCK_BELOW = 2;

/** The 📦 tap icon shows over a shelf below this stock. */
export const TAP_ICON_BELOW = 5;

/** Seconds a bill waits for the 💰 tap before the cashier closes it alone (no tip). */
export const AUTO_COLLECT_SEC = 3;

/** Tip (€) for collecting with a tap. */
export const TIP = 1;

// --- Day and level (milestone 06)

/** A new customer every N game minutes, from reputation 0% to 100% (only with a door and a reachable till). */
export const SPAWN_EVERY_MIN_AT_0 = 16;
export const SPAWN_EVERY_MIN_AT_100 = 6;

/** No new customers in the last N game minutes before closing. */
export const LAST_ARRIVAL_MIN = 60;

/** Rent paid at every closing (€). */
export const DAILY_RENT = 150;

/** Reputation (0–100%): start value, gain per served customer, loss per lost one.
 *  Game over below REP_MIN at BAD_DAYS closings in a row (same count as bankruptcy). */
export const REP_START = 50;
export const REP_SERVED = 1;
export const REP_LOST = 4;
export const REP_MIN = 15;

/** Bankruptcy: money below BANKRUPT_BELOW at BAD_DAYS closings in a row. */
export const BANKRUPT_BELOW = 0;
export const BAD_DAYS = 2;

/** Level 1: days available and goals to reach at a closing (money, reputation %, customers served in total). */
export const LEVEL = { days: 5, goals: { money: 4000, reputation: 70, served: 350 } } as const;
