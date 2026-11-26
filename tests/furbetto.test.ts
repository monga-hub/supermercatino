import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick } from '../src/sim/state.ts';
import { apply } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { PRICES, REP_SERVED, PATIENCE_CUT, FURB_REP_GAIN, FURB_REP_LOSS, SHELF_CAPACITY } from '../src/sim/config.ts';
import type { GameState, Customer } from '../src/sim/state.ts';
import { shop, noArrivals, untilTicks, runOut } from './helpers.ts';

const furbetto = (s: GameState, trick: 'cut' | 'run') => {
    const c = spawnCustomer(s, ['Pasta'], 'furbetto')!;
    c.trick = trick;
    return c;
};

test('furbetti arrive with a trick in mind', () => {
    const s = shop();
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) seen.add(spawnCustomer(s, undefined, 'furbetto')!.trick!);
    assert.deepEqual([...seen].sort(), ['cut', 'run']);
});

test('the furbetto jumps the queue and the people he skips lose patience', () => {
    const s = shop({ cashier: false });
    noArrivals(s);
    const till = s.objects.find((o) => o.type === 'cassa')!;
    const line: Customer[] = [0, 1].map((i) => Object.assign(spawnCustomer(s, ['Pasta'])!, {
        state: 'queueing', goal: { kind: 'till', id: till.id }, x: till.x + i, y: till.y - 1, path: [], queuedAt: s.queueSeq++,
    }));
    const f = furbetto(s, 'cut');
    let before = line.map((c) => c.patience);
    for (let i = 0; i < 5000 && f.state !== 'queueing'; i++) {
        before = line.map((c) => c.patience);
        tick(s);
    }
    assert.equal(f.state, 'queueing');
    assert.ok(line.every((c) => f.queuedAt < c.queuedAt), 'furbetto first in line');
    line.forEach((c, i) => assert.ok(before[i] - c.patience >= PATIENCE_CUT, `${before[i]} -> ${c.patience}`));
});

test('an uncaught runner leaves with the goods: no money, reputation down', () => {
    const s = shop();
    noArrivals(s);
    const money = s.money;
    s.reputation = 50;
    furbetto(s, 'run');
    runOut(s);
    assert.equal(s.money, money);
    assert.equal(s.reputation, 50 - FURB_REP_LOSS);
    assert.equal(s.objects.find((o) => o.type === 'scaffale')!.stock, SHELF_CAPACITY - 1, 'took the goods');
    assert.deepEqual(s.furbetti, { caught: 0, escaped: 1 });
});

test('tapping a runner catches him: he pays and reputation goes up', () => {
    const s = shop();
    noArrivals(s);
    const money = s.money;
    s.reputation = 50;
    const f = furbetto(s, 'run');
    assert.equal(apply(s, { type: 'catch', customerId: f.id }).ok, false, 'not up to anything yet');
    assert.ok(untilTicks(s, () => f.state === 'leaving') > 0, 'runs');
    assert.equal(apply(s, { type: 'catch', customerId: f.id }).ok, true);
    assert.equal(apply(s, { type: 'catch', customerId: f.id }).ok, false, 'only once');
    assert.equal(s.money, money + PRICES.Pasta);
    assert.equal(s.reputation, 50 + REP_SERVED + FURB_REP_GAIN);
    runOut(s);
    assert.deepEqual(s.furbetti, { caught: 1, escaped: 0 });
});

test('tapping a queue jumper catches him too', () => {
    const s = shop({ cashier: false });
    noArrivals(s);
    const money = s.money;
    const f = furbetto(s, 'cut');
    assert.ok(untilTicks(s, () => f.state === 'queueing') > 0);
    assert.equal(apply(s, { type: 'catch', customerId: f.id }).ok, true);
    assert.equal(s.money, money + PRICES.Pasta);
    assert.equal(f.state, 'leaving');
});

test('ordinary customers cannot be caught', () => {
    const s = shop();
    const c = spawnCustomer(s, ['Pasta'])!;
    assert.equal(apply(s, { type: 'catch', customerId: c.id }).ok, false);
});
