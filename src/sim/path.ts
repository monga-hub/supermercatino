// A* on a 4-connected grid. Pure, no Phaser.
export type Cell = { x: number; y: number };

const key = (x: number, y: number) => `${x},${y}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Shortest path from `from` to `to` (excluding `from`, including `to`).
 * [] if already there, null if unreachable or `to` is not walkable.
 * `from` itself need not be walkable (e.g. standing on a door).
 */
export function findPath(walkable: (x: number, y: number) => boolean, from: Cell, to: Cell): Cell[] | null {
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
            if (!walkable(nx, ny)) continue;
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
