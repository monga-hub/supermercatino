// Every balance/tuning number lives here. Values are provisional: tune in playtest.

/** Shop lot size in cells. */
export const GRID_W = 20;
export const GRID_H = 20;

/** Fixed simulation step, in real milliseconds at 1x. */
export const STEP_MS = 100;

/** Opening hours, in minutes since midnight. */
export const DAY_OPEN_MIN = 8 * 60;
export const DAY_CLOSE_MIN = 20 * 60;

/** Game minutes that pass per real second at 1x (12h day ≈ 4 real minutes at 1x).
 *  GAME_MIN_PER_SEC * 60 * STEP_MS / 1000 must be an integer (seconds per step). */
export const GAME_MIN_PER_SEC = 3;

export const SPEEDS = [1, 2, 3] as const;
