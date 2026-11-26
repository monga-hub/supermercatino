/// <reference types="vite/client" />

interface Window {
    /** Sim state as JSON, for agents and browser tests. */
    render_game_to_text: () => string;
    /** Advance the sim by `ms` of real time at the current speed, deterministically. */
    advanceTime: (ms: number) => void;
    /** Run a sim command (build, place, demolish). Returns { ok, cost } or { ok: false, reason }. */
    dispatch: (cmd: import('./sim/build.ts').Command) => import('./sim/build.ts').Result;
    /** Select a build tool as if from the toolbar (null = none). */
    selectTool: (tool: import('./game/scenes/Game.ts').Tool) => void;
}
