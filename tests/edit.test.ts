import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/sim/state.ts';
import { apply, type Command } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop, runOut } from './helpers.ts';

const ok = (s: GameState, c: Command) => assert.equal(apply(s, c).ok, true, JSON.stringify(c));
const no = (s: GameState, c: Command) => assert.equal(apply(s, c).ok, false, JSON.stringify(c));

test('a long press moves an object for free: same shelf, same goods, new cell', () => {
    const s = shop({ cashier: false });
    const shelf = s.objects.find((o) => o.type === 'scaffale')!;
    shelf.stock = 7;
    const money = s.money;
    ok(s, { type: 'move', x: 5, y: 4, toX: 6, toY: 6 });
    assert.deepEqual([shelf.x, shelf.y, shelf.stock, shelf.category], [6, 6, 7, 'Pasta']);
    assert.equal(s.objects.filter((o) => o.type === 'scaffale').length, 1);
    assert.equal(s.money, money);
});

test('moves follow the placing rules', () => {
    const s = shop({ cashier: false });
    no(s, { type: 'move', x: 5, y: 4, toX: 4, toY: 9 }); // shelf into the checkout area
    no(s, { type: 'move', x: 5, y: 4, toX: 4, toY: 9 + 10 }); // off the lot
    no(s, { type: 'move', x: 5, y: 4, toX: 5, toY: 4 }); // nowhere
    ok(s, { type: 'placeObject', object: 'scaffale', x: 6, y: 4, category: 'Frutta' });
    no(s, { type: 'move', x: 5, y: 4, toX: 6, toY: 4 }); // occupied
    no(s, { type: 'move', x: 7, y: 7, toX: 6, toY: 6 }); // nothing there
    const l = createState(1);
    const door = l.objects.find((o) => o.type === 'porta')!;
    no(l, { type: 'move', x: door.x, y: door.y, toX: door.x, toY: door.y - 1 }); // the campaign door stays
});

test('a moved till keeps working: the cashier and the queue follow it', () => {
    const s = shop();
    spawnCustomer(s, ['Pasta']);
    ok(s, { type: 'move', x: 4, y: 9, toX: 3, toY: 9 });
    const money = s.money;
    runOut(s);
    assert.ok(s.money > money, 'the customer paid at the moved till');
    assert.equal(s.staff[0].state, 'at_till');
    assert.deepEqual([s.staff[0].x, s.staff[0].y], [3, 9]);
});
