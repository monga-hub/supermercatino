// Milestone 21b: the town around the shop and the knick-knacks inside. Render only, pure: tests/scenery.test.ts.
// The street runs along the lot's +x side (bottom-right on screen), where every campaign door faces.
import { roomAt, objectAt } from '../sim/build.ts';
import type { GameState } from '../sim/state.ts';

/** Cells of ground drawn around the lot. ponytail: a fixed margin; the camera's grass background covers beyond it. */
export const MARGIN = 24;
export type Ground = 'grass' | 'sidewalk' | 'road';
export type Prop = { frame: string; x: number; y: number };

/** Ground outside the lot: sidewalk, two road lanes, sidewalk along +x; grass elsewhere. null on the lot. */
export function terrain(s: GameState, x: number, y: number): Ground | null {
    const { w, h } = s.grid;
    if (x >= 0 && y >= 0 && x < w && y < h) return null;
    const d = x - w;
    return d === 0 || d === 3 ? 'sidewalk' : d === 1 || d === 2 ? 'road' : 'grass';
}

const hash = (x: number, y: number) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000;

/** Lamps, benches and planters on the sidewalks; trees and bushes on the grass, kept clear of the shop's front. */
export function props(s: GameState): Prop[] {
    const { w, h } = s.grid;
    const out: Prop[] = [];
    for (let y = -10; y < h + 10; y++) {
        const byShop = y >= 0 && y < h; // keep the shop front clear: only planters there
        if (y % 5 === 2 && !byShop) out.push({ frame: 'lampione', x: w, y });
        else if (y % 10 === 4 || (byShop && y % 4 === 1)) out.push({ frame: 'fioriera', x: w, y });
        if (y % 5 === 4) out.push({ frame: 'lampione', x: w + 3, y });
        else if (y % 10 === 7) out.push({ frame: 'panchina', x: w + 3, y });
    }
    for (let x = -10; x < w + 12; x++)
        for (let y = -10; y < h + 10; y++) {
            if (terrain(s, x, y) !== 'grass') continue;
            const front = x >= w + 4 ? x < w + 5 : y >= h && y < h + 3; // right by the road, or in front of the shop
            const near = x >= -1 && y >= -1 && x <= w && y <= h;
            const r = hash(x, y);
            if (front || near || r >= 110) continue;
            out.push({ frame: r < 55 ? 'albero' : r < 85 ? 'cipresso' : 'cespuglio', x, y });
        }
    return out;
}

/** Cars that drive by, one at a time, down the near lane. */
export const CARS = ['auto_rossa', 'ape', 'auto_bianca'];
const DRIVE_MS = 9000, EVERY_MS = 16000;

/** The car on the road at real time t (ms), if any: fractional cell, driving towards +y. */
export function carAt(s: GameState, t: number): Prop | null {
    const n = Math.floor(t / EVERY_MS), k = (t % EVERY_MS) / DRIVE_MS;
    if (k > 1) return null;
    return { frame: CARS[n % CARS.length], x: s.grid.w + 1.5, y: -14 + k * (s.grid.h + 28) };
}

/** Each room's knick-knacks: corner cells, skipped where furniture or the door stands. */
export function decor(s: GameState): Prop[] {
    const out: Prop[] = [];
    const free = (x: number, y: number) => roomAt(s, x, y) && !objectAt(s, x, y) && !out.some((d) => d.x === x && d.y === y);
    for (const r of s.rooms) {
        const right = r.x + r.w - 1, left = r.y + r.h - 1, mid = r.x + Math.floor(r.w / 2);
        const want: [string, number, number][] =
            r.type === 'sala_vendita' ? [['pianta', r.x, r.y], ['piantina', right, r.y], ['estintore', r.x, left], ['pomodoro', mid, r.y]]
            : r.type === 'area_casse' ? [['ceste', r.x, r.y]]
            : r.type === 'magazzino' ? [['scopa', r.x, left]]
            : [['piantina', r.x, r.y]];
        for (const [frame, x, y] of want) if (free(x, y)) out.push({ frame, x, y });
    }
    return out;
}
