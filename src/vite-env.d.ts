/// <reference types="vite/client" />

interface Window {
    /** Sim state as JSON, for agents and browser tests. */
    render_game_to_text: () => string;
    /** Advance the sim by `ms` of real time at the current speed, deterministically. */
    advanceTime: (ms: number) => void;
}
