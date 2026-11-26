import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, tick } from '../src/sim/state.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { shop, noArrivals, runOut, untilTicks } from './helpers.ts';
import { apply } from '../src/sim/build.ts';
import { PRICES, SHELF_CAPACITY } from '../src/sim/config.ts';

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
    assert.deepEqual(seen.get(c.id), ['shopping', 'queueing', 'paying', 'ready', 'leaving']);
    assert.equal(s.objects.find((o) => o.type === 'scaffale')!.stock, SHELF_CAPACITY - 1);
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

test('queue on distinct cells', () => {
    const s = shop({ cashier: false }); // nobody pays: the queue only grows
    noArrivals(s);
    const till = s.objects.find((o) => o.type === 'cassa')!;
    const cs = [0, 1, 2].map(() => {
        const c = spawnCustomer(s, ['Pasta'])!;
        Object.assign(c, { basket: ['Pasta'], next: 1 }); // list done: straight to the till
        return c;
    });
    assert.ok(untilTicks(s, () => cs.every((c) => c.state === 'queueing' && !c.path.length)) >= 0, 'all lined up');
    const cells = cs.map((c) => `${c.x},${c.y}`);
    assert.equal(new Set(cells).size, 3, cells.join(' '));
    const first = [...cs].sort((a, b) => a.queuedAt - b.queuedAt)[0];
    assert.equal(Math.abs(first.x - till.x) + Math.abs(first.y - till.y), 1, 'first in line next to the till');
});

test('reroute after demolish', () => {
    const s = shop();
    noArrivals(s);
    assert.equal(apply(s, { type: 'placeObject', object: 'scaffale', x: 3, y: 3, category: 'Pasta' }).ok, true);
    const far = s.objects.at(-1)!;
    const c = spawnCustomer(s, ['Pasta'])!;
    for (let i = 0; i < 3; i++) tick(s); // on its way to the near shelf, between two cells
    const near = s.objects.find((o) => o.type === 'scaffale' && o !== far)!;
    assert.equal(c.goal?.kind === 'shelf' && c.goal.id, near.id);
    assert.equal(apply(s, { type: 'demolish', x: near.x, y: near.y }).ok, true);
    assert.equal(c.goal?.kind === 'shelf' && c.goal.id, far.id, 'heads to the other Pasta shelf right away');
    const p0 = c.path[0];
    assert.ok(Math.abs(p0.x - c.x) + Math.abs(p0.y - c.y) <= 1, 'path starts where it stands');
    assert.ok(untilTicks(s, () => c.basket.length === 1) >= 0, 'gets the pasta');
});
