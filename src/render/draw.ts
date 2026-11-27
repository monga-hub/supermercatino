// Drawing: painted sprites from the kit atlas (milestone 07); flat iso boxes as fallback when a frame is missing.
import type { GameObjects } from 'phaser';
import { gridToIso, TILE_W, TILE_H } from './iso.ts';
import { SPRITES, SPILL_FRAMES, personFrame, objectFrame, walkBob } from './sprites.ts';
import { walls, doorEdge, type Edge } from './walls.ts';
import { cashierAt } from '../sim/staff.ts';
import { STAFF_ONLY, cellsOf } from '../sim/build.ts';
import { terrain, props, decor, MARGIN, type Ground, type Prop } from './scenery.ts';
import type { GameState, RoomType, ObjectType, ShopObject, Customer, Staff, Role, Category } from '../sim/state.ts';

type G = GameObjects.Graphics;
/** Draws atlas frame bottom-centred at (px, py); false if the frame is missing (caller falls back to boxes). */
export type Put = (frame: string, px: number, py: number, depth: number, flip?: boolean) => boolean;
const noPut: Put = () => false;

const LOT = [0xa39684, 0x998c7a]; // piazzale in pietra (milestone 21b; was dark cement)
export const ROOM_FLOOR: Record<RoomType, [number, number]> = {
    sala_vendita: [0xf1e4c8, 0xb5523b], // linoleum crema/mattone
    magazzino: [0xc9bda4, 0xb8ab90], // cemento chiaro (milestone 21b)
    area_casse: [0xf1e4c8, 0x4f7f6a],
    banco_salumi: [0xe6cf9f, 0x8c5a3c], // cotto e legno
    panetteria: [0xf3dcae, 0xc98b4a], // farina e crosta
    spogliatoio: [0xb8c4c8, 0x8a9aa0], // piastrelle grigie
};
/** Ground around the lot (milestone 21b); the camera background is GRASS[1], so nothing is ever empty. */
export const GROUND: Record<Ground, [number, number]> = {
    grass: [0x6f9a4a, 0x67914a],
    sidewalk: [0xc8c0b0, 0xbdb5a4],
    road: [0x4a4a4e, 0x47474b],
};
export const CATEGORY_COLOR: Record<string, number> = {
    Pasta: 0xe8c547,
    Latticini: 0xdfe8f0,
    Salumi: 0xc94f4f,
    Pane: 0xc98b47,
    Frutta: 0x6fae4a,
    Detersivi: 0x4a7fc9,
};
const OBJECT_LOOK: Record<ObjectType, { h: number; color: number; k: number }> = {
    porta: { h: 4, color: 0x3f7d3a, k: 0.9 },
    scaffale: { h: 30, color: 0xb0a090, k: 0.8 },
    cassa: { h: 20, color: 0x9aa3ad, k: 0.75 },
    cestino: { h: 12, color: 0x3f7d3a, k: 0.35 },
    bancone: { h: 22, color: 0xa86b3c, k: 0.85 },
    forno: { h: 30, color: 0xa04a2a, k: 0.85 },
    frigo: { h: 32, color: 0xdfe8f0, k: 0.8 },
    armadietti: { h: 30, color: 0x7f9aa8, k: 0.7 },
};

export const shade = (c: number, f: number) =>
    (Math.round(((c >> 16) & 255) * f) << 16) | (Math.round(((c >> 8) & 255) * f) << 8) | Math.round((c & 255) * f);

function poly(g: G, pts: number[]) {
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath();
    g.fillPath();
}

/** Diamond of cell (x, y), shrunk by k around its centre and lifted by h. */
function diamond(x: number, y: number, k = 1, h = 0) {
    const p = gridToIso(x, y);
    const cx = p.x, cy = p.y + TILE_H / 2 - h;
    const w = (TILE_W / 2) * k, d = (TILE_H / 2) * k;
    return { top: [cx, cy - d], right: [cx + w, cy], bottom: [cx, cy + d], left: [cx - w, cy] };
}

export function tile(g: G, x: number, y: number, color: number, alpha = 1) {
    const t = diamond(x, y);
    g.fillStyle(color, alpha);
    poly(g, [...t.top, ...t.right, ...t.bottom, ...t.left]);
}

export function box(g: G, x: number, y: number, h: number, color: number, k = 0.8, alpha = 1) {
    const b = diamond(x, y, k);
    const t = diamond(x, y, k, h);
    g.fillStyle(shade(color, 0.7), alpha);
    poly(g, [...b.left, ...b.bottom, ...t.bottom, ...t.left]);
    g.fillStyle(shade(color, 0.85), alpha);
    poly(g, [...b.bottom, ...b.right, ...t.right, ...t.bottom]);
    g.fillStyle(color, alpha);
    poly(g, [...t.top, ...t.right, ...t.bottom, ...t.left]);
}


