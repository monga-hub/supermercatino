import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply, type Command } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { PRICES, SHELF_CAPACITY } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop, noArrivals, untilTicks, runOut, hireStaff } from './helpers.ts';

const ok = (s: GameState, c: Command) => assert.equal(apply(s, c).ok, true, JSON.stringify(c));
const counter = (s: GameState) => s.objects.find((o) => o.type === 'bancone')!;

/** shop() plus a deli room above the sales floor (x3..8, y0..2) with a counter, optionally staffed. */
function deli({ staffed = true } = {}) {
    const s = shop();
    noArrivals(s);
    ok(s, { type: 'buildRoom', room: 'banco_salumi', x: 3, y: 0, w: 6, h: 3 });
    ok(s, { type: 'placeObject', object: 'bancone', x: 5, y: 1 });
    if (staffed) {
        const b = hireStaff(s, 'banconiere');
        assert.ok(untilTicks(s, () => b.state === 'at_till') >= 0, 'deli man reaches the counter');
    }
    return s;
}

test('the counter goes in the deli only; shelves no longer sell Salumi', () => {
    const s = deli({ staffed: false });
    assert.equal(apply(s, { type: 'placeObject', object: 'bancone', x: 4, y: 5 }).ok, false, 'not in the sales floor');
    assert.equal(apply(s, { type: 'placeObject', object: 'scaffale', x: 4, y: 5, category: 'Salumi' }).ok, false, 'no Salumi shelf');
    assert.equal(counter(s).stock, SHELF_CAPACITY);
});

test('Salumi on the list: queue at the counter, get served, then pay at the till', () => {
    const s = deli();
    const before = s.money;
    const c = spawnCustomer(s, ['Salumi', 'Pasta'])!;
    const seen = runOut(s).get(c.id)!;
    assert.ok(seen.indexOf('queueing') < seen.indexOf('shopping', 1), seen.join());
    assert.equal(seen.filter((x) => x === 'paying').length, 2, 'served at the counter, then at the till: ' + seen.join());
    assert.equal(s.money - before, PRICES.Salumi + PRICES.Pasta);
    assert.equal(counter(s).stock, SHELF_CAPACITY - 1);
});

test('no deli man: no Salumi, the customer is annoyed', () => {
    const s = deli({ staffed: false });
    const before = s.money;
    const c = spawnCustomer(s, ['Salumi', 'Pasta'])!;
    untilTicks(s, () => c.next > 0);
    assert.ok(c.patience < 70, `${c.patience}`);
    runOut(s);
    assert.equal(s.money - before, PRICES.Pasta);
    assert.equal(counter(s).stock, SHELF_CAPACITY);
});

test('the stocker refills the counter too', () => {
    const s = deli();
    ok(s, { type: 'buildRoom', room: 'magazzino', x: 0, y: 3, w: 3, h: 3 });
    ok(s, { type: 'order', category: 'Salumi' });
    hireStaff(s, 'magazziniere');
    counter(s).stock = 4;
    ok(s, { type: 'restock', shelfId: counter(s).id });
    assert.ok(untilTicks(s, () => counter(s).stock === SHELF_CAPACITY) > 0);
});
