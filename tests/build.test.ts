import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/sim/state.ts';
import { apply, check, objectAt } from '../src/sim/build.ts';
import { walkableFor } from '../src/sim/customers.ts';
import { START_MONEY, ROOMS, OBJECTS, DEMOLISH_REFUND, GRID_W } from '../src/sim/config.ts';
import { shop } from './helpers.ts';

const sala = (x = 0, y = 0, w = 4, h = 4) => ({ type: 'buildRoom', room: 'sala_vendita', x, y, w, h }) as const;
const casse = (x = 5, y = 0, w = 2, h = 2) => ({ type: 'buildRoom', room: 'area_casse', x, y, w, h }) as const;
const place = (object: 'porta' | 'scaffale' | 'cassa', x: number, y: number, category?: string) =>
    ({ type: 'placeObject', object, x, y, category }) as const;

test('buildRoom validates and charges', () => {
    const s = createState();
    assert.equal(s.money, START_MONEY);
    assert.equal(apply(s, sala()).ok, true);
    assert.equal(s.money, START_MONEY - 16 * ROOMS.sala_vendita.costPerCell);
    assert.equal(s.rooms.length, 1);

    const before = structuredClone(s);
    assert.equal(apply(s, sala(2, 2)).ok, false, 'overlap');
    assert.equal(apply(s, sala(GRID_W - 2, 0)).ok, false, 'outside lot');
    assert.deepEqual(s, before, 'failed commands do not change state');

    assert.equal(apply(s, casse()).ok, true);
    assert.equal(apply(s, sala(4, 3, 1, 1)).ok, true, 'single cell extension');
});

test('objects only in the right room', () => {
    const s = createState();
    apply(s, sala());
    apply(s, casse());
    assert.equal(apply(s, place('scaffale', 1, 1, 'Pasta')).ok, true);
    assert.equal(apply(s, place('scaffale', 2, 1, 'Pasta')).ok, true);
    assert.equal(apply(s, place('cassa', 2, 2)).ok, false, 'cassa in sala vendita');
    assert.equal(apply(s, place('scaffale', 5, 0, 'Pasta')).ok, false, 'scaffale in area casse');
    assert.equal(apply(s, place('scaffale', 2, 2, 'Caviale')).ok, false, 'unknown category');
    assert.equal(apply(s, place('scaffale', 2, 2)).ok, false, 'missing category');
    assert.equal(apply(s, place('scaffale', 1, 1, 'Pane')).ok, false, 'cell occupied');
    assert.equal(apply(s, place('scaffale', 15, 15, 'Pane')).ok, false, 'no room there');
    assert.equal(apply(s, place('cassa', 5, 0)).ok, true);
    assert.equal(s.objects.length, 3);
    assert.equal(s.objects[0].category, 'Pasta');
});

test('door on sales-floor edge', () => {
    const s = createState();
    apply(s, sala());
    assert.equal(apply(s, place('porta', 1, 1)).ok, false, 'interior cell');
    assert.equal(apply(s, place('porta', 0, 2)).ok, true, 'edge cell');
    apply(s, sala(4, 1, 1, 1)); // extension: (3,1) is now inside the sales floor
    assert.equal(apply(s, place('porta', 3, 1)).ok, false, 'inside the extended floor');
    assert.equal(apply(s, place('porta', 4, 1)).ok, true, 'edge of the extension');
});

test('no money no build', () => {
    const s = createState();
    apply(s, sala());
    s.money = 10;
    const before = structuredClone(s);
    assert.equal(apply(s, casse()).ok, false);
    assert.equal(apply(s, place('scaffale', 1, 1, 'Pasta')).ok, false);
    assert.deepEqual(s, before);
});

test('demolish refunds', () => {
    const s = createState();
    apply(s, sala());
    apply(s, place('scaffale', 1, 1, 'Pasta'));
    const m0 = s.money;
    assert.equal(apply(s, { type: 'demolish', x: 0, y: 0 }).ok, false, 'room not empty');
    assert.equal(apply(s, { type: 'demolish', x: 1, y: 1 }).ok, true);
    assert.equal(s.objects.length, 0);
    assert.equal(s.money, m0 + Math.floor(OBJECTS.scaffale.cost * DEMOLISH_REFUND));
    const m1 = s.money;
    assert.equal(apply(s, { type: 'demolish', x: 0, y: 0 }).ok, true);
    assert.equal(s.rooms.length, 0);
    assert.equal(s.money, m1 + Math.floor(16 * ROOMS.sala_vendita.costPerCell * DEMOLISH_REFUND));
    assert.equal(apply(s, { type: 'demolish', x: 0, y: 0 }).ok, false, 'nothing there');
});

test('check does not mutate', () => {
    const s = createState();
    const before = structuredClone(s);
    assert.equal(check(s, sala()).ok, true);
    assert.deepEqual(s, before);
});

test('rotate turns a shelf or a till between its two orientations, for free', () => {
    const s = shop({ cashier: false });
    const shelf = s.objects.find((o) => o.type === 'scaffale')!;
    const money = s.money;
    assert.equal(apply(s, { type: 'rotate', x: shelf.x, y: shelf.y }).ok, true);
    assert.equal(shelf.rot, 1);
    assert.equal(apply(s, { type: 'rotate', x: shelf.x, y: shelf.y }).ok, true);
    assert.equal(shelf.rot, 0);
    const till = s.objects.find((o) => o.type === 'cassa')!;
    assert.equal(apply(s, { type: 'rotate', x: till.x, y: till.y }).ok, true);
    assert.equal(till.rot, 1);
    assert.equal(s.money, money);
});

test('rotate needs a shelf or a till', () => {
    const s = shop({ cashier: false });
    const door = s.objects.find((o) => o.type === 'porta')!;
    assert.deepEqual(check(s, { type: 'rotate', x: door.x, y: door.y }), { ok: false, reason: 'La porta si gira da sola' });
    assert.deepEqual(check(s, { type: 'rotate', x: 0, y: 0 }), { ok: false, reason: 'Niente da ruotare' });
});

test('a till takes one cell (playtest 2026-11-27: two did not work)', () => {
    const s = shop({ cashier: false }); // checkout area x3..5 y8..9, till at (4,9)
    const till = s.objects.find((o) => o.type === 'cassa')!;
    assert.equal(objectAt(s, 4, 9), till);
    assert.equal(objectAt(s, 4, 8), undefined, 'nothing up the lane');
    assert.equal(walkableFor(s)(4, 8), true, 'the cell up the lane stays free');
    assert.equal(check(s, place('cassa', 4, 8)).ok, true, 'another till fits right up the lane');
    assert.equal(apply(s, { type: 'rotate', x: 4, y: 9 }).ok, true);
    assert.equal(objectAt(s, 3, 9), undefined, 'turned, still one cell');
});
