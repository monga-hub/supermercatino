// Placeholder drawing: flat iso tiles and boxes. Replaced by AI sprites after milestone 03.
import type { GameObjects } from 'phaser';
import { gridToIso, TILE_W, TILE_H } from './iso.ts';
import type { GameState, RoomType, ObjectType, ShopObject, Customer, Staff, Role, Category } from '../sim/state.ts';

type G = GameObjects.Graphics;

const LOT = [0x5b5048, 0x544a42]; // cemento
export const ROOM_FLOOR: Record<RoomType, [number, number]> = {
    sala_vendita: [0xf1e4c8, 0xb5523b], // linoleum crema/mattone
    magazzino: [0x8d7b62, 0x7f6e57],
    area_casse: [0xf1e4c8, 0x4f7f6a],
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

export function drawObject(g: G, o: Pick<ShopObject, 'type' | 'x' | 'y' | 'category' | 'stock'>, alpha = 1) {
    const look = OBJECT_LOOK[o.type];
    box(g, o.x, o.y, look.h, look.color, look.k, alpha);
    // merce in cima; sparisce quando lo scaffale è vuoto
    if (o.category && o.stock !== 0) box(g, o.x, o.y, look.h + 3, CATEGORY_COLOR[o.category], look.k * 0.6, alpha);
}

const CUSTOMER = 0x3d6fb5;
const CUSTOMER_ANGRY = 0xd64541;
const CUSTOMER_H = 22;

export function drawCustomer(g: G, c: Customer) {
    box(g, c.x, c.y, CUSTOMER_H, c.state === 'leaving_angry' ? CUSTOMER_ANGRY : CUSTOMER, 0.35);
    // patience bar over the head
    const p = gridToIso(c.x, c.y);
    const top = p.y + TILE_H / 2 - CUSTOMER_H - 14;
    const v = Math.max(0, c.patience) / 100;
    g.fillStyle(0x000000, 0.6);
    g.fillRect(p.x - 13, top - 1, 26, 6);
    g.fillStyle(v > 0.5 ? 0x6fae4a : v > 0.25 ? 0xe0a030 : CUSTOMER_ANGRY);
    g.fillRect(p.x - 12, top, 24 * v, 4);
}

export const ROLE_COLOR: Record<Role, number> = { cassiere: 0xc0392b, magazziniere: 0x2e7d5b };

/** A seated cashier is drawn half a cell behind the till, so the till doesn't hide them. */
const SEAT_OFFSET = 0.45;

export function drawStaff(g: G, st: Staff) {
    const o = st.state === 'at_till' ? SEAT_OFFSET : 0;
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
}

/** Things layer: objects and customers, back-to-front so nearer ones cover farther ones. Redraw every frame. */
export function drawThings(g: G, s: GameState) {
    g.clear();
    const items: { d: number; draw: () => void }[] = [
        ...s.objects.map((o) => ({ d: o.x + o.y, draw: () => drawObject(g, o) })),
        ...s.customers.map((c) => ({ d: c.x + c.y + 0.01, draw: () => drawCustomer(g, c) })),
        ...crates(s).map((c) => ({ d: c.x + c.y - 0.01, draw: () => {
            box(g, c.x, c.y, c.h, CRATE, 0.6);
            box(g, c.x, c.y, c.h + 2, CATEGORY_COLOR[c.cat], 0.3);
        } })),
        ...s.staff.map((st) => ({ d: st.x + st.y + (st.state === 'at_till' ? -2 * SEAT_OFFSET : 0.02), draw: () => drawStaff(g, st) })),
    ];
    for (const it of items.sort((a, b) => a.d - b.d)) it.draw();
}
