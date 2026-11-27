import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../src/sim/build.ts';
import { closeDay } from '../src/sim/day.ts';
import { checkout, spawnCustomer } from '../src/sim/customers.ts';
import { cash } from '../src/sim/fx.ts';
import { shop } from './helpers.ts';

test('money in and out is announced where it happens, for the floating numbers (playtest 2026-11-27)', () => {
    const s = shop();
    const got: [number, number?, number?][] = [];
    cash.on = (n, x, y) => got.push([n, x, y]);
    try {
        const m0 = s.money;
        assert.equal(apply(s, { type: 'placeObject', object: 'scaffale', x: 6, y: 4, category: 'Frutta' }).ok, true);
        assert.deepEqual(got.pop(), [s.money - m0, 6, 4], 'bought: at the furniture');
        const c = spawnCustomer(s);
        c.basket = ['Pasta'];
        c.goal = { kind: 'till', id: s.objects.find((o) => o.type === 'cassa')!.id };
        const m1 = s.money;
        checkout(s, c, 0);
        assert.deepEqual(got.pop(), [s.money - m1, 4, 9], 'sale: at the till');
        const m2 = s.money;
        closeDay(s);
        assert.deepEqual(got.pop(), [s.money - m2, undefined, undefined], 'wages and rent: no place, by the money counter');
    } finally {
        cash.on = null;
    }
});
