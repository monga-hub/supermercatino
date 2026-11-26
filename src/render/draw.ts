// Placeholder drawing: flat iso tiles and boxes. Replaced by AI sprites after milestone 03.
import type { GameObjects } from 'phaser';
import { gridToIso, TILE_W, TILE_H } from './iso.ts';
import type { GameState, RoomType, ObjectType, ShopObject } from '../sim/state.ts';

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

export function drawObject(g: G, o: Pick<ShopObject, 'type' | 'x' | 'y' | 'category'>, alpha = 1) {
    const look = OBJECT_LOOK[o.type];
    box(g, o.x, o.y, look.h, look.color, look.k, alpha);
    if (o.category) box(g, o.x, o.y, look.h + 3, CATEGORY_COLOR[o.category], look.k * 0.6, alpha); // merce in cima
}

export function drawWorld(g: G, s: GameState) {
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
    // draw back-to-front so nearer boxes cover farther ones
    for (const o of [...s.objects].sort((a, b) => a.x + a.y - (b.x + b.y))) drawObject(g, o);
}