export function drawObject(g: G, o: Pick<ShopObject, 'type' | 'x' | 'y' | 'category' | 'stock' | 'rot'>, alpha = 1, put: Put = noPut, depth = 0) {
    // stands on its footprint's bottom vertex, centred across it (a till spans two cells); turned = mirrored
    const cells = cellsOf(o).map((c) => gridToIso(c.x, c.y));
    const px = cells.reduce((t, c) => t + c.x, 0) / cells.length, py = Math.max(...cells.map((c) => c.y)) + TILE_H - (o.type === 'cassa' ? TILL_LIFT : 0);
    if (put(objectFrame(o), px, py, depth, !!o.rot)) return;
    const look = OBJECT_LOOK[o.type];
    box(g, o.x, o.y, look.h, look.color, look.k, alpha);
    // merce in cima; sparisce quando lo scaffale è vuoto
    if (o.category && o.stock !== 0) box(g, o.x, o.y, look.h + 3, CATEGORY_COLOR[o.category], look.k * 0.6, alpha);
}

const CUSTOMER = 0x3d6fb5;
const CUSTOMER_ANGRY = 0xd64541;
const CUSTOMER_H = 22;

/** Characters are painted facing bottom-right; mirror them while walking towards screen left. */
const goesLeft = (a: { x: number; y: number }, to?: { x: number; y: number }) => !!to && to.x - a.x - (to.y - a.y) < -0.01;

/** Feet of a person standing at fractional cell (x, y): the centre of the diamond. */
const feet = (x: number, y: number) => { const p = gridToIso(x, y); return { x: p.x, y: p.y + TILE_H / 2 }; };

export function drawCustomer(g: G, over: G, s: GameState, c: Customer, put: Put = noPut, depth = 0) {
    const angry = c.state === 'leaving_angry';
    const f = feet(c.x, c.y);
    const drawn = put(personFrame(s, c), f.x, f.y + 2 - (c.path.length ? walkBob(c) : 0), depth, goesLeft(c, c.path[0]));
    if (!drawn) box(g, c.x, c.y, CUSTOMER_H, angry ? CUSTOMER_ANGRY : CUSTOMER, 0.35);
    if (c.state === 'leaving' || angry || c.kind === 'ispettore') return; // the inspector has no patience to lose
    // patience bar over the head
    const p = gridToIso(c.x, c.y);
    const top = p.y + TILE_H / 2 - (drawn ? 52 : CUSTOMER_H + 14);
    g = over;
    const v = Math.max(0, c.patience) / 100;
    g.fillStyle(0x000000, 0.6);
    g.fillRect(p.x - 13, top - 1, 26, 6);
    g.fillStyle(v > 0.5 ? 0x6fae4a : v > 0.25 ? 0xe0a030 : CUSTOMER_ANGRY);
    g.fillRect(p.x - 12, top, 24 * v, 4);
}

export const ROLE_COLOR: Record<Role, number> = { cassiere: 0xc0392b, magazziniere: 0x2e7d5b, pulizie: 0x3b82c4, banconiere: 0xf4efe6, guardia: 0x1f3a6b, capo: 0x6b6b6b };

/** A seated cashier is drawn half a cell behind the till, so the till doesn't hide them. */
const SEAT_OFFSET = 0.45;
/** Seated cashier sprite: screen px from the till's cell centre, behind the register, facing the customers. */
const SEAT_PX = { x: 17, y: -6 };
/** Cashier's stool: this far behind the checkout lane's cell (milestone 24). */
export const LANE_SEAT = 0.8;
/** The painted counter's plinth reaches a little below its footprint: lifted so the low front wall hides it. */
const TILL_LIFT = 3;
/** ...and this far up the lane from the register, so the register doesn't hide them. */
const LANE_ALONG = 0.35;
/** Seat behind a two-cell checkout lane at (x, y), turned or not. */
const laneSeat = (x: number, y: number, turned: boolean) => feet(x - (turned ? LANE_ALONG : LANE_SEAT), y - (turned ? LANE_SEAT : LANE_ALONG));
/** Deli man: standing behind the counter, facing the customers. */
const DELI_PX = { x: -6, y: -20 };

