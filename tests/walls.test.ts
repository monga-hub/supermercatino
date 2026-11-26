import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/sim/state.ts';
import { apply } from '../src/sim/build.ts';
import { walls, doorEdge } from '../src/render/walls.ts';
import { shop } from './helpers.ts';

const has = (w: ReturnType<typeof walls>, x: number, y: number, side: string) => w.some((e) => e.x === x && e.y === y && e.side === side);

test('walls run along the back edges of the building only', () => {
    const s = shop({ cashier: false }); // sala x3..8 y3..7, casse x3..5 y8..9
    const w = walls(s);
    assert.ok(has(w, 3, 3, 'l') && has(w, 3, 3, 'r'), 'back corner');
    assert.ok(has(w, 8, 3, 'r') && !has(w, 8, 3, 'l'), 'back-right edge');
    assert.ok(has(w, 3, 9, 'l'), 'checkout area has its own back wall');
    assert.ok(!has(w, 4, 4, 'l') && !has(w, 4, 4, 'r'), 'no walls inside');
    assert.ok(!has(w, 3, 8, 'r'), 'no wall between sala and checkout area');
    assert.ok(w.every((e) => e.side === 'l' || e.side === 'r'), 'no front walls');
});

test('the door sits on the outer edge of its cell, in the wall when that edge is at the back', () => {
    const s = shop({ cashier: false });
    assert.equal(doorEdge(s, s.objects.find((o) => o.type === 'porta')!), 'fr'); // (8,5): outside is +x
    const t = createState();
    apply(t, { type: 'buildRoom', room: 'sala_vendita', x: 3, y: 3, w: 4, h: 4 });
    assert.equal(apply(t, { type: 'placeObject', object: 'porta', x: 3, y: 5 }).ok, true);
    assert.equal(doorEdge(t, t.objects[0]), 'l');
    assert.ok(!has(walls(t), 3, 5, 'l'), 'the door replaces that wall');
});
