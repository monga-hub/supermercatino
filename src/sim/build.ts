// Build commands. Commands are plain data so UI, tests and agents share one entry point.
import { ROOMS, OBJECTS, CATEGORIES, DEMOLISH_REFUND, SHELF_CAPACITY, ORDER_UNITS, UNIT_COST, TIP } from './config.ts';
import { readyAt, checkout } from './customers.ts';
import type { GameState, RoomType, ObjectType, Category, Room, ShopObject } from './state.ts';
import { hire, fire } from './staff.ts';

export type Command =
    | { type: 'buildRoom'; room: RoomType; x: number; y: number; w: number; h: number }
    | { type: 'placeObject'; object: ObjectType; x: number; y: number; category?: string }
    | { type: 'demolish'; x: number; y: number }
    | { type: 'hire'; candidateId: number }
    | { type: 'fire'; staffId: number }
    | { type: 'order'; category: string }
    | { type: 'restock'; shelfId: number }
    | { type: 'collect'; tillId: number };

export type Result = { ok: true; cost: number } | { ok: false; reason: string };

const fail = (reason: string): Result => ({ ok: false, reason });

export const roomAt = (s: GameState, x: number, y: number) =>
    s.rooms.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);

export const objectAt = (s: GameState, x: number, y: number) => s.objects.find((o) => o.x === x && o.y === y);

const roomCost = (type: RoomType, w: number, h: number) => w * h * ROOMS[type].costPerCell;

const overlaps = (a: Room, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Validate a command without changing state. `cost` is negative for refunds. */
export function check(s: GameState, c: Command): Result {
    if (c.type === 'buildRoom') {
        const def = ROOMS[c.room];
        if (!def) return fail('Tipo di stanza sconosciuto');
        if (c.x < 0 || c.y < 0 || c.x + c.w > s.grid.w || c.y + c.h > s.grid.h) return fail('Fuori dal lotto');
        if (s.rooms.some((r) => overlaps(r, c))) return fail('Si sovrappone a un\'altra stanza');
        return afford(s, roomCost(c.room, c.w, c.h));
    }
    if (c.type === 'placeObject') {
        const def = OBJECTS[c.object];
        if (!def) return fail('Oggetto sconosciuto');
        const room = roomAt(s, c.x, c.y);
        if (!room || room.type !== def.room) return fail(`${def.label}: va in ${ROOMS[def.room].label}`);
        if (objectAt(s, c.x, c.y)) return fail('Cella occupata');
        if (c.object === 'scaffale' && !CATEGORIES.includes(c.category as Category)) return fail('Scegli una categoria');
        if (c.object === 'porta') {
            // edge of the whole sales floor: rooms of the same type side by side form one area
            const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => roomAt(s, c.x + dx, c.y + dy)?.type !== 'sala_vendita');
            if (!edge) return fail('La porta va sul bordo della sala');
        }
        return afford(s, def.cost);
    }
    if (c.type === 'hire') return s.candidates.some((x) => x.id === c.candidateId) ? { ok: true, cost: 0 } : fail('Candidato non trovato');
    if (c.type === 'restock') {
        const o = s.objects.find((x) => x.id === c.shelfId);
        if (!o || o.type !== 'scaffale') return fail('Non è uno scaffale');
        if (o.stock! >= SHELF_CAPACITY) return fail('Scaffale già pieno');
        if (s.restockQueue.includes(o.id) || s.staff.some((st) => st.job?.shelfId === o.id)) return fail('Già in arrivo');
        if (!s.staff.some((st) => st.role === 'magazziniere')) return fail('Serve un magazziniere');
        if (!s.warehouse[o.category!]) return fail(`Niente ${o.category} in magazzino`);
        return { ok: true, cost: 0 };
    }
    if (c.type === 'collect') return readyAt(s, c.tillId) ? { ok: true, cost: 0 } : fail('Nessun conto da incassare');
    if (c.type === 'order') {
        if (!CATEGORIES.includes(c.category as Category)) return fail('Categoria sconosciuta');
        if (!s.rooms.some((r) => r.type === 'magazzino')) return fail('Serve un magazzino');
        return afford(s, ORDER_UNITS * UNIT_COST[c.category as Category]);
    }
    if (c.type === 'fire') return s.staff.some((x) => x.id === c.staffId) ? { ok: true, cost: 0 } : fail('Dipendente non trovato');
    // demolish
    const obj = objectAt(s, c.x, c.y);
    if (obj) return { ok: true, cost: -Math.floor(OBJECTS[obj.type].cost * DEMOLISH_REFUND) };
    const room = roomAt(s, c.x, c.y);
    if (!room) return fail('Niente da demolire');
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
    if (c.type === 'buildRoom') {
        s.rooms.push({ id: s.nextId++, type: c.room, x: c.x, y: c.y, w: c.w, h: c.h });
    } else if (c.type === 'placeObject') {
        const o: ShopObject = { id: s.nextId++, type: c.object, x: c.x, y: c.y };
        if (c.object === 'scaffale') {
            o.category = c.category as Category;
            o.stock = SHELF_CAPACITY;
        }
        s.objects.push(o);
    } else if (c.type === 'hire') {
        hire(s, c.candidateId);
    } else if (c.type === 'fire') {
        fire(s, c.staffId);
    } else if (c.type === 'restock') {
        s.restockQueue.push(c.shelfId);
    } else if (c.type === 'collect') {
        checkout(s, readyAt(s, c.tillId)!, TIP);
    } else if (c.type === 'order') {
        s.warehouse[c.category as Category] += ORDER_UNITS;
    } else {
        const obj = objectAt(s, c.x, c.y);
        if (obj) s.objects.splice(s.objects.indexOf(obj), 1);
        else s.rooms.splice(s.rooms.indexOf(roomAt(s, c.x, c.y)!), 1);
    }
    return r;
}
