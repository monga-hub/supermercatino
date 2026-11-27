import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/sim/state.ts';
import { apply, doorways, crossing } from '../src/sim/build.ts';
import { findPath } from '../src/sim/path.ts';
import { walls, doorEdge } from '../src/render/walls.ts';
import { shop } from './helpers.ts';

const has = (w: ReturnType<typeof walls>, x: number, y: number, side: string) => w.some((e) => e.x === x && e.y === y && e.side === side);

/** The test shop plus a warehouse behind the sales floor: x3..8 y1..2. */
const withBackRoom = () => {
    const s = shop({ cashier: false }); // sala x3..8 y3..7, casse x3..5 y8..9, door (8,5) on 'fr'
    assert.equal(apply(s, { type: 'buildRoom', room: 'magazzino', x: 3, y: 1, w: 6, h: 2 }).ok, true);
    return s;
};

test('walls: back edges, around the warehouse with a doorway, low walls in front; sales floor and checkout open', () => {
    const s = withBackRoom();
    const w = walls(s);
    const full = (x: number, y: number, side: string) => w.some((e) => e.x === x && e.y === y && e.side === side && !e.low);
    const low = (x: number, y: number, side: string) => w.some((e) => e.x === x && e.y === y && e.side === side && e.low);
    assert.ok(full(3, 1, 'l') && full(3, 1, 'r'), 'back corner');
    assert.ok(full(3, 9, 'l'), 'checkout area has its own back wall');
    assert.ok(!has(w, 4, 4, 'l') && !has(w, 4, 4, 'r'), 'no walls inside a room');
    assert.ok(!has(w, 3, 8, 'r') && !has(w, 5, 8, 'r'), 'no wall between sala and checkout area (playtest)');
    assert.ok(full(3, 3, 'r') && full(8, 3, 'r') && w.find((e) => e.x === 3 && e.y === 3 && e.side === 'r')!.inner, 'inner wall to the warehouse');
    assert.ok(!has(w, 5, 3, 'r') && !has(w, 6, 3, 'r'), 'with a doorway in the middle');
    assert.ok(low(8, 4, 'fr') && low(3, 9, 'fl') && low(6, 7, 'fl'), 'low walls along the front');
    assert.ok(!has(w, 8, 5, 'fr'), 'none where the door is');
});

test('doorways: walkers go in and out of the warehouse only there; furniture keeps off them', () => {
    const s = withBackRoom();
    assert.deepEqual([...doorways(s)].sort(), ['5,2|5,3', '6,2|6,3']);
    const cross = crossing(s);
    assert.ok(cross({ x: 5, y: 2 }, { x: 5, y: 3 }) && !cross({ x: 3, y: 2 }, { x: 3, y: 3 }) && cross({ x: 3, y: 7 }, { x: 3, y: 8 }));
    const p = findPath(Object.assign(() => true, { cross }), { x: 4, y: 2 }, { x: 4, y: 3 })!;
    assert.deepEqual(p, [{ x: 5, y: 2 }, { x: 5, y: 3 }, { x: 4, y: 3 }], 'round through the doorway');
    assert.equal(apply(s, { type: 'placeObject', object: 'scaffale', x: 5, y: 3, category: 'Pasta' }).reason, 'Lascia libero il passaggio');
    const odd = createState(); // shared side of 3 cells: one doorway cell
    apply(odd, { type: 'buildRoom', room: 'sala_vendita', x: 2, y: 2, w: 3, h: 3 });
    apply(odd, { type: 'buildRoom', room: 'magazzino', x: 2, y: 5, w: 3, h: 2 });
    assert.deepEqual([...doorways(odd)], ['3,4|3,5']);
    apply(odd, { type: 'buildRoom', room: 'sala_vendita', x: 5, y: 2, w: 2, h: 3 });
    assert.ok(!walls(odd).some((e) => e.x === 5 && e.side === 'l' && e.y < 5), 'same kind of room side by side: no wall');
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
