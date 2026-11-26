import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, tick } from '../src/sim/state.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { shop, noArrivals, runOut } from './helpers.ts';
import { PRICES, SHELF_STOCK } from '../src/sim/config.ts';

test('spawn only with door and reachable till', () => {
    for (const opts of [{ door: false }, { till: false }]) {
        const s = shop(opts);
        advance(s, 60_000);
        assert.equal(s.customers.length + s.servedToday + s.lostToday, 0, JSON.stringify(opts));
    }
    const s = shop();
    advance(s, 60_000);
    assert.ok(s.customers.length + s.servedToday + s.lostToday > 0, 'customers arrive in a valid shop');
});

test('happy path pays', () => {
    const s = shop();
    noArrivals(s);
    const m0 = s.money;
    const c = spawnCustomer(s, ['Pasta'])!;
    assert.ok(c, 'spawned');
    const seen = runOut(s);
    assert.deepEqual(seen.get(c.id), ['shopping', 'queueing', 'paying', 'leaving']);
    assert.equal(s.objects.find((o) => o.type === 'scaffale')!.stock, SHELF_STOCK - 1);
    assert.equal(s.money, m0 + PRICES.Pasta);
    assert.equal(s.servedToday, 1);
    assert.equal(s.lostToday, 0);
});

test('empty shelf makes customer leave angry', () => {
    const s = shop();
    noArrivals(s);
    s.objects.find((o) => o.type === 'scaffale')!.stock = 0;
    const m0 = s.money;
    const c = spawnCustomer(s, ['Pasta', 'Pane'])!; // Pasta empty, Pane missing entirely
    const seen = runOut(s);
    assert.equal(seen.get(c.id)!.at(-1), 'leaving_angry');
    assert.equal(s.money, m0);
    assert.equal(s.servedToday, 0);
    assert.equal(s.lostToday, 1);
});

test('queue is FIFO', () => {
    const s = shop();
    noArrivals(s);
    const a = spawnCustomer(s, ['Pasta'])!;
    for (let i = 0; i < 5; i++) tick(s); // b starts a little later
    const b = spawnCustomer(s, ['Pasta'])!;
    const queued: number[] = [];
    const paid: number[] = [];
    for (let i = 0; i < 20_000 && s.customers.length; i++) {
        tick(s);
        for (const c of s.customers) {
            if (c.state === 'queueing' && !queued.includes(c.id)) queued.push(c.id);
            if (c.state === 'paying' && !paid.includes(c.id)) paid.push(c.id);
        }
    }
    assert.deepEqual(queued, [a.id, b.id]);
    assert.deepEqual(paid, queued);
});

test('deterministic with seed', () => {
    const run = () => {
        const s = shop();
        advance(s, 120_000);
        return JSON.stringify(s);
    };
    assert.equal(run(), run());
});
