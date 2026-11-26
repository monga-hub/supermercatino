// Build commands. Commands are plain data so UI, tests and agents share one entry point.
import { ROOMS, OBJECTS, CATEGORIES, DEMOLISH_REFUND, SHELF_STOCK } from './config.ts';
import type { GameState, RoomType, ObjectType, Category, Room, ShopObject } from './state.ts';

export type Command =
    | { type: 'buildRoom'; room: RoomType; x: number; y: number; w: number; h: number }
    | { type: 'placeObject'; object: ObjectType; x: number; y: number; category?: string }
    | { type: 'demolish'; x: number; y: number };

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
        if (c.w < def.minW || c.h < def.minH) return fail(`Minimo ${def.minW}×${def.minH}`);
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
            const edge = c.x === room.x || c.y === room.y || c.x === room.x + room.w - 1 || c.y === room.y + room.h - 1;
            if (!edge) return fail('La porta va sul bordo della sala');
        }
        return afford(s, def.cost);
    }
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
            o.stock = SHELF_STOCK;
        }
        s.objects.push(o);
    } else {
        const obj = objectAt(s, c.x, c.y);
        if (obj) s.objects.splice(s.objects.indexOf(obj), 1);
        else s.rooms.splice(s.rooms.indexOf(roomAt(s, c.x, c.y)!), 1);
    }
    return r;
}
