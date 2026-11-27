import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, tick } from '../src/sim/state.ts';
import { apply, type Command } from '../src/sim/build.ts';
import { addSpill } from '../src/sim/dirt.ts';
import { loadProgress } from '../src/sim/levels.ts';
import { GUIDE, guideStep, newsDue, markSeen } from '../src/sim/tutorial.ts';
import type { GameState } from '../src/sim/state.ts';
import { untilTicks } from './helpers.ts';

const ok = (s: GameState, c: Command) => assert.equal(apply(s, c).ok, true, JSON.stringify(c));
const free = (s: GameState, type: string) => {
    const r = s.rooms.find((x) => x.type === type)!;
    for (let y = r.y + 1; y < r.y + r.h; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (!s.objects.some((o) => o.x === x && o.y === y)) return { x, y };
    throw new Error('room full');
};
const hire = (s: GameState, role: string) => ok(s, { type: 'hire', candidateId: s.candidates.find((c) => c.role === role)!.id });

test('the level 1 guide ticks its steps by itself, in order', () => {
    const s = createState(1);
    assert.equal(guideStep(s), 0);
    hire(s, 'cassiere'); // out of order: the first step is still the first
    assert.equal(guideStep(s), 0);
    ok(s, { type: 'placeObject', object: 'scaffale', ...free(s, 'sala_vendita'), category: 'Pasta' });
    assert.equal(guideStep(s), 1);
    ok(s, { type: 'placeObject', object: 'scaffale', ...free(s, 'sala_vendita'), category: 'Pasta' });
    assert.equal(guideStep(s), 1, 'a second shelf of the same goods');
    ok(s, { type: 'placeObject', object: 'scaffale', ...free(s, 'sala_vendita'), category: 'Frutta' });
    assert.equal(guideStep(s), 2);
    ok(s, { type: 'placeObject', object: 'cassa', ...free(s, 'area_casse') });
    assert.equal(guideStep(s), 4, 'the cashier was already hired');
    hire(s, 'magazziniere');
    assert.equal(guideStep(s), 5);
    s.paused = false;
    tick(s);
    assert.equal(guideStep(s), 6);
    const till = s.objects.find((o) => o.type === 'cassa')!;
    assert.ok(untilTicks(s, () => apply(s, { type: 'collect', tillId: till.id }).ok, 20_000) >= 0, 'a bill to collect');
    assert.equal(guideStep(s), 7);
    const shelf = s.objects.find((o) => o.type === 'scaffale')!;
    shelf.stock = 3;
    ok(s, { type: 'restock', shelfId: shelf.id });
    assert.equal(guideStep(s), -1, 'guide finished');
    assert.equal(GUIDE.length, 8);
});

test('no guide outside level 1', () => {
    assert.equal(guideStep(createState()), -1);
    assert.equal(guideStep(createState(2)), -1);
});

test('each "Novità" shows once, also after a reload', () => {
    const s = createState(3);
    let p = loadProgress(null);
    assert.equal(newsDue(s, p.seen), null, 'nothing new in an empty shop');
    const r = s.rooms.find((x) => x.type === 'sala_vendita')!;
    addSpill(s, r.x + 1, r.y + 1);
    const n = newsDue(s, p.seen)!;
    assert.equal(n.key, 'spill');
    assert.ok(n.text.length > 10);
    p = markSeen(p, n.key);
    assert.equal(newsDue(s, p.seen), null);
    p = loadProgress(JSON.stringify(p));
    assert.equal(newsDue(s, p.seen), null, 'remembered');
    assert.deepEqual(markSeen(p, 'spill'), p, 'marking twice changes nothing');
});
