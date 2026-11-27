// Build commands. Commands are plain data so UI, tests and agents share one entry point.
import { ROOMS, OBJECTS, CATEGORIES, ONLY_IN, DEMOLISH_REFUND, SHELF_CAPACITY, ORDER_UNITS, UNIT_COST, TIP } from './config.ts';
import { readyAt, checkout, rerouteCustomers, walkableFor, tricking, catchFurbetto } from './customers.ts';
import { nextDay } from './day.ts';
import type { GameState, RoomType, ObjectType, Category, Room, ShopObject } from './state.ts';
import { hire, fire, rerouteStaff } from './staff.ts';
import { allows } from './levels.ts';
import { cash } from './fx.ts';

const FIXED = 'In questo negozio le stanze sono già fatte';

export type Command =
    | { type: 'buildRoom'; room: RoomType; x: number; y: number; w: number; h: number }
    | { type: 'placeObject'; object: ObjectType; x: number; y: number; category?: string; rot?: 0 | 1 }
    | { type: 'demolish'; x: number; y: number }
    | { type: 'rotate'; x: number; y: number }
    | { type: 'move'; x: number; y: number; toX: number; toY: number }
    | { type: 'hire'; candidateId: number }
    | { type: 'fire'; staffId: number }
    | { type: 'order'; category: string }
    | { type: 'restock'; shelfId: number }
    | { type: 'collect'; tillId: number }
    | { type: 'clean'; spillId: number }
    | { type: 'removeCart'; cartId: number }
    | { type: 'catch'; customerId: number }
    | { type: 'continue' };

export type Result = { ok: true; cost: number } | { ok: false; reason: string };

const fail = (reason: string): Result => ({ ok: false, reason });

export const roomAt = (s: GameState, x: number, y: number) =>
    s.rooms.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);

/** Cells an object stands on: one each (playtest 2026-11-27: a two-cell till did not work). */
// ponytail: kept as the one footprint hook; multi-cell objects plug in here
export const cellsOf = (o: Pick<ShopObject, 'type' | 'x' | 'y' | 'rot'>) => [{ x: o.x, y: o.y }];

export const objectAt = (s: GameState, x: number, y: number) => s.objects.find((o) => cellsOf(o).some((c) => c.x === x && c.y === y));

/** Edge between two cells, either order. */
export const edgeKey = (ax: number, ay: number, bx: number, by: number) => (ax + ay * 1000 < bx + by * 1000 ? `${ax},${ay}|${bx},${by}` : `${bx},${by}|${ax},${ay}`);

/** Back-of-house rooms: walled off from the rest (playtest 2026-11-27: sales floor and checkout stay one open space). */
export const STAFF_ONLY: RoomType[] = ['magazzino', 'spogliatoio'];
/** A wall stands between these two kinds of room. */
export const walled = (a: RoomType, b: RoomType) => a !== b && (STAFF_ONLY.includes(a) || STAFF_ONLY.includes(b));

/**
 * Doorways in the walls around staff-only rooms (Theme Hospital style): the middle one or two cells of each shared side.
 * Other rooms side by side stay one open area.
 */
export function doorways(s: GameState): Set<string> {
    const out = new Set<string>();
    for (const a of s.rooms)
        for (const b of s.rooms) {
            if (!walled(a.type, b.type)) continue;
            const side: [number, number, number, number][] = [];
            for (let x = a.x; x < a.x + a.w; x++)
                for (let y = a.y; y < a.y + a.h; y++)
                    for (const [dx, dy] of [[1, 0], [0, 1]]) if (roomAt(s, x + dx, y + dy) === b) side.push([x, y, x + dx, y + dy]);
            const n = side.length, mid = n % 2 ? [(n - 1) / 2] : [n / 2 - 1, n / 2];
            if (n) for (const i of mid) out.add(edgeKey(...side[i]));
        }
    return out;
}

/** May a walker step from a to b? Into or out of a staff-only room only through a doorway. */
export function crossing(s: GameState) {
    const open = doorways(s);
    return (a: { x: number; y: number }, b: { x: number; y: number }) => {
        const ra = roomAt(s, a.x, a.y), rb = roomAt(s, b.x, b.y);
        return !ra || !rb || !walled(ra.type, rb.type) || open.has(edgeKey(a.x, a.y, b.x, b.y));
    };
}

/** Cells on either side of a doorway: kept free of furniture. */
export const inDoorway = (s: GameState, x: number, y: number) =>
    [...doorways(s)].some((k) => k.split('|').includes(`${x},${y}`));

const roomCost = (type: RoomType, w: number, h: number) => w * h * ROOMS[type].costPerCell;

