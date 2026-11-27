// Where walls and the door are drawn. Pure: tests/walls.test.ts.
// Edges of cell (x, y) on screen: 'l' = top-left (-x), 'r' = top-right (-y), 'fr' = bottom-right (+x), 'fl' = bottom-left (+y).
import { roomAt, doorways, edgeKey, walled } from '../sim/build.ts';
import type { GameState, ShopObject } from '../sim/state.ts';

export type Edge = 'l' | 'r' | 'fr' | 'fl';
const DIRS: [Edge, number, number][] = [['l', -1, 0], ['r', 0, -1], ['fr', 1, 0], ['fl', 0, 1]];

/** The door's edge: towards the lot if it can, else towards a non-sales room (same rule as placing it). Back edges first. */
export function doorEdge(s: GameState, d: Pick<ShopObject, 'x' | 'y'>): Edge {
    const out = DIRS.find(([, dx, dy]) => !roomAt(s, d.x + dx, d.y + dy));
    const other = DIRS.find(([, dx, dy]) => roomAt(s, d.x + dx, d.y + dy)?.type !== 'sala_vendita');
    return (out ?? other ?? DIRS[0])[0];
}

/**
 * Walls on cell edges (Theme Hospital style). Back edges ('l', 'r') facing the lot or a different kind of room get a full wall,
 * except doorways and the door; front edges ('fr', 'fl') facing the lot get a low wall (`low`), so the shop stays visible.
 */
export function walls(s: GameState) {
    const door = s.objects.filter((o) => o.type === 'porta').map((d) => `${d.x},${d.y},${doorEdge(s, d)}`);
    const open = doorways(s);
    const out: { x: number; y: number; side: Edge; low?: boolean; inner?: boolean }[] = [];
    for (const r of s.rooms)
        for (let y = r.y; y < r.y + r.h; y++)
            for (let x = r.x; x < r.x + r.w; x++)
                for (const [side, dx, dy] of DIRS) {
                    const n = roomAt(s, x + dx, y + dy), back = side === 'l' || side === 'r';
                    if (door.includes(`${x},${y},${side}`)) continue;
                    if (!n) out.push({ x, y, side, ...(back ? {} : { low: true }) });
                    else if (back && walled(n.type, r.type) && !open.has(edgeKey(x, y, x + dx, y + dy))) out.push({ x, y, side, inner: true });
                }
    return out;
}
