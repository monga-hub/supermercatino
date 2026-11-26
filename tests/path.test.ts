import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPath } from '../src/sim/path.ts';

// 6x5 open area with a wall at x=2, y=0..3 (gap at y=4)
const walkable = (x: number, y: number) => x >= 0 && y >= 0 && x < 6 && y < 5 && !(x === 2 && y < 4);

test('astar shortest, blocked, unreachable', () => {
    // straight line, no obstacle
    const p1 = findPath(walkable, { x: 3, y: 0 }, { x: 5, y: 0 })!;
    assert.deepEqual(p1, [{ x: 4, y: 0 }, { x: 5, y: 0 }]);

    // around the wall: must go down to y=4 and back up -> 4 down + 2 across + 4 up = 10 steps
    const p2 = findPath(walkable, { x: 1, y: 0 }, { x: 3, y: 0 })!;
    assert.equal(p2.length, 10);
    assert.ok(p2.every((c) => walkable(c.x, c.y)), 'path only on walkable cells');
    assert.deepEqual(p2.at(-1), { x: 3, y: 0 });

    // same cell -> empty path
    assert.deepEqual(findPath(walkable, { x: 0, y: 0 }, { x: 0, y: 0 }), []);

    // goal not walkable / fully enclosed -> null
    assert.equal(findPath(walkable, { x: 0, y: 0 }, { x: 2, y: 1 }), null);
    const closed = (x: number, y: number) => walkable(x, y) && !(x === 2 && y === 4);
    assert.equal(findPath(closed, { x: 0, y: 0 }, { x: 5, y: 0 }), null);
});
