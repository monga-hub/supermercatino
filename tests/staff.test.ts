import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, advance, type GameState } from '../src/sim/state.ts';
import { apply } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { DAILY_RENT, TRAITS, ROLES, STAFF_NAMES, CANDIDATES_PER_ROLE, DAY_OPEN_MIN, DAY_CLOSE_MIN, GAME_MIN_PER_SEC } from '../src/sim/config.ts';
import { shop, hireCashier, noArrivals, untilTicks, runOut } from './helpers.ts';

test('candidates are seeded and valid', () => {
    const a = createState(), b = createState();
    assert.deepEqual(a.candidates, b.candidates);
    const cashiers = a.candidates.filter((c) => c.role === 'cassiere');
    assert.equal(cashiers.length, CANDIDATES_PER_ROLE);
    for (const c of a.candidates) {
        assert.ok(c.trait in TRAITS, c.trait);
        assert.ok((STAFF_NAMES as readonly string[]).includes(c.name), c.name);
        assert.ok(c.wage > 0);
    }
});

test('hire and fire', () => {
    const s = createState();
    const first = s.candidates[0];
    assert.equal(apply(s, { type: 'hire', candidateId: first.id }).ok, true);
    assert.equal(s.staff.length, 1);
    assert.equal(s.staff[0].name, first.name);
    assert.equal(s.candidates.length, CANDIDATES_PER_ROLE * Object.keys(ROLES).length, 'candidate replaced');
    assert.ok(!s.candidates.some((c) => c.id === first.id));

    const before = structuredClone(s);
    assert.equal(apply(s, { type: 'hire', candidateId: 9999 }).ok, false);
    assert.equal(apply(s, { type: 'fire', staffId: 9999 }).ok, false);
    assert.deepEqual(s, before);

    assert.equal(apply(s, { type: 'fire', staffId: s.staff[0].id }).ok, true);
    assert.equal(s.staff.length, 0);
});

test('unstaffed till does not serve', () => {
    const s = shop({ cashier: false });
    noArrivals(s);
    const m0 = s.money;
    const c = spawnCustomer(s, ['Pasta'])!;
    const seen = runOut(s);
    assert.ok(seen.get(c.id)!.includes('queueing'));
    assert.ok(!seen.get(c.id)!.includes('paying'));
    assert.equal(seen.get(c.id)!.at(-1), 'leaving_angry');
    assert.equal(s.money, m0);
});

test('cashier walks to till and serves', () => {
    const s = shop({ cashier: false });
    noArrivals(s);
    const st = hireCashier(s);
    assert.notEqual(st.state, 'at_till');
    assert.ok(untilTicks(s, () => s.staff[0].state === 'at_till') > 0, 'walks there first');
    const till = s.objects.find((o) => o.type === 'cassa')!;
    assert.equal(s.staff[0].tillId, till.id);
    spawnCustomer(s, ['Pasta']);
    runOut(s);
    assert.equal(s.servedToday, 1);
});

test('faster cashier serves faster', () => {
    const payTicks = (trait: string) => {
        const s = shop({ cashier: false });
        noArrivals(s);
        hireCashier(s, trait);
        untilTicks(s, () => s.staff[0].state === 'at_till');
        const c = spawnCustomer(s, ['Pasta'])!;
        untilTicks(s, () => c.state === 'paying');
        return untilTicks(s, () => c.state !== 'paying');
    };
    assert.ok(payTicks('svelto') < payTicks('normale'));
    assert.ok(payTicks('normale') < payTicks('chiacchierone'));
});

test('wages paid at day end', () => {
    const s: GameState = createState();
    noArrivals(s);
    const st = hireCashier(s);
    const m0 = s.money;
    advance(s, ((DAY_CLOSE_MIN - DAY_OPEN_MIN) / GAME_MIN_PER_SEC) * 1000);
    assert.ok(s.summary, 'day closed');
    assert.equal(s.money, m0 - st.wage - DAILY_RENT);
});
