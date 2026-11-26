import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick } from '../src/sim/state.ts';
import { apply } from '../src/sim/build.ts';
import { spawnCustomer, walkableFor } from '../src/sim/customers.ts';
import { addSpill } from '../src/sim/dirt.ts';
import { nextDay } from '../src/sim/day.ts';
import { CART_MAX, DAY_OPEN_MIN, INSPECTION_DAY, INSPECTION_HOUR, INSPECTION_FINE, INSPECTION_BONUS, SHELF_CAPACITY } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop, noArrivals, untilTicks, hireStaff, withWarehouse } from './helpers.ts';

/** Customers shopping one at a time; returns how many carts were left (removed as they appear unless `keep`). */
function cartsLeft(s: GameState, n: number, keep = false) {
    let total = 0;
    for (let i = 0; i < n; i++) {
        s.clockSec = DAY_OPEN_MIN * 60;
        s.objects.find((o) => o.type === 'scaffale')!.stock = SHELF_CAPACITY;
        spawnCustomer(s, ['Pasta']);
        for (let t = 0; t < 2000 && s.customers.length; t++) {
            tick(s);
            if (keep) continue;
            total += s.carts.length;
            s.carts = [];
        }
    }
    return keep ? s.carts.length : total;
}

test('customers sometimes leave a cart, never more than CART_MAX', () => {
    const s = shop();
    noArrivals(s);
    assert.ok(cartsLeft(s, 300) > 0, 'no carts');
    assert.ok(cartsLeft(s, 300, true) <= CART_MAX);
});

test('customers do not walk through a cart', () => {
    const s = shop();
    noArrivals(s);
    s.carts.push({ id: s.nextId++, x: 6, y: 5 });
    assert.equal(walkableFor(s)(6, 5), false);
});

test('the stocker takes carts away, tapped ones first; at night they vanish', () => {
    const s = withWarehouse();
    const a = { id: s.nextId++, x: 7, y: 6 };
    const b = { id: s.nextId++, x: 4, y: 6 };
    s.carts.push(a, b);
    assert.equal(apply(s, { type: 'removeCart', cartId: b.id }).ok, false, 'no stocker yet');
    hireStaff(s, 'magazziniere');
    assert.equal(apply(s, { type: 'removeCart', cartId: b.id }).ok, true);
    assert.equal(apply(s, { type: 'removeCart', cartId: b.id }).ok, false, 'already on its way');
    assert.ok(untilTicks(s, () => !s.carts.includes(b)) > 0, 'tapped cart removed');
    assert.ok(s.carts.includes(a), 'the other waits');
    assert.ok(untilTicks(s, () => !s.carts.length) > 0, 'idle stocker takes the rest');

    s.carts.push({ id: s.nextId++, x: 7, y: 6 });
    nextDay(s);
    assert.deepEqual(s.carts, []);
});

/** shop() on inspection day, just before the inspector arrives. */
function inspectionDay(spills: number) {
    const s = shop();
    noArrivals(s);
    s.day = INSPECTION_DAY;
    s.clockSec = INSPECTION_HOUR * 3600 - 60;
    for (let i = 0; i < spills; i++) addSpill(s, 3 + i, 7);
    return s;
}

test('inspection day: the inspector visits without buying and leaves; dirt is fined', () => {
    const s = inspectionDay(3);
    const money = s.money, stock = s.objects.find((o) => o.type === 'scaffale')!.stock;
    assert.ok(untilTicks(s, () => s.customers.some((c) => c.kind === 'ispettore')) >= 0, 'inspector enters');
    assert.ok(untilTicks(s, () => !s.customers.length) > 0, 'and leaves');
    assert.equal(s.money, money - 3 * INSPECTION_FINE);
    assert.equal(s.objects.find((o) => o.type === 'scaffale')!.stock, stock, 'did not buy');
    assert.equal(s.lostToday, 0, 'not an angry customer');
    assert.deepEqual(s.inspection, { fine: 3 * INSPECTION_FINE, rep: 0 });
});

test('a clean shop passes the inspection with a reputation bonus; only once', () => {
    const s = inspectionDay(0);
    s.reputation = 50;
    untilTicks(s, () => !!s.inspection);
    assert.equal(s.reputation, 50 + INSPECTION_BONUS);
    untilTicks(s, () => !s.customers.length);
    s.clockSec = INSPECTION_HOUR * 3600 - 60;
    untilTicks(s, () => false, 500);
    assert.ok(!s.customers.some((c) => c.kind === 'ispettore'), 'no second visit');
});