export function drawStaff(g: G, s: GameState, st: Staff, put: Put = noPut, depth = 0) {
    const o = st.state === 'at_till' ? SEAT_OFFSET : 0;
    const f = feet(st.x - o, st.y - o);
    const frame = personFrame(s, st);
    const seated = st.state === 'at_till';
    const at = feet(st.x, st.y);
    const turned = seated && !!s.objects.find((o) => o.id === st.tillId)?.rot; // till mirrored: seat and facing mirror too
    if (seated && st.role === 'cassiere') { // straight checkout lane: seated behind it, facing the customers' side
        const p = laneSeat(st.x, st.y, turned);
        if (put(frame, p.x, p.y + 4, depth, turned)) return;
    }
    const seat = st.role === 'banconiere' ? DELI_PX : SEAT_PX;
    if (seated ? put(frame, at.x + (turned ? -seat.x : seat.x), at.y + seat.y, depth, st.role === 'banconiere' ? turned : !turned) : put(frame, f.x, f.y + 2 - (st.path.length ? walkBob(st) : 0), depth, goesLeft(st, st.path[0]))) return;
    box(g, st.x - o, st.y - o, 24, ROLE_COLOR[st.role], 0.38);
    box(g, st.x - o, st.y - o, 28, 0xf4efe6, 0.24); // berretto bianco
    if (st.job?.units) box(g, st.x + 0.15, st.y + 0.15, 16, CRATE, 0.3); // scatolone in mano
    if (st.job?.units) box(g, st.x + 0.15, st.y + 0.15, 17, CATEGORY_COLOR[st.job.category], 0.18);
}

const CRATE = 0xa8794a;

/** Warehouse stock: one crate stack per category on the warehouse cells, taller with more units. */
function crates(s: GameState) {
    const cells: { x: number; y: number }[] = [];
    for (const r of s.rooms)
        if (r.type === 'magazzino')
            for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) cells.push({ x, y });
    const cats = (Object.keys(s.warehouse) as Category[]).filter((c) => s.warehouse[c] > 0);
    return cats.slice(0, cells.length).map((cat, i) => ({ ...cells[i], cat, h: 8 + Math.min(24, s.warehouse[cat]) }));
}

/** Street props depend only on the lot size: computed once per size. */
let propsKey = '', propsList: Prop[] = [];
function streetProps(s: GameState) {
    const k = `${s.grid.w},${s.grid.h}`;
    if (k !== propsKey) (propsKey = k), (propsList = props(s));
    return propsList;
}
/** A prop standing on its cell like furniture (fractional cells for cars). */
export const putProp = (put: Put, d: Prop, z: number) => {
    const p = gridToIso(d.x, d.y);
    return put(d.frame, p.x, p.y + TILE_H, z);
};

/** Floor layer: lot and rooms. Redraw only when the layout changes. */
export function drawFloor(g: G, s: GameState) {
    g.clear();
    const owner = new Map<string, RoomType>();
    for (const r of s.rooms)
        for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) owner.set(`${x},${y}`, r.type);

    for (let x = 0; x < s.grid.w; x++) {
        for (let y = 0; y < s.grid.h; y++) {
            const type = owner.get(`${x},${y}`);
            const pal = type ? ROOM_FLOOR[type] : LOT;
            tile(g, x, y, pal[(x + y) % 2]);
        }
    }
    for (let x = -MARGIN; x < s.grid.w + MARGIN; x++)
        for (let y = -MARGIN; y < s.grid.h + MARGIN; y++) {
            const k = terrain(s, x, y);
            if (k) tile(g, x, y, GROUND[k][(x + y) % 2 ? 1 : 0]);
        }
    // dashed centre line between the two lanes
    g.fillStyle(0xf1e4c8, 0.9);
    for (let y = -MARGIN; y < s.grid.h + MARGIN; y += 2) {
        const a = gridToIso(s.grid.w + 2, y + 0.2), b = gridToIso(s.grid.w + 2, y + 0.8);
        poly(g, [a.x, a.y - 1.5, b.x, b.y - 1.5, b.x, b.y + 1.5, a.x, a.y + 1.5]);
    }
    for (const o of s.objects) if (o.type === 'porta') box(g, o.x, o.y, 1, 0xa33a2c, 0.7); // doormat
}

