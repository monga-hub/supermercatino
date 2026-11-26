import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { tick } from '../src/sim/state.ts';
import { SHELF_CAPACITY, PRICES, TIP, AUTO_COLLECT_SEC, STEP_MS, AUTO_RESTOCK_BELOW } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { hireStaff, untilTicks, withWarehouse } from './helpers.ts';

const shelf = (s: GameState, cat: string) => s.objects.find((o) => o.type === 'scaffale' && o.category === cat)!;
const till = (s: GameState) => s.objects.find((o) => o.type === 'cassa')!;

/** Warehouse shop with a second shelf (Frutta), goods for both, and a stocker. */
function stocked() {
    const s = withWarehouse();
    for (const c of [
        { type: 'placeObject', object: 'scaffale', x: 6, y: 4, category: 'Frutta' },
        { type: 'order', category: 'Pasta' },
        { type: 'order', category: 'Frutta' },
    ] as const) assert.equal(apply(s, c).ok, true, JSON.stringify(c));
    hireStaff(s, 'magazziniere');
    return s;
}

test('tap queues shelf first', () => {
    const s = stocked();
    shelf(s, 'Pasta').stock = AUTO_RESTOCK_BELOW; // not low enough for the automatic round
    shelf(s, 'Frutta').stock = AUTO_RESTOCK_BELOW;
    assert.equal(apply(s, { type: 'restock', shelfId: shelf(s, 'Frutta').id }).ok, true);
    assert.ok(untilTicks(s, () => shelf(s, 'Frutta').stock === SHELF_CAPACITY) > 0, 'tapped shelf refilled');
    untilTicks(s, () => false, 2000);
    assert.equal(shelf(s, 'Pasta').stock, AUTO_RESTOCK_BELOW, 'untapped shelf left alone');
    assert.deepEqual(s.restockQueue, []);
});

test('auto restock only when almost empty', () => {
    const s = stocked();
    shelf(s, 'Pasta').stock = AUTO_RESTOCK_BELOW - 1;
    assert.ok(untilTicks(s, () => shelf(s, 'Pasta').stock === SHELF_CAPACITY) > 0, 'almost empty shelf refilled');
});

test('restock validation', () => {
    const s = stocked();
    const pasta = shelf(s, 'Pasta');
    const r = (shelfId: number) => apply(s, { type: 'restock', shelfId });
    assert.equal(r(pasta.id).ok, false, 'full shelf');
    assert.equal(r(till(s).id).ok, false, 'not a shelf');
    pasta.stock = 5;
    assert.equal(r(pasta.id).ok, true);
    assert.equal(r(pasta.id).ok, false, 'already queued');
    s.warehouse.Frutta = 0;
    shelf(s, 'Frutta').stock = 5;
    assert.equal(r(shelf(s, 'Frutta').id).ok, false, 'no goods in the warehouse');

    const noStocker = withWarehouse();
    apply(noStocker, { type: 'order', category: 'Pasta' });
    shelf(noStocker, 'Pasta').stock = 5;
    assert.equal(apply(noStocker, { type: 'restock', shelfId: shelf(noStocker, 'Pasta').id }).ok, false, 'no stocker');
});

/** One Pasta customer brought to the till until the bill is ready. */
function readyCustomer() {
    const s = withWarehouse();
    const c = spawnCustomer(s, ['Pasta'])!;
    assert.ok(untilTicks(s, () => c.state === 'ready') > 0, 'customer gets to ready');
    return { s, c };
}

test('collect with tip', () => {
    const { s, c } = readyCustomer();
    const m0 = s.money;
    assert.equal(apply(s, { type: 'collect', tillId: till(s).id }).ok, true);
    assert.equal(s.money, m0 + PRICES.Pasta + TIP);
    assert.equal(c.state, 'leaving');
    assert.equal(s.servedToday, 1);
    assert.equal(apply(s, { type: 'collect', tillId: till(s).id }).ok, false, 'nobody ready');
});

test('auto collect without tip', () => {
    const { s, c } = readyCustomer();
    const m0 = s.money;
    let ticks = 0;
    while (c.state === 'ready' && ticks < 10_000) {
        tick(s);
        ticks++;
    }
    assert.equal(c.state, 'leaving');
    assert.equal(s.money, m0 + PRICES.Pasta);
    assert.ok(ticks >= (AUTO_COLLECT_SEC * 1000) / STEP_MS, `waited ${ticks} ticks`);
});