const overlaps = (a: Room, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Validate a command without changing state. `cost` is negative for refunds. */
export function check(s: GameState, c: Command): Result {
    if (c.type === 'buildRoom') {
        const def = ROOMS[c.room];
        if (!def) return fail('Tipo di stanza sconosciuto');
        if (s.level) return fail(FIXED);
        if (c.x < 0 || c.y < 0 || c.x + c.w > s.grid.w || c.y + c.h > s.grid.h) return fail('Fuori dal lotto');
        if (s.rooms.some((r) => overlaps(r, c))) return fail('Si sovrappone a un\'altra stanza');
        return afford(s, roomCost(c.room, c.w, c.h));
    }
    if (c.type === 'placeObject') {
        const def = OBJECTS[c.object];
        if (!def) return fail('Oggetto sconosciuto');
        if (!allows(s, 'objects', c.object)) return fail(`${def.label}: non c'è in questo negozio`);
        const cells = cellsOf({ type: c.object, x: c.x, y: c.y, rot: c.rot });
        if (cells.some((p) => roomAt(s, p.x, p.y)?.type !== def.room)) return fail(`${def.label}: va in ${ROOMS[def.room].label}`);
        if (cells.some((p) => objectAt(s, p.x, p.y))) return fail('Cella occupata');
        if (c.object !== 'porta' && cells.some((p) => inDoorway(s, p.x, p.y))) return fail('Lascia libero il passaggio');
        if (c.object === 'scaffale' && !CATEGORIES.includes(c.category as Category)) return fail('Scegli una categoria');
        const special = Object.entries(ONLY_IN).find(([, cat]) => cat === c.category);
        if (c.object === 'scaffale' && special) return fail(`${c.category}: ci vuole ${OBJECTS[special[0] as ObjectType].label.toLowerCase()}`);
        if (c.object === 'porta') {
            // edge of the whole sales floor: rooms of the same type side by side form one area
            const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => roomAt(s, c.x + dx, c.y + dy)?.type !== 'sala_vendita');
            if (!edge) return fail('La porta va sul bordo della sala');
        }
        return afford(s, def.cost);
    }
    if (c.type === 'rotate') {
        const o = objectAt(s, c.x, c.y);
        if (!o) return fail('Niente da ruotare');
        if (o.type === 'porta') return fail('La porta si gira da sola');
        // turned, it must still fit (a till swings its second cell round)
        const r = check({ ...s, money: Infinity, objects: s.objects.filter((x) => x !== o) }, { type: 'placeObject', object: o.type, x: o.x, y: o.y, category: o.category, rot: o.rot ? 0 : 1 });
        return r.ok ? { ok: true, cost: 0 } : r;
    }
    if (c.type === 'move') {
        const o = objectAt(s, c.x, c.y);
        if (!o) return fail('Niente da spostare');
        if (o.type === 'porta' && s.level) return fail('La porta resta dov\'è');
        if (c.toX === c.x && c.toY === c.y) return fail('È già qui');
        // same rules as placing it there, for free, as if it had left its cell
        const r = check({ ...s, money: Infinity, objects: s.objects.filter((x) => x !== o) }, { type: 'placeObject', object: o.type, x: c.toX, y: c.toY, category: o.category, rot: o.rot });
        return r.ok ? { ok: true, cost: 0 } : r;
    }
    if (c.type === 'hire') return s.candidates.some((x) => x.id === c.candidateId) ? { ok: true, cost: 0 } : fail('Candidato non trovato');
    if (c.type === 'restock') {
        const o = s.objects.find((x) => x.id === c.shelfId);
        if (!o?.category) return fail('Non è uno scaffale');
        if (o.type === 'forno') return fail('Il pane lo sforna il forno');
        if (o.stock! >= SHELF_CAPACITY) return fail('Scaffale già pieno');
        if (s.restockQueue.includes(o.id) || s.staff.some((st) => st.job?.shelfId === o.id)) return fail('Già in arrivo');
        if (!s.staff.some((st) => st.role === 'magazziniere')) return fail('Serve un magazziniere');
        if (!s.warehouse[o.category!]) return fail(`Niente ${o.category} in magazzino`);
        return { ok: true, cost: 0 };
    }
    if (c.type === 'clean') {
        if (!s.spills.some((p) => p.id === c.spillId)) return fail('Niente da pulire');
        if (s.cleanQueue.includes(c.spillId) || s.staff.some((st) => st.clean?.spillId === c.spillId)) return fail('Già in arrivo');
        return s.staff.some((st) => st.role === 'pulizie') ? { ok: true, cost: 0 } : fail('Serve un addetto pulizie');
    }
    if (c.type === 'removeCart') {
        if (!s.carts.some((x) => x.id === c.cartId)) return fail('Niente da spostare');
        if (s.cartQueue.includes(c.cartId) || s.staff.some((st) => st.cart === c.cartId)) return fail('Già in arrivo');
        return s.staff.some((st) => st.role === 'magazziniere') ? { ok: true, cost: 0 } : fail('Serve un magazziniere');
    }
    if (c.type === 'catch') {
        const f = s.customers.find((x) => x.id === c.customerId);
        return f && tricking(f) ? { ok: true, cost: 0 } : fail('Niente da beccare');
    }
    if (c.type === 'continue') return s.summary && !s.outcome ? { ok: true, cost: 0 } : fail('Niente da continuare');
    if (c.type === 'collect') return readyAt(s, c.tillId) ? { ok: true, cost: 0 } : fail('Nessun conto da incassare');
    if (c.type === 'order') {
        if (!CATEGORIES.includes(c.category as Category)) return fail('Categoria sconosciuta');
        if (c.category === 'Pane') return fail('Il pane lo sforna il forno');
        if (!allows(s, 'features', 'orders')) return fail('Qui la merce arriva da sola');
        if (!s.rooms.some((r) => r.type === 'magazzino')) return fail('Serve un magazzino');
        return afford(s, ORDER_UNITS * UNIT_COST[c.category as Category]);
    }
    if (c.type === 'fire') return s.staff.some((x) => x.id === c.staffId) ? { ok: true, cost: 0 } : fail('Dipendente non trovato');
    // demolish
    const obj = objectAt(s, c.x, c.y);
    if (obj && s.level && obj.type === 'porta') return fail('La porta resta dov\'è');
    if (obj) return { ok: true, cost: -Math.floor(OBJECTS[obj.type].cost * DEMOLISH_REFUND) };
    const room = roomAt(s, c.x, c.y);
    if (!room) return fail('Niente da demolire');
    if (s.level) return fail(FIXED);
    if (s.objects.some((o) => roomAt(s, o.x, o.y) === room)) return fail('Svuota prima la stanza');
    return { ok: true, cost: -Math.floor(roomCost(room.type, room.w, room.h) * DEMOLISH_REFUND) };
}

