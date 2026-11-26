import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, tick, type GameState } from '../src/sim/state.ts';
import { apply } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { spawnEveryMin } from '../src/sim/day.ts';
import {
    DAY_CLOSE_MIN, LAST_ARRIVAL_MIN, DAILY_RENT, ORDER_UNITS, UNIT_COST, REP_START, REP_SERVED, REP_LOST, REP_MIN,
    LEVEL, BAD_DAYS, DAY_OPEN_MIN,
} from '../src/sim/config.ts';
import { shop, hireStaff, noArrivals, runOut, untilTicks, withWarehouse } from './helpers.ts';

/** Tick until the day closes (summary shown). */
const endDay = (s: GameState) => assert.ok(untilTicks(s, () => !!s.summary, 10_000) >= 0, 'day ends');
const cont = (s: GameState) => assert.equal(apply(s, { type: 'continue' }).ok, true);

test('shop closes at closing time', () => {
    const s = shop();
    const seen = new Set<number>();
    for (let i = 0; i < 10_000 && !s.summary; i++) {
        tick(s);
        for (const c of s.customers) {
            if (!seen.has(c.id) && s.clockSec >= (DAY_CLOSE_MIN - LAST_ARRIVAL_MIN) * 60)
                assert.fail(`customer ${c.id} arrived at ${s.clockSec / 60} min, after last arrival`);
            seen.add(c.id);
        }
    }
    assert.ok(seen.size > 0, 'customers came during the day');
    assert.ok(s.summary, 'summary at closing');
    assert.equal(s.customers.length, 0, 'shop empty');
    assert.ok(s.paused, 'game paused on the summary');
    const clock = s.clockSec;
    tick(s);
    assert.equal(s.clockSec, clock, 'time stands still until continue');
});

test('day summary adds up', () => {
    const s = withWarehouse(); // no automatic arrivals: only the customers below
    hireStaff(s, 'magazziniere');
    const m0 = s.money;
    apply(s, { type: 'order', category: 'Pasta' });
    for (let i = 0; i < 3; i++) {
        spawnCustomer(s, ['Pasta']);
        runOut(s);
    }
    endDay(s);
    const sum = s.summary!;
    const wages = s.staff.reduce((a, st) => a + st.wage, 0);
    assert.equal(sum.rent, DAILY_RENT);
    assert.equal(sum.wages, wages);
    assert.equal(sum.goods, ORDER_UNITS * UNIT_COST.Pasta);
    assert.ok(sum.income > 0, 'something sold');
    assert.equal(s.money, m0 + sum.income - sum.goods - sum.wages - sum.rent);
    assert.equal(sum.money, s.money);
    assert.equal(sum.served, s.servedToday);
    assert.equal(sum.lost, s.lostToday);

    cont(s);
    assert.equal(s.day, 2);
    assert.equal(s.clockSec, DAY_OPEN_MIN * 60);
    assert.equal(s.summary, null);
    assert.equal(s.paused, false);
    assert.equal(s.servedToday, 0);
    assert.equal(apply(s, { type: 'continue' }).ok, false, 'nothing to continue');
});

test('reputation drives arrivals', () => {
    const s = shop();
    noArrivals(s);
    assert.equal(s.reputation, REP_START);
    spawnCustomer(s, ['Pasta']);
    runOut(s);
    assert.equal(s.reputation, REP_START + REP_SERVED);
    spawnCustomer(s, ['Salumi']); // not sold here: leaves angry
    runOut(s);
    assert.equal(s.reputation, REP_START + REP_SERVED - REP_LOST);

    assert.ok(spawnEveryMin(100) < spawnEveryMin(REP_START));
    assert.ok(spawnEveryMin(REP_START) < spawnEveryMin(0));
    const arrivals = (rep: number) => {
        const t = shop();
        t.reputation = rep;
        const ids = new Set<number>();
        for (let i = 0; i < 2000; i++) {
            tick(t);
            t.reputation = rep; // hold it still
            for (const c of t.customers) ids.add(c.id);
        }
        return ids.size;
    };
    assert.ok(arrivals(100) > arrivals(0));
});

test('win and lose conditions', () => {
    const win = createState();
    win.money = LEVEL.goals.money + DAILY_RENT;
    win.reputation = LEVEL.goals.reputation;
    win.servedTotal = LEVEL.goals.served;
    endDay(win);
    assert.equal(win.outcome?.win, true);
    assert.equal(apply(win, { type: 'continue' }).ok, false, 'level over');

    const broke = createState();
    broke.money = -10;
    for (let d = 0; d < BAD_DAYS; d++) {
        if (d) cont(broke);
        endDay(broke);
    }
    assert.equal(broke.outcome?.win, false);
    assert.match(broke.outcome!.reason, /Bancarotta/);

    const disliked = createState();
    disliked.reputation = REP_MIN - 1;
    endDay(disliked);
    assert.equal(disliked.outcome, null, 'one bad closing is a warning');
    cont(disliked);
    endDay(disliked);
    assert.equal(disliked.outcome?.win, false);
    assert.match(disliked.outcome!.reason, /Reputazione/);

    const late = createState();
    for (let d = 1; d <= LEVEL.days; d++) {
        if (d > 1) cont(late);
        endDay(late);
        if (d < LEVEL.days) assert.equal(late.outcome, null, `still playing on day ${d}`);
    }
    assert.equal(late.outcome?.win, false, 'time is up');
});
