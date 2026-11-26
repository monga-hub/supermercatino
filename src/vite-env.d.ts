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
    /** Open menu card: 'start', 'levels', 'briefing' or null (milestones 11, 20). */
    menuState: () => string | null;
    /** Audio mute preference and whether the context started (milestone 16). */
    audioState: () => { muted: boolean; started: boolean };
    /** Screen point of a cell's centre, raised by `lift` world px, and the camera zoom (browser tests). */
    cellToScreen: (x: number, y: number, lift?: number) => { x: number; y: number; zoom: number };
}
