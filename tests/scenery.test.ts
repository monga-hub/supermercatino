import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createState } from '../src/sim/state.ts';
import { apply, roomAt, objectAt } from '../src/sim/build.ts';
import { LEVELS } from '../src/sim/levels.ts';
import { doorEdge } from '../src/render/walls.ts';
import { terrain, props, decor, MARGIN, CARS } from '../src/render/scenery.ts';

const kit = JSON.parse(readFileSync(new URL('../public/assets/kit.json', import.meta.url), 'utf8'));

test('every level has the street on the door side: sidewalk, then the road', () => {
    for (const [i, l] of LEVELS.entries()) {
        const s = createState(i + 1);
        const door = s.objects.find((o) => o.type === 'porta')!;
        assert.equal(doorEdge(s, door), 'fr', `${l.name}: door faces the street (+x)`);
        assert.equal(terrain(s, s.grid.w, door.y), 'sidewalk', l.name);
        assert.equal(terrain(s, s.grid.w + 1, door.y), 'road', l.name);
    }
});

test('around the lot there is only ground: no empty cell within the margin', () => {
    const s = createState(1);
    for (let x = -MARGIN; x < s.grid.w + MARGIN; x++)
        for (let y = -MARGIN; y < s.grid.h + MARGIN; y++) {
            const inLot = x >= 0 && y >= 0 && x < s.grid.w && y < s.grid.h;
            assert.equal(terrain(s, x, y) === null, inLot, `${x},${y}`);
        }
});

test('street props stay off the lot and off the road; every frame exists', () => {
    for (const lv of [0, 1, 2, 3]) {
        const s = createState(lv);
        const ps = props(s);
        assert.ok(ps.length > 10);
        for (const p of ps) {
            assert.ok(kit.frames[p.frame], p.frame);
            assert.notEqual(terrain(s, p.x, p.y), null, `${p.frame} on the lot`);
            assert.notEqual(terrain(s, p.x, p.y), 'road', `${p.frame} on the road`);
        }
    }
    for (const c of CARS) assert.ok(kit.frames[c], c);
});

test('decorations sit in rooms, never on furniture or the door, and move aside for new furniture', () => {
    for (const [i] of LEVELS.entries()) {
        const s = createState(i + 1);
        const ds = decor(s);
        assert.ok(ds.length >= 3, 'some decorations');
        for (const d of ds) {
            assert.ok(kit.frames[d.frame], d.frame);
            assert.ok(roomAt(s, d.x, d.y), `${d.frame} outside`);
            assert.ok(!objectAt(s, d.x, d.y), `${d.frame} on an object`);
        }
        assert.equal(new Set(ds.map((d) => `${d.x},${d.y}`)).size, ds.length, 'one per cell');
        const d = ds.find((x) => roomAt(s, x.x, x.y)?.type === 'sala_vendita')!;
        assert.equal(apply(s, { type: 'placeObject', object: 'scaffale', x: d.x, y: d.y, category: 'Pasta' }).ok, true, 'decor does not block');
        assert.ok(!decor(s).some((x) => x.x === d.x && x.y === d.y));
    }
});