/** Wall/door panel on a cell edge: frame and bottom-centre offset from the cell's top vertex. Front edges are parallel to back ones. */
const EDGE: Record<Edge, { side: 'l' | 'r'; dx: number; dy: number }> = {
    l: { side: 'l', dx: -TILE_W / 4, dy: TILE_H / 2 },
    r: { side: 'r', dx: TILE_W / 4, dy: TILE_H / 2 },
    fr: { side: 'l', dx: TILE_W / 4, dy: TILE_H },
    fl: { side: 'r', dx: -TILE_W / 4, dy: TILE_H },
};
function panel(put: Put, name: string, x: number, y: number, edge: Edge, depth: number) {
    const e = EDGE[edge], p = gridToIso(x, y);
    return put(`${name}_${e.side}`, p.x + e.dx, p.y + e.dy, depth);
}
/**
 * The look of a wall follows the room it faces (playtest 2026-11-27): white tiles inside the warehouse and the locker room,
 * plaster and brick everywhere else (plain where it backs onto the warehouse, so the sales floor looks the same all round).
 */
const wallFrame = (w: ReturnType<typeof walls>[number]) =>
    w.shutter ? 'serranda' : w.low ? 'muretto' : STAFF_ONLY.includes(w.room) ? 'muro_interno' : w.inner ? 'muro' : outerWall(w.x, w.y);
/** Outer walls: mostly plain, a window every few cells, now and then a poster. */
const outerWall = (x: number, y: number) => { const h = (x * 7 + y * 13) % 6; return h === 0 ? 'muro_poster' : h === 3 ? 'muro_finestra' : 'muro'; };

/**
 * Things layer, redrawn every frame. Sprites get depth 1 + (x + y), so nearer ones cover farther ones.
 * `g` (under the sprites) holds fallback boxes and warehouse crates; `over` (above) holds patience bars.
 */
export function drawThings(g: G, over: G, s: GameState, put: Put = noPut) {
    g.clear();
    over.clear();
    const items: { d: number; draw: (depth: number) => void }[] = [
        ...walls(s).map((w) => ({ d: w.x + w.y + (w.low ? 0.6 : -0.5), draw: (z: number) => panel(put, wallFrame(w), w.x, w.y, w.side, z) })),
        ...s.objects.filter((o) => o.type === 'cassa' && !cashierAt(s, o)).map((o) => ({ d: o.x + o.y - 0.9, draw: (z: number) => { // empty stool
            const p = laneSeat(o.x, o.y, !!o.rot);
            put('sgabello', p.x, p.y + 4, z);
        } })),
        ...s.objects.map((o) => {
            if (o.type !== 'porta') return { d: o.x + o.y, draw: (z: number) => drawObject(g, o, 1, put, z) };
            const edge = doorEdge(s, o);
            const front = edge === 'fr' || edge === 'fl';
            return { d: o.x + o.y + (front ? 0.6 : -0.5), draw: (z: number) => panel(put, 'porta', o.x, o.y, edge, z) || drawObject(g, o) };
        }),
        ...s.carts.map((c) => ({ d: c.x + c.y, draw: (z: number) => {
            const p = gridToIso(c.x, c.y);
            if (!put(SPRITES.carrello, p.x, p.y + TILE_H - 4, z)) box(g, c.x, c.y, 14, 0xc0392b, 0.5); // fallback: red box
        } })),
        ...s.spills.map((p) => ({ d: p.x + p.y - 0.45, draw: (z: number) => {
            const f = feet(p.x, p.y);
            if (put(SPILL_FRAMES[p.id % SPILL_FRAMES.length], f.x, f.y + TILE_H / 4, z)) return;
            g.fillStyle(0xf6f1e4, 0.95); // fallback: a white puddle
            g.fillEllipse(f.x, f.y, TILE_W * 0.4, TILE_H * 0.4);
        } })),
        ...s.customers.map((c) => ({ d: c.x + c.y + 0.01, draw: (z: number) => drawCustomer(g, over, s, c, put, z) })),
        ...[...streetProps(s), ...decor(s)].map((d) => ({ d: d.x + d.y, draw: (z: number) => putProp(put, d, z) })),
        ...crates(s).map((c) => ({ d: c.x + c.y - 0.01, draw: (z: number) => {
            const p = gridToIso(c.x, c.y);
            if (put(SPRITES.stock(c.cat), p.x, p.y + TILE_H, z)) return; // a pallet of that goods
            box(g, c.x, c.y, c.h, CRATE, 0.6);
            box(g, c.x, c.y, c.h + 2, CATEGORY_COLOR[c.cat], 0.3);
        } })),
        ...s.staff.map((st) => ({ d: st.x + st.y + (st.state === 'at_till' ? -2 * SEAT_OFFSET : 0.02), draw: (z: number) => drawStaff(g, s, st, put, z) })),
    ];
    for (const it of items.sort((a, b) => a.d - b.d)) it.draw(1 + it.d);
}
