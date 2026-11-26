import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick } from '../src/sim/state.ts';
import { apply, type Command } from '../src/sim/build.ts';
import { spawnCustomer, walkableFor } from '../src/sim/customers.ts';
import { cashierAt } from '../src/sim/staff.ts';
import { nextDay } from '../src/sim/day.ts';
import { loadGame } from '../src/sim/save.ts';
import { ENERGY_MAX, BREAK_BELOW, PAY_SEC, TIRED_SPEED } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop, noArrivals, untilTicks, hireStaff } from './helpers.ts';

const ok = (s: GameState, c: Command) => assert.equal(apply(s, c).ok, true, JSON.stringify(c));
const till = (s: GameState) => s.objects.find((o) => o.type === 'cassa')!;

/** shop() (cashier seated) plus, optionally, a staff room left of the checkout (x0..2, y6..8) with lockers. */
function staffShop({ breakroom = true } = {}) {
    const s = shop();
    noArrivals(s);
    s.staff[0].trait = 'normale';
    if (breakroom) {
        ok(s, { type: 'buildRoom', room: 'spogliatoio', x: 0, y: 6, w: 3, h: 3 });
        ok(s, { type: 'placeObject', object: 'armadietti', x: 0, y: 6 });
    }
    return s;
}

test('lockers go in the staff room only; customers never walk in there', () => {
    const s = staffShop();
    assert.equal(apply(s, { type: 'placeObject', object: 'armadietti', x: 4, y: 4 }).ok, false);
    assert.equal(walkableFor(s)(1, 7), false);
    assert.equal(hireStaff(s, 'magazziniere').energy, ENERGY_MAX, 'hired fresh');
});

test('working tires staff out', () => {
    const s = staffShop();
    const e = s.staff[0].energy;
    untilTicks(s, () => false, 600);
    assert.ok(s.staff[0].energy < e, `${s.staff[0].energy}`);
});

test('a tired cashier leaves the till for the staff room, rests, then comes back', () => {
    const s = staffShop();
    const st = s.staff[0];
    st.energy = BREAK_BELOW - 1;
    assert.ok(untilTicks(s, () => st.state === 'resting') >= 0, 'goes on a break');
    assert.equal(cashierAt(s, till(s)), undefined, 'the till is uncovered meanwhile');
    assert.ok(untilTicks(s, () => st.state === 'at_till') > 0, 'back at the till');
    assert.ok(st.energy >= ENERGY_MAX * 0.95, `rested (minus the walk back): ${st.energy}`);
});

test('the break waits for the customer being served', () => {
    const s = staffShop();
    const st = s.staff[0];
    const c = spawnCustomer(s, ['Pasta'])!;
    untilTicks(s, () => c.state === 'paying');
    st.energy = BREAK_BELOW - 1;
    tick(s);
    assert.equal(st.state, 'at_till');
});

test('no staff room: tired staff work at half pace', () => {
    const payTimer = (energy: number) => {
        const s = staffShop({ breakroom: false });
        s.staff[0].energy = energy;
        const c = spawnCustomer(s, ['Pasta'])!;
        untilTicks(s, () => c.state === 'paying');
        return c.timer;
    };
    assert.ok(Math.abs(payTimer(ENERGY_MAX) - PAY_SEC) < 0.2);
    assert.ok(Math.abs(payTimer(0) - PAY_SEC / TIRED_SPEED) < 0.2, `${payTimer(0)}`);
});

test('everyone starts the day rested; old saves load with full energy', () => {
    const s = staffShop();
    s.staff[0].energy = 5;
    nextDay(s);
    assert.equal(s.staff[0].energy, ENERGY_MAX);
    const old = shop();
    for (const st of old.staff) delete (st as Partial<typeof st>).energy;
    assert.equal(loadGame(JSON.stringify({ v: 1, s: old }))?.staff[0].energy, ENERGY_MAX);
});

test('a busy tired cashier takes no new customer and goes on the break', () => {
    const s = staffShop();
    const st = s.staff[0];
    const line = [0, 1, 2].map(() => spawnCustomer(s, ['Pasta'])!);
    untilTicks(s, () => line[0].state === 'paying');
    st.energy = BREAK_BELOW - 1;
    assert.ok(untilTicks(s, () => st.state === 'resting', 300) >= 0, 'never free with a queue');
});

test('one break at a time per role', () => {
    const s = staffShop();
    ok(s, { type: 'placeObject', object: 'cassa', x: 3, y: 9 });
    const b = hireStaff(s, 'cassiere');
    untilTicks(s, () => b.state === 'at_till');
    for (const st of s.staff) st.energy = BREAK_BELOW - 1;
    let both = false;
    untilTicks(s, () => (both ||= s.staff.every((st) => st.state === 'resting')) || s.staff.every((st) => st.energy > BREAK_BELOW), 3000);
    assert.equal(both, false, 'both cashiers left at once');
    assert.ok(s.staff.every((st) => st.energy > BREAK_BELOW), 'both rested in turn');
});

