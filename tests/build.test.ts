import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/sim/state.ts';
import { apply, check } from '../src/sim/build.ts';
import { START_MONEY, ROOMS, OBJECTS, DEMOLISH_REFUND, GRID_W } from '../src/sim/config.ts';

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
