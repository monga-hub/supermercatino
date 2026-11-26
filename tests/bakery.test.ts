import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick } from '../src/sim/state.ts';
import { apply, type Command } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { PRICES, UNIT_COST, SHELF_CAPACITY, BAKE_MIN, BAKE_BATCH, DAY_OPEN_MIN } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop, noArrivals, untilTicks, runOut, hireStaff, withWarehouse } from './helpers.ts';

const ok = (s: GameState, c: Command) => assert.equal(apply(s, c).ok, true, JSON.stringify(c));
const oven = (s: GameState) => s.objects.find((o) => o.type === 'forno')!;
const ticksPerMin = 60 / 18; // 3 game min per real second, 10 ticks per second → 18 game s per tick

/** shop() plus a bakery above the sales floor (x3..8, y0..2) with an oven, optionally staffed. */
function bakery({ staffed = true } = {}) {
    const s = shop();
    noArrivals(s);
    ok(s, { type: 'buildRoom', room: 'panetteria', x: 3, y: 0, w: 6, h: 3 });
    ok(s, { type: 'placeObject', object: 'forno', x: 5, y: 1 });
    if (staffed) {
        const b = hireStaff(s, 'banconiere');
        assert.ok(untilTicks(s, () => b.state === 'at_till') >= 0, 'baker reaches the oven');
    }
    return s;
}

test('the oven goes in the bakery, the fridge in the sales floor; shelves no longer take Pane or Latticini', () => {
    const s = bakery({ staffed: false });
    assert.equal(apply(s, { type: 'placeObject', object: 'forno', x: 4, y: 5 }).ok, false, 'oven not in the sales floor');
    assert.equal(apply(s, { type: 'placeObject', object: 'frigo', x: 4, y: 1 }).ok, false, 'fridge not in the bakery');
    for (const category of ['Pane', 'Latticini'])
        assert.equal(apply(s, { type: 'placeObject', object: 'scaffale', x: 4, y: 5, category }).ok, false, category);
    ok(s, { type: 'placeObject', object: 'frigo', x: 4, y: 5 });
    const fridge = s.objects.find((o) => o.type === 'frigo')!;
    assert.deepEqual([fridge.category, fridge.stock], ['Latticini', SHELF_CAPACITY]);
    assert.deepEqual([oven(s).category, oven(s).stock], ['Pane', 0], 'the oven starts cold');
});

test('a staffed oven bakes a batch every BAKE_MIN, paying for the flour, up to capacity', () => {
    const s = bakery();
    const money = s.money;
    untilTicks(s, () => false, Math.ceil(BAKE_MIN * ticksPerMin) + 1);
    assert.equal(oven(s).stock, BAKE_BATCH);
    assert.equal(money - s.money, BAKE_BATCH * UNIT_COST.Pane);
    untilTicks(s, () => false, Math.ceil(BAKE_MIN * ticksPerMin * 3));
    assert.equal(oven(s).stock, SHELF_CAPACITY);

    const cold = bakery({ staffed: false });
    untilTicks(cold, () => false, Math.ceil(BAKE_MIN * ticksPerMin) + 1);
    assert.equal(oven(cold).stock, 0, 'nobody baking');
});

test('Pane on the list: queue at the oven, get the bread, then pay at the till', () => {
    const s = bakery();
    oven(s).stock = 3;
    oven(s).bake = -1e9; // no batch meanwhile
    const before = s.money;
    const c = spawnCustomer(s, ['Pane', 'Pasta'])!;
    const seen = runOut(s).get(c.id)!;
    assert.equal(seen.filter((x) => x === 'paying').length, 2, 'served at the oven, then at the till: ' + seen.join());
    assert.equal(s.money - before, PRICES.Pane + PRICES.Pasta);
    assert.equal(oven(s).stock, 2);
});

test('fresh bread smells: more customers come in for a while after a batch', () => {
    const arrivals = (staffed: boolean) => {
        const s = bakery({ staffed });
        s.clockSec = DAY_OPEN_MIN * 60;
        s.spawnAcc = 0;
        s.customers = [];
        s.reputation = 50;
        s.paused = false;
        const seen = new Set<number>();
        for (let i = 0; i < 3 * 60 * ticksPerMin; i++) {
            tick(s);
            s.customers.forEach((c) => seen.add(c.id));
            if (i === 0) seen.clear();
        }
        return seen.size;
    };
    const smell = arrivals(true), none = arrivals(false);
    assert.ok(smell > none, `${smell} with fresh bread vs ${none}`);
});

test('the stocker fills the fridge; nobody orders or restocks bread, the oven makes it', () => {
    const s = withWarehouse();
    ok(s, { type: 'placeObject', object: 'frigo', x: 4, y: 5 });
    ok(s, { type: 'order', category: 'Latticini' });
    hireStaff(s, 'magazziniere');
    const fridge = s.objects.find((o) => o.type === 'frigo')!;
    fridge.stock = 4;
    ok(s, { type: 'restock', shelfId: fridge.id });
    assert.ok(untilTicks(s, () => fridge.stock === SHELF_CAPACITY) > 0, 'fridge refilled');

    assert.equal(apply(s, { type: 'order', category: 'Pane' }).ok, false, 'bread is baked, not ordered');
    ok(s, { type: 'buildRoom', room: 'panetteria', x: 3, y: 0, w: 6, h: 3 });
    ok(s, { type: 'placeObject', object: 'forno', x: 5, y: 1 });
    assert.equal(apply(s, { type: 'restock', shelfId: oven(s).id }).ok, false, 'the stocker does not fill the oven');
});
