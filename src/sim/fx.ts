/** Money in (+) or out (-) and the cell it happened on, for the floating numbers (playtest 2026-11-27).
 *  Render only: with nobody listening (tests, balance bot) nothing is kept. */
export const cash: { on: ((n: number, x?: number, y?: number) => void) | null } = { on: null };
