import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/sim/state.ts';
import { apply, doorways, crossing } from '../src/sim/build.ts';
import { findPath } from '../src/sim/path.ts';
import { walls, doorEdge } from '../src/render/walls.ts';
import { shop } from './helpers.ts';

const has = (w: ReturnType<typeof walls>, x: number, y: number, side: string) => w.some((e) => e.x === x && e.y === y && e.side === side);

test('walls: back edges, between kinds of room with a doorway, low walls in front', () => {
    const s = shop({ cashier: false }); // sala x3..8 y3..7, casse x3..5 y8..9, door (8,5) on 'fr'
    const w = walls(s);
    const full = (x: number, y: number, side: string) => w.some((e) => e.x === x && e.y === y && e.side === side && !e.low);
    const low = (x: number, y: number, side: string) => w.some((e) => e.x === x && e.y === y && e.side === side && e.low);
    assert.ok(full(3, 3, 'l') && full(3, 3, 'r'), 'back corner');
    assert.ok(full(8, 3, 'r') && !has(w, 8, 3, 'l'), 'back-right edge');
    assert.ok(full(3, 9, 'l'), 'checkout area has its own back wall');
    assert.ok(!has(w, 4, 4, 'l') && !has(w, 4, 4, 'r'), 'no walls inside a room');
    assert.ok(full(3, 8, 'r') && full(5, 8, 'r'), 'wall between sala and checkout area');
    assert.ok(!has(w, 4, 8, 'r'), 'with a doorway in the middle');
    assert.ok(low(8, 3, 'fr') && low(3, 9, 'fl') && low(6, 7, 'fl'), 'low walls along the front');
    assert.ok(!has(w, 8, 5, 'fr'), 'none where the door is');
});

test('doorways: walkers cross between kinds of room only there; furniture keeps off them', () => {
    const s = shop({ cashier: false });
    assert.deepEqual([...doorways(s)], ['4,7|4,8']);
    const cross = crossing(s);
    assert.ok(cross({ x: 4, y: 7 }, { x: 4, y: 8 }) && !cross({ x: 3, y: 7 }, { x: 3, y: 8 }) && cross({ x: 3, y: 7 }, { x: 4, y: 7 }));
    const p = findPath(Object.assign(() => true, { cross }), { x: 3, y: 7 }, { x: 3, y: 8 })!;
    assert.deepEqual(p, [{ x: 4, y: 7 }, { x: 4, y: 8 }, { x: 3, y: 8 }], 'round through the doorway');
    assert.equal(apply(s, { type: 'placeObject', object: 'scaffale', x: 4, y: 7, category: 'Pasta' }).reason, 'Lascia libero il passaggio');
    const even = createState(); // shared side of 4 cells: two doorway cells in the middle
    apply(even, { type: 'buildRoom', room: 'sala_vendita', x: 2, y: 2, w: 4, h: 3 });
    apply(even, { type: 'buildRoom', room: 'magazzino', x: 2, y: 5, w: 4, h: 2 });
    assert.deepEqual([...doorways(even)].sort(), ['3,4|3,5', '4,4|4,5']);
    apply(even, { type: 'buildRoom', room: 'sala_vendita', x: 6, y: 2, w: 2, h: 3 });
    assert.ok(!walls(even).some((e) => e.x === 6 && e.side === 'l' && e.y < 5), 'same kind of room side by side: no wall');
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
