// A* on a 4-connected grid. Pure, no Phaser.
import { STEP_MS } from './config.ts';
export type Cell = { x: number; y: number };

const key = (x: number, y: number) => `${x},${y}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Shortest path from `from` to `to` (excluding `from`, including `to`).
 * [] if already there, null if unreachable or `to` is not walkable.
 * `from` itself need not be walkable (e.g. standing on a door).
 */
export function findPath(walkable: Walkable, from: Cell, to: Cell): Cell[] | null {
    if (from.x === to.x && from.y === to.y) return [];
    if (!walkable(to.x, to.y)) return null;
    const h = (x: number, y: number) => Math.abs(x - to.x) + Math.abs(y - to.y);
    const g = new Map<string, number>([[key(from.x, from.y), 0]]);
    const came = new Map<string, Cell>();
    // ponytail: linear scan for the best open node, O(n²) — fine for a ≤ 40×40 lot; binary heap if lots grow
    const open: Cell[] = [from];
    while (open.length) {
        let bi = 0;
        for (let i = 1; i < open.length; i++) {
            const a = open[i], b = open[bi];
            if (g.get(key(a.x, a.y))! + h(a.x, a.y) < g.get(key(b.x, b.y))! + h(b.x, b.y)) bi = i;
        }
        const cur = open.splice(bi, 1)[0];
        if (cur.x === to.x && cur.y === to.y) {
            const path: Cell[] = [];
            for (let c: Cell | undefined = cur; c && !(c.x === from.x && c.y === from.y); c = came.get(key(c.x, c.y))) path.unshift(c);
            return path;
        }
        const gc = g.get(key(cur.x, cur.y))! + 1;
        for (const [dx, dy] of DIRS) {
            const nx = cur.x + dx, ny = cur.y + dy;
            if (!walkable(nx, ny) || (walkable.cross && !walkable.cross(cur, { x: nx, y: ny }))) continue;
            const k = key(nx, ny);
            if (gc < (g.get(k) ?? Infinity)) {
                g.set(k, gc);
                came.set(k, cur);
                if (!open.some((o) => o.x === nx && o.y === ny)) open.push({ x: nx, y: ny });
            }
        }
    }
    return null;
}

/** Cells one may stand on; `cross`, when given, also vets each step between two cells (walls between rooms). */
export type Walkable = ((x: number, y: number) => boolean) & { cross?: (a: Cell, b: Cell) => boolean };

/** Shortest path to any walkable cell next to an object at (o.x, o.y). */
export function pathToObject(w: Walkable, from: Cell, o: Cell): Cell[] | null {
    let best: Cell[] | null = null;
    for (const [dx, dy] of DIRS) {
        const p = findPath(w, from, { x: o.x + dx, y: o.y + dy });
        if (p && (!best || p.length < best.length)) best = p;
    }
    return best;
}

/** Move one fixed step along `e.path` at `cellsPerSec`; snaps and pops on arrival at each cell. */
export function walk(e: Cell & { path: Cell[] }, cellsPerSec: number) {
    const step = (cellsPerSec * STEP_MS) / 1000;
    const n = e.path[0];
    const dx = n.x - e.x, dy = n.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d <= step) {
        e.x = n.x;
        e.y = n.y;
        e.path.shift();
    } else {
        e.x += (dx / d) * step;
        e.y += (dy / d) * step;
    }
}
