// Save/load of the whole sim state (milestone 11). The state is plain JSON (ADR-0001). Pure.
import { createState, type GameState } from './state.ts';

export const SAVE_KEY = 'supermercatino-save';
/** Bump when the meaning of a field changes; a new or removed field is caught by the key check below. */
const VERSION = 1;

export const saveGame = (s: GameState) => JSON.stringify({ v: VERSION, s });

/** The saved state, or null if missing, corrupt, from another version or missing fields. */
export function loadGame(text: string | null): GameState | null {
    try {
        const d = JSON.parse(text ?? '');
        const s = d?.v === VERSION && d.s;
        if (s && typeof s === 'object' && s.rooms) Object.assign(s, { spills: s.spills ?? [], cleanQueue: s.cleanQueue ?? [] }); // milestone 11 saves: no dirt yet
        return s && typeof s === 'object' && Object.keys(createState()).every((k) => k in s) ? s : null;
    } catch {
        return null;
    }
}
