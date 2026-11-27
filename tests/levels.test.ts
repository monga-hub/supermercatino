import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, tick } from '../src/sim/state.ts';
import { apply, roomAt, type Command } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { maybeSpill } from '../src/sim/dirt.ts';
import { closeDay } from '../src/sim/day.ts';
import { loadGame } from '../src/sim/save.ts';
import { LEVELS, FEATURES, goalsOf, sellable, loadProgress, winLevel, levelOpen, freeOpen } from '../src/sim/levels.ts';
import { OBJECTS, ROLES, CUSTOMER_TYPES, INSPECTION_DAY, INSPECTION_HOUR, LEVEL } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { untilTicks } from './helpers.ts';

const ok = (s: GameState, c: Command) => assert.equal(apply(s, c).ok, true, JSON.stringify(c));
const no = (s: GameState, c: Command) => assert.equal(apply(s, c).ok, false, JSON.stringify(c));
const cellOf = (s: GameState, type: string) => {
    const r = s.rooms.find((x) => x.type === type)!;
    for (let y = r.y + 1; y < r.y + r.h; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (!s.objects.some((o) => o.x === x && o.y === y)) return { x, y };
    throw new Error('room full');
};

/** Level 1 with two shelves, a till and a cashier, clock running. */
function level1() {
    const s = createState(1);
    const a = cellOf(s, 'sala_vendita');
    ok(s, { type: 'placeObject', object: 'scaffale', ...a, category: 'Pasta' });
    ok(s, { type: 'placeObject', object: 'scaffale', ...cellOf(s, 'sala_vendita'), category: 'Frutta' });
    ok(s, { type: 'placeObject', object: 'cassa', ...cellOf(s, 'area_casse') });
    ok(s, { type: 'hire', candidateId: s.candidates.find((c) => c.role === 'cassiere')!.id });
    s.paused = false;
    return s;
}

test('every level map is valid: rooms on the lot, no overlaps, door on the sales floor edge, a room for each object', () => {
    for (const [i, l] of LEVELS.entries()) {
        const s = createState(i + 1);
        assert.equal(s.rooms.length, l.rooms.length, l.name);
        for (const r of s.rooms) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= s.grid.w && r.y + r.h <= s.grid.h, `${l.name} ${r.type}`);
        const door = s.objects.find((o) => o.type === 'porta')!;
        assert.equal(roomAt(s, door.x, door.y)?.type, 'sala_vendita', l.name);
        for (const o of l.objects) assert.ok(s.rooms.some((r) => r.type === OBJECTS[o].room), `${l.name}: ${o} needs ${OBJECTS[o].room}`);
        for (const role of l.roles) assert.ok(role in ROLES);
        for (const k of l.customers) assert.ok(k in CUSTOMER_TYPES);
    }
});

test('every mechanic is unlocked by exactly one level and stays unlocked; the last level has everything (milestone 22)', () => {
    const all = {
        objects: Object.keys(OBJECTS).filter((o) => o !== 'porta'), // the door comes with the map
        roles: Object.keys(ROLES),
        customers: Object.keys(CUSTOMER_TYPES).filter((k) => k !== 'ispettore'), // comes with the inspection
        features: [...FEATURES],
    };
    for (const [kind, keys] of Object.entries(all) as [keyof typeof all, string[]][])
        for (const key of keys) {
            const has = LEVELS.map((l) => (l[kind] as string[]).includes(key));
            const first = has.indexOf(true);
            assert.ok(first >= 0, `${kind} ${key}: no level unlocks it`);
            assert.ok(has.slice(first).every(Boolean), `${kind} ${key}: locked again after level ${first + 1}`);
        }
    assert.equal(LEVELS.length, 7);
    for (const l of LEVELS) assert.ok(!(l.customers as string[]).includes('ispettore'), `${l.name}: the inspector comes only with the inspection`);
    for (const l of LEVELS) for (const r of l.rooms) if (r.type === 'area_casse') assert.ok(r.h >= 2 || r.w >= 2, `${l.name}: a till is two cells long`);
});

