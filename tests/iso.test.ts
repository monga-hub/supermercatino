import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gridToIso, isoToGrid, cellAt } from '../src/render/iso.ts';

test('grid-iso roundtrip', () => {
    for (let x = 0; x < 30; x++) {
        for (let y = 0; y < 30; y++) {
            const p = gridToIso(x, y);
            assert.deepEqual(isoToGrid(p.x, p.y), { x, y });
            // a point inside the tile (just below its top vertex) picks that cell
            assert.deepEqual(cellAt(p.x, p.y + 2), { x, y });
        }
    }
});
