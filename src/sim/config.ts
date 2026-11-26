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
    banco_salumi: { label: 'Banco salumi', costPerCell: 25 },
} as const;

/** Objects: cost (€) and the room type they must stand in. */
export const OBJECTS = {
    porta: { label: 'Porta', cost: 200, room: 'sala_vendita' },
    scaffale: { label: 'Scaffale', cost: 150, room: 'sala_vendita' },
    cassa: { label: 'Cassa', cost: 400, room: 'area_casse' },
    cestino: { label: 'Cestino', cost: 60, room: 'sala_vendita' },
    bancone: { label: 'Bancone', cost: 300, room: 'banco_salumi' },
} as const;

// --- Customers (milestone 03). "per second" = real second at 1x.

/** Units a shelf holds (and has when placed). */
export const SHELF_CAPACITY = 10;

/** Sale price per unit (€). */
export const PRICES = { Pasta: 4, Latticini: 6, Salumi: 18, Pane: 3, Frutta: 5, Detersivi: 8 } as const;


/**
 * Customer types (milestone 10): spawn weight, walk speed and patience-drain multipliers,
 * shopping list length range (categories), price multiplier.
 */
export const CUSTOMER_TYPES = {
    signora: { label: 'Signora', weight: 40, speed: 1, drain: 1, list: [1, 3], pay: 1 },
    mamma: { label: 'Mamma col bambino', weight: 18, speed: 0.8, drain: 1.2, list: [2, 4], pay: 1, spill: 2.5 },
    vecchietta: { label: 'Vecchietta', weight: 18, speed: 0.6, drain: 0.6, list: [1, 2], pay: 1 },
    giovane: { label: 'Giovane', weight: 15, speed: 1.4, drain: 1.3, list: [1, 2], pay: 1 },
    ponzone: { label: 'Signor Ponzone', weight: 7, speed: 0.9, drain: 1.5, list: [2, 3], pay: 1.5 },
    orso: { label: 'Orso', weight: 2, speed: 0.8, drain: 1, list: [3, 5], pay: 1 },
    ispettore: { label: 'Ispettore sanitario', weight: 0, speed: 0.9, drain: 0, list: [3, 3], pay: 1 }, // milestone 14: never random
} as const;

/** The bear leaves happy when its patience is at least BEAR_HAPPY at checkout: big bonus. */
export const BEAR_HAPPY = 50;
export const BEAR_BONUS_MONEY = 60;
export const BEAR_BONUS_REP = 6;

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

/** Staff roles. */
export const ROLES = {
    cassiere: { label: 'Cassiere' }, magazziniere: { label: 'Magazziniere' }, pulizie: { label: 'Addetto pulizie' }, banconiere: { label: 'Banconiere' },
} as const;

/** Who serves at each serving point: tills and the deli counter share the queue logic (milestone 13). */
export const SERVED_BY: Partial<Record<keyof typeof OBJECTS, keyof typeof ROLES>> = { cassa: 'cassiere', bancone: 'banconiere' };

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
export const LEVEL = { days: 5, goals: { money: 3500, reputation: 70, served: 350 } } as const;

// --- Dirt (milestone 12)

/** Chance a walking customer spills something on each cell they step on (times the type's `spill`, default 1). */
export const SPILL_CHANCE = 0.02;
/** Within this many cells (any direction) of a bin, spills happen half as often. */
export const BIN_RADIUS = 2;
/** At most this many spills in the shop. */
export const SPILL_MAX = 8;
/** Patience lost per second by a customer on or next to a spill. */
export const SPILL_DRAIN = 6;
/** Reputation lost per spill still on the floor at closing. */
export const SPILL_REP = 1;
/** Seconds of mopping per spill (divided by the trait's speed). */
export const CLEAN_SEC = 3;

// --- Deli counter (milestone 13)

/** Seconds the deli man slices for one customer (divided by the trait's speed). */
export const SLICE_SEC = 1.5;
/** The deli man hands over the packet in the last N seconds of slicing (render only). */
export const GIVE_SEC = 0.7;

// --- Events (milestone 14)

/** Chance a customer leaves their cart by the shelf they just took from; at most CART_MAX carts at once. */
export const CART_CHANCE = 0.02;
export const CART_MAX = 2;
/** The health inspector visits once per level: day and hour of arrival. */
export const INSPECTION_DAY = 3;
export const INSPECTION_HOUR = 10;
/** Fine (€) per spill on the floor when the inspector leaves; reputation bonus for a spotless shop. */
export const INSPECTION_FINE = 25;
export const INSPECTION_BONUS = 5;