test('a level starts with its map: rooms and the door are fixed, the player places and removes furniture', () => {
    const s = createState(1);
    assert.equal(s.level, 1);
    assert.equal(s.money, LEVELS[0].money);
    no(s, { type: 'buildRoom', room: 'sala_vendita', x: 0, y: 0, w: 1, h: 1 });
    const r = s.rooms.find((x) => x.type === 'magazzino')!;
    no(s, { type: 'demolish', x: r.x, y: r.y });
    const door = s.objects.find((o) => o.type === 'porta')!;
    no(s, { type: 'demolish', x: door.x, y: door.y });
    const a = cellOf(s, 'sala_vendita');
    ok(s, { type: 'placeObject', object: 'scaffale', ...a, category: 'Pasta' });
    ok(s, { type: 'demolish', ...a });
});

test('locked objects, roles and orders are refused; candidates only for unlocked roles', () => {
    const s = createState(1);
    no(s, { type: 'placeObject', object: 'cestino', ...cellOf(s, 'sala_vendita') });
    no(s, { type: 'placeObject', object: 'porta', ...cellOf(s, 'sala_vendita') });
    assert.deepEqual([...new Set(s.candidates.map((c) => c.role))].sort(), [...LEVELS[0].roles].sort());
    no(s, { type: 'order', category: 'Pasta' });
    const s2 = createState(2);
    ok(s2, { type: 'order', category: 'Pasta' });
});

test('only unlocked customers come, asking only for what the shop can sell', () => {
    const s = level1();
    const can = sellable(s);
    for (let i = 0; i < 200; i++) {
        const c = spawnCustomer(s)!;
        assert.ok(LEVELS[0].customers.includes(c.kind), c.kind);
        assert.ok(c.list.every((x) => can.includes(x)), c.list.join());
    }
});

test('locked events never happen: no spills, carts, inspection or tiredness in level 1', () => {
    const s = level1();
    const c = spawnCustomer(s)!;
    for (let i = 0; i < 2000; i++) maybeSpill(s, c);
    assert.equal(s.spills.length, 0, 'spills');
    s.day = INSPECTION_DAY;
    s.clockSec = INSPECTION_HOUR * 3600;
    const energy = s.staff[0].energy;
    untilTicks(s, () => !!s.summary, 20_000);
    assert.ok(!s.customers.some((x) => x.kind === 'ispettore') && !s.inspection, 'inspection');
    assert.equal(s.carts.length, 0, 'carts');
    assert.equal(s.staff[0].energy, energy, 'tiredness');
});

test('goals and days come from the level', () => {
    const s = createState(1);
    const { goals, days } = LEVELS[0];
    assert.deepEqual(goalsOf(s), { goals, days });
    Object.assign(s, { money: goals.money + 500, reputation: goals.reputation, servedTotal: goals.served });
    closeDay(s);
    assert.equal(s.outcome?.win, true);
    const t = createState(1);
    t.day = days;
    closeDay(t);
    assert.equal(t.outcome?.win, false);
    assert.deepEqual(goalsOf(createState()), { goals: LEVEL.goals, days: LEVEL.days }, 'free shop keeps its goals');
});

test('winning opens the next level; progress survives a reload; the free shop opens after level 3', () => {
    let p = loadProgress(null);
    assert.ok(levelOpen(p, 1) && !levelOpen(p, 2));
    p = winLevel(p, 1);
    assert.ok(levelOpen(p, 2) && !levelOpen(p, 3) && !freeOpen(p));
    p = loadProgress(JSON.stringify(winLevel(winLevel(p, 2), 3)));
    assert.ok(levelOpen(p, 3) && freeOpen(p));
    assert.deepEqual(loadProgress('{broken'), { won: [], seen: [] });
});

test('free shop is the old game; old saves load as the free shop', () => {
    const s = createState();
    assert.equal(s.level, 0);
    assert.equal(s.rooms.length, 0);
    assert.deepEqual([...new Set(s.candidates.map((c) => c.role))].sort(), Object.keys(ROLES).sort());
    const old = createState();
    delete (old as Partial<GameState>).level;
    const l = loadGame(JSON.stringify({ v: 1, s: old }))!;
    assert.equal(l.level, 0);
    ok(l, { type: 'buildRoom', room: 'sala_vendita', x: 3, y: 3, w: 4, h: 4 });
    tick(l);
});
