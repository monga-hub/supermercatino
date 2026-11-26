// Dirt (milestone 12): customers spill yogurt, spills annoy whoever is near, the cleaner mops them. Pure, deterministic.
import { STEP_MS, SPILL_CHANCE, BIN_RADIUS, SPILL_MAX, CUSTOMER_TYPES, STAFF_SPEED, TRAITS, CLEAN_SEC } from './config.ts';
import { rand } from './rng.ts';
import { findPath, walk, type Walkable } from './path.ts';
import type { GameState, Customer, Staff } from './state.ts';

export type Spill = { id: number; x: number; y: number };

const near = (a: { x: number; y: number }, x: number, y: number, r: number) => Math.abs(a.x - x) <= r && Math.abs(a.y - y) <= r;

/** New spill on a cell (none if the cell already has one or the shop is at the cap). */
export function addSpill(s: GameState, x: number, y: number): Spill | null {
    if (s.spills.length >= SPILL_MAX || s.spills.some((p) => p.x === x && p.y === y)) return null;
    const p = { id: s.nextId++, x, y };
    s.spills.push(p);
    return p;
}

/** A customer just stepped onto a new cell: maybe they spill something (half as often near a bin). */
export function maybeSpill(s: GameState, c: Customer) {
    if (s.objects.some((o) => o.x === c.x && o.y === c.y)) return; // not on the doormat
    const type = CUSTOMER_TYPES[c.kind];
    const bin = s.objects.some((o) => o.type === 'cestino' && near(o, c.x, c.y, BIN_RADIUS));
    if (rand(s) < SPILL_CHANCE * ('spill' in type ? type.spill : 1) * (bin ? 0.5 : 1)) addSpill(s, c.x, c.y);
}

/** Is there a spill on or next to this (possibly fractional) position? */
export const spillNear = (s: GameState, x: number, y: number) => s.spills.some((p) => near(p, Math.round(x), Math.round(y), 1));

/** Cleaner: tapped spills first (FIFO), then the oldest; walk there, mop, next. */
export function updateCleaner(s: GameState, st: Staff, w: Walkable) {
    let spill = s.spills.find((p) => p.id === st.clean?.spillId);
    if (!spill) {
        delete st.clean;
        st.state = 'idle';
        s.cleanQueue = s.cleanQueue.filter((id) => s.spills.some((p) => p.id === id));
        const taken = new Set(s.staff.map((o) => o.clean?.spillId));
        const free = (id: number) => !taken.has(id);
        // ponytail: oldest = lowest id; nearest-first if cleaners walk too much
        const order = [...s.cleanQueue.filter(free), ...s.spills.map((p) => p.id).filter(free)];
        for (const id of order) {
            const p = s.spills.find((q) => q.id === id)!;
            const path = findPath(w, { x: Math.round(st.x), y: Math.round(st.y) }, p);
            if (!path) continue;
            spill = p;
            st.path = path;
            st.clean = { spillId: id, timer: CLEAN_SEC / TRAITS[st.trait].speed };
            s.cleanQueue = s.cleanQueue.filter((q) => q !== id);
            break;
        }
        if (!spill) return;
    }
    if (st.path.length) return walk(st, STAFF_SPEED * TRAITS[st.trait].speed);
    st.state = 'cleaning';
    st.clean!.timer -= STEP_MS / 1000;
    if (st.clean!.timer > 0) return;
    s.spills = s.spills.filter((p) => p !== spill);
    delete st.clean;
    st.state = 'idle';
}
