import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick } from '../src/sim/state.ts';
import { apply } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { addSpill } from '../src/sim/dirt.ts';
import { closeDay } from '../src/sim/day.ts';
import { DAY_OPEN_MIN, SPILL_REP } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop, noArrivals, untilTicks, hireStaff } from './helpers.ts';

/** Spills left by `n` customers walking in and out one at a time (cleared as they appear, so no cap). */
function spillsLeft(bins: boolean, n = 300) {
    const s = shop();
    noArrivals(s);
    if (bins) for (const [x, y] of [[3, 3], [8, 3], [3, 7], [8, 7]])
        assert.equal(apply(s, { type: 'placeObject', object: 'cestino', x, y }).ok, true);
    let total = 0;
    for (let i = 0; i < n; i++) {
        s.clockSec = DAY_OPEN_MIN * 60;
        s.objects.find((o) => o.type === 'scaffale')!.stock = 10;
        spawnCustomer(s, ['Pasta']);
        for (let t = 0; t < 2000 && s.customers.length; t++) {
            tick(s);
            total += s.spills.length;
            s.spills = [];
        }
    }
    return total;
}

test('customers spill yogurt; near a bin they spill less', () => {
    const without = spillsLeft(false), withBins = spillsLeft(true);
    assert.ok(without > 10, `spills ${without}`);
    assert.ok(withBins < without * 0.75, `${withBins} with bins vs ${without} without`);
});

test('a bin goes in the sales floor only', () => {
    const s = shop();
    assert.equal(apply(s, { type: 'placeObject', object: 'cestino', x: 3, y: 9 }).ok, false);
    assert.equal(apply(s, { type: 'placeObject', object: 'cestino', x: 3, y: 3 }).ok, true);
});

test('standing next to a spill drains patience', () => {
    const queued = (spill: boolean) => {
        const s = shop({ cashier: false });
        noArrivals(s);
        const till = s.objects.find((o) => o.type === 'cassa')!;
        const c = spawnCustomer(s, ['Pasta'])!;
        Object.assign(c, { state: 'queueing', goal: { kind: 'till', id: till.id }, x: till.x, y: till.y - 1, path: [] });
        if (spill) addSpill(s, till.x + 1, till.y - 1);
        for (let i = 0; i < 20; i++) tick(s);
        return c.patience;
    };
    assert.ok(queued(true) < queued(false) - 3, `${queued(true)} vs ${queued(false)}`);
});

test('spills left at closing cost reputation', () => {
    const rep = (n: number) => {
        const s = shop();
        for (let i = 0; i < n; i++) addSpill(s, 3 + i, 6);
        s.reputation = 50;
        closeDay(s);
        return s.reputation;
    };
    assert.equal(rep(0) - rep(4), 4 * SPILL_REP);
});

const spillAt = (s: GameState, x: number, y: number) => s.spills.some((p) => p.x === x && p.y === y);

test('the cleaner mops spills, tapped ones first', () => {
    const s = shop();
    noArrivals(s);
    const old = addSpill(s, 3, 3)!;
    const tapped = addSpill(s, 7, 7)!;
    assert.equal(apply(s, { type: 'clean', spillId: tapped.id }).ok, false, 'no cleaner yet');
    hireStaff(s, 'pulizie');
    assert.equal(apply(s, { type: 'clean', spillId: tapped.id }).ok, true);
    assert.equal(apply(s, { type: 'clean', spillId: tapped.id }).ok, false, 'already on its way');
    assert.ok(untilTicks(s, () => !spillAt(s, 7, 7)) > 0, 'tapped spill cleaned');
    assert.ok(spillAt(s, 3, 3), 'the older one waits');
    assert.ok(untilTicks(s, () => !s.spills.length) > 0, 'then the rest');
    assert.equal(old.id < tapped.id, true);
});

test('a spill under a new object is gone', () => {
    const s = shop();
    addSpill(s, 3, 3);
    assert.equal(apply(s, { type: 'placeObject', object: 'cestino', x: 3, y: 3 }).ok, true);
    assert.equal(s.spills.length, 0);
});