function afford(s: GameState, cost: number): Result {
    return s.money >= cost ? { ok: true, cost } : fail('Soldi insufficienti');
}

/** Validate and, if ok, execute. Works while paused. */
export function apply(s: GameState, c: Command): Result {
    const r = check(s, c);
    if (!r.ok) return r;
    s.money -= r.cost;
    if (r.cost) cash.on?.(-r.cost, 'x' in c ? c.x : undefined, 'y' in c ? c.y : undefined);
    if (['restock', 'collect', 'clean', 'removeCart', 'catch'].includes(c.type)) s.taps[c.type] = (s.taps[c.type] ?? 0) + 1;
    if (c.type === 'buildRoom') {
        s.rooms.push({ id: s.nextId++, type: c.room, x: c.x, y: c.y, w: c.w, h: c.h });
    } else if (c.type === 'placeObject') {
        const o: ShopObject = { id: s.nextId++, type: c.object, x: c.x, y: c.y, ...(c.rot ? { rot: 1 } : {}) };
        if (c.object === 'scaffale' || c.object in ONLY_IN) {
            o.category = ONLY_IN[c.object as keyof typeof ONLY_IN] ?? c.category as Category;
            o.stock = c.object === 'forno' ? 0 : SHELF_CAPACITY; // the oven starts cold
        }
        s.objects.push(o);
    } else if (c.type === 'rotate') {
        const o = objectAt(s, c.x, c.y)!;
        o.rot = o.rot ? 0 : 1;
    } else if (c.type === 'move') {
        const o = objectAt(s, c.x, c.y)!;
        Object.assign(o, { x: c.toX, y: c.toY });
        // whoever works or queues at a moved till starts over from there
        for (const st of s.staff) if (st.tillId === o.id) Object.assign(st, { state: 'idle', tillId: null, path: [] });
        for (const cu of s.customers) if (cu.goal?.kind === 'till' && cu.goal.id === o.id && ['queueing', 'paying', 'ready'].includes(cu.state)) cu.state = 'shopping';
    } else if (c.type === 'hire') {
        hire(s, c.candidateId);
    } else if (c.type === 'fire') {
        fire(s, c.staffId);
    } else if (c.type === 'restock') {
        s.restockQueue.push(c.shelfId);
    } else if (c.type === 'collect') {
        checkout(s, readyAt(s, c.tillId)!, TIP);
    } else if (c.type === 'continue') {
        nextDay(s);
    } else if (c.type === 'clean') {
        s.cleanQueue.push(c.spillId);
    } else if (c.type === 'catch') {
        catchFurbetto(s, s.customers.find((x) => x.id === c.customerId)!);
    } else if (c.type === 'removeCart') {
        s.cartQueue.push(c.cartId);
    } else if (c.type === 'order') {
        s.warehouse[c.category as Category] += ORDER_UNITS;
        s.goodsToday += r.cost;
    } else {
        const obj = objectAt(s, c.x, c.y);
        if (obj) s.objects.splice(s.objects.indexOf(obj), 1);
        else s.rooms.splice(s.rooms.indexOf(roomAt(s, c.x, c.y)!), 1);
    }
    if (c.type === 'buildRoom' || c.type === 'placeObject' || c.type === 'demolish' || c.type === 'move') {
        const w = walkableFor(s);
        s.spills = s.spills.filter((p) => w(p.x, p.y)); // under a new object or a demolished room: gone
        s.carts = s.carts.filter((c) => roomAt(s, c.x, c.y) && !objectAt(s, c.x, c.y));
        rerouteCustomers(s);
        rerouteStaff(s);
    }
    return r;
}
