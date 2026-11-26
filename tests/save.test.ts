import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance } from '../src/sim/state.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { saveGame, loadGame } from '../src/sim/save.ts';
import { shop } from './helpers.ts';

test('save and load gives the same state, and the game goes on identically', () => {
    const s = shop();
    spawnCustomer(s, ['Pasta']);
    advance(s, 7_000); // mid-walk, mid-day
    const copy = loadGame(saveGame(s))!;
    assert.deepEqual(copy, s);
    advance(s, 60_000);
    advance(copy, 60_000);
    assert.deepEqual(copy, s);
});

test('a corrupt or outdated save is ignored', () => {
    const s = shop();
    const { rooms, ...noRooms } = s;
    for (const bad of [null, '', '{', '"hi"', JSON.stringify({ v: 999, s }), JSON.stringify({ v: 1, s: noRooms }), JSON.stringify(rooms)])
        assert.equal(loadGame(bad), null, String(bad).slice(0, 40));
});
