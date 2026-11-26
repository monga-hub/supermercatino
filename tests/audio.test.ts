import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snap, cues } from '../src/audio/cues.ts';
import { addSpill } from '../src/sim/dirt.ts';
import { DAY_OPEN_MIN, DAY_CLOSE_MIN, INSPECTION_DAY } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop } from './helpers.ts';

/** Cues produced by `change` applied to a fresh shop. */
function after(change: (s: GameState) => void, setup: (s: GameState) => void = () => {}) {
    const s = shop();
    setup(s);
    const a = snap(s);
    change(s);
    return cues(a, snap(s));
}

test('nothing happens, nothing plays', () => {
    assert.deepEqual(after(() => {}), { sounds: [], say: null });
});

test('sim events play their sound, once per frame', () => {
    assert.deepEqual(after((s) => (s.servedTotal += 3)).sounds, ['bip']);
    assert.deepEqual(after((s) => { addSpill(s, 3, 3); addSpill(s, 4, 3); }).sounds, ['splat']);
    assert.deepEqual(after((s) => s.carts.push({ id: 99, x: 6, y: 6 })).sounds, ['carrello']);
    assert.deepEqual(after((s) => s.happyBears++).sounds, ['orso']);
    assert.deepEqual(after((s) => s.furbetti.caught++).sounds, ['fischio']);
    assert.deepEqual(after((s) => (s.outcome = { win: true, reason: '' })).sounds, ['vittoria']);
    assert.deepEqual(after((s) => (s.outcome = { win: false, reason: '' })).sounds, ['sconfitta']);
    assert.deepEqual(after((s) => (s.spills = [])).sounds, [], 'cleaning is silent');
});

test('announcements: opening, inspection, closing soon, a new till', () => {
    const say = (change: (s: GameState) => void, setup?: (s: GameState) => void) => after(change, setup).say ?? '';
    assert.match(say((s) => (s.clockSec = DAY_OPEN_MIN * 60), (s) => (s.clockSec = DAY_OPEN_MIN * 60 - 1)), /aperto/);
    assert.match(say((s) => (s.clockSec = DAY_OPEN_MIN * 60), (s) => { s.clockSec = DAY_OPEN_MIN * 60 - 1; s.day = INSPECTION_DAY; }), /ispettore/);
    assert.match(say((s) => (s.clockSec = (DAY_CLOSE_MIN - 30) * 60), (s) => (s.clockSec = (DAY_CLOSE_MIN - 30) * 60 - 1)), /chiude/);
    assert.match(say((s) => (s.inspection = { fine: 50, rep: 0 })), /multa/i);
    assert.match(say((s) => (s.inspection = { fine: 0, rep: 5 })), /superata/i);
    assert.match(say((s) => (s.staff[0].state = 'at_till'), (s) => (s.staff[0].state = 'idle')), /cassa numero 1/);
    assert.match(say((s) => s.furbetti.escaped++), /furbetto/i);
    assert.match(say((s) => (s.scent = 3600)), /sfornato/);
});

test('a comic offer twice a day, different each time', () => {
    const offer = (day: number, h: number) => after((s) => (s.clockSec = h * 3600), (s) => { s.day = day; s.clockSec = h * 3600 - 1; }).say;
    const all = [offer(1, 11), offer(1, 17), offer(2, 11)];
    assert.ok(all.every((x) => x && /offerta|reparto|gentili/i.test(x)), all.join(' | '));
    assert.equal(new Set(all).size, 3);
});
