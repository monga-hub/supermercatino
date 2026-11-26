// Grid <-> isometric screen conversion. Pure math, no Phaser.
// gridToIso(x, y) is the TOP vertex of cell (x, y)'s diamond.

export const TILE_W = 64;
export const TILE_H = 32;

export function gridToIso(x: number, y: number) {
    return { x: ((x - y) * TILE_W) / 2, y: ((x + y) * TILE_H) / 2 };
}

/** Exact inverse of gridToIso (fractional grid coords). */
export function isoToGrid(px: number, py: number) {
    return { x: py / TILE_H + px / TILE_W, y: py / TILE_H - px / TILE_W };
}

/** The cell containing world point (px, py). */
export function cellAt(px: number, py: number) {
    const g = isoToGrid(px, py);
    return { x: Math.floor(g.x), y: Math.floor(g.y) };
}
