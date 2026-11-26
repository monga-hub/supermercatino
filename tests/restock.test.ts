import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply, roomAt } from '../src/sim/build.ts';
import { ORDER_UNITS, UNIT_COST, SHELF_CAPACITY } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop, hireStaff, noArrivals, untilTicks } from './helpers.ts';

/** Shop from helpers plus a warehouse left of the sales floor (x0..2, y3..5). */
function withWarehouse() {
    const s = shop();
    noArrivals(s);
    assert.equal(apply(s, { type: 'buildRoom', room: 'magazzino', x: 0, y: 3, w: 3, h: 3 }).ok, true);
    return s;
}
const pasta = (s: GameState) => s.objects.find((o) => o.type === 'scaffale' && o.category === 'Pasta')!;

test('order goes to warehouse', () => {
    const s = shop();
    const before = structuredClone(s);
    assert.equal(apply(s, { type: 'order', category: 'Pasta' }).ok, false, 'no warehouse');
    assert.deepEqual(s, before);

    const w = withWarehouse();
    const m0 = w.money;
    assert.equal(apply(w, { type: 'order', category: 'Pasta' }).ok, true);
    assert.equal(w.warehouse.Pasta, ORDER_UNITS);
    assert.equal(w.money, m0 - ORDER_UNITS * UNIT_COST.Pasta);
    assert.equal(apply(w, { type: 'order', category: 'Caviale' }).ok, false, 'unknown category');
    w.money = 1;
    assert.equal(apply(w, { type: 'order', category: 'Pasta' }).ok, false, 'no money');
    assert.equal(w.warehouse.Pasta, ORDER_UNITS);
});

test('stocker refills low shelf', () => {
    const s = withWarehouse();
    apply(s, { type: 'order', category: 'Pasta' });
    const st = hireStaff(s, 'magazziniere');
    pasta(s).stock = 2;
    let visitedWarehouse = false, carried = false;
    const t = untilTicks(s, () => {
        if (roomAt(s, Math.round(st.x), Math.round(st.y))?.type === 'magazzino') visitedWarehouse = true;
        if (st.job?.units) carried = true;
        return pasta(s).stock === SHELF_CAPACITY;
    });
    assert.ok(t > 0, 'shelf refilled');
    assert.ok(visitedWarehouse, 'went to the warehouse');
    assert.ok(carried, 'carried the goods');
    assert.equal(s.warehouse.Pasta, ORDER_UNITS - (SHELF_CAPACITY - 2));
    untilTicks(s, () => !st.job);
    assert.equal(st.job, null, 'trip finished');
});

test('no stock or no stocker no refill', () => {
    const noStock = withWarehouse();
    hireStaff(noStock, 'magazziniere');
    pasta(noStock).stock = 2;
    untilTicks(noStock, () => false, 2000);
    assert.equal(pasta(noStock).stock, 2);
    assert.equal(noStock.staff.at(-1)!.job, null, 'stocker does not leave');

    const noStocker = withWarehouse();
    apply(noStocker, { type: 'order', category: 'Pasta' });
    pasta(noStocker).stock = 2;
    untilTicks(noStocker, () => false, 2000);
    assert.equal(pasta(noStocker).stock, 2);
    assert.equal(noStocker.warehouse.Pasta, ORDER_UNITS);
});
