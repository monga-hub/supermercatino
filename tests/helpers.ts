import assert from 'node:assert/strict';
import { createState, tick, type GameState } from '../src/sim/state.ts';
import { apply, type Command } from '../src/sim/build.ts';

/** Sales floor x3..8 y3..7, door on its right edge, Pasta shelf; checkout area below (y8..9) with a till. */
export function shop({ door = true, till = true, cashier = true } = {}): GameState {
    const s = createState();
    const ok = (c: Command) => assert.equal(apply(s, c).ok, true, JSON.stringify(c));
    ok({ type: 'buildRoom', room: 'sala_vendita', x: 3, y: 3, w: 6, h: 5 });
    ok({ type: 'placeObject', object: 'scaffale', x: 5, y: 4, category: 'Pasta' });
    if (door) ok({ type: 'placeObject', object: 'porta', x: 8, y: 5 });
    if (till) {
        ok({ type: 'buildRoom', room: 'area_casse', x: 3, y: 8, w: 3, h: 2 });
        ok({ type: 'placeObject', object: 'cassa', x: 4, y: 9 });
    }
    if (cashier && door && till) {
        noArrivals(s);
        hireCashier(s);
        assert.ok(untilTicks(s, () => s.staff[0].state === 'at_till') >= 0, 'cashier reaches the till');
        s.spawnAcc = 0;
    }
    return s;
}

/** Hire the first cashier candidate (optionally forcing a trait). */
export function hireCashier(s: GameState, trait?: string) {
    const cand = s.candidates.find((c) => c.role === 'cassiere')!;
    if (trait) cand.trait = trait as typeof cand.trait;
    assert.equal(apply(s, { type: 'hire', candidateId: cand.id }).ok, true);
    return s.staff.at(-1)!;
}

/** Stop automatic arrivals so a test controls exactly who is in the shop. */
export const noArrivals = (s: GameState) => (s.spawnAcc = -1e9);

/** Tick until `done()` (returns ticks used) or give up after maxTicks (returns -1). */
export function untilTicks(s: GameState, done: () => boolean, maxTicks = 20_000) {
    for (let i = 0; i < maxTicks; i++) {
        if (done()) return i;
        tick(s);
    }
    return -1;
}

/** Tick until no customers are left (or a safety cap), recording each customer's state changes. */
export function runOut(s: GameState, maxTicks = 20_000) {
    const seen = new Map<number, string[]>();
    for (let i = 0; i < maxTicks && s.customers.length; i++) {
        tick(s);
        for (const c of s.customers) {
            const h = seen.get(c.id) ?? [];
            if (h.at(-1) !== c.state) h.push(c.state);
            seen.set(c.id, h);
        }
    }
    return seen;
}
