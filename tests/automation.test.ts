import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick } from '../src/sim/state.ts';
import { apply } from '../src/sim/build.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { bossTap } from '../src/sim/staff.ts';
import { addSpill } from '../src/sim/dirt.ts';
import { loadGame } from '../src/sim/save.ts';
import { PRICES, TIP, TRAITS, WAGE_SPREAD, FURB_REP_GAIN, REP_SERVED } from '../src/sim/config.ts';
import type { GameState } from '../src/sim/state.ts';
import { shop, noArrivals, untilTicks, runOut, hireStaff, withWarehouse } from './helpers.ts';

const furbetto = (s: GameState, trick: 'cut' | 'run') => Object.assign(spawnCustomer(s, ['Pasta'], 'furbetto')!, { trick });

/** shop() plus a guard standing at his post by the till. */
function guarded() {
    const s = shop();
    noArrivals(s);
    const g = hireStaff(s, 'guardia');
    assert.ok(untilTicks(s, () => g.state === 'idle' && !g.path.length) >= 0, 'guard reaches his post');
    return s;
}

test('the guard by the till catches a runner without a tap', () => {
    const s = guarded();
    const money = s.money;
    furbetto(s, 'run');
    runOut(s);
    assert.deepEqual(s.furbetti, { caught: 1, escaped: 0 });
    assert.equal(s.money, money + PRICES.Pasta, 'he paid');
});

test('the guard catches the one jumping the queue too', () => {
    const s = guarded();
    const rep = s.reputation;
    furbetto(s, 'cut');
    runOut(s);
    assert.equal(s.furbetti.caught, 1);
    assert.ok(s.reputation - rep < FURB_REP_GAIN + REP_SERVED, 'less reputation than a tap');
});

test('no guard: the runner gets away', () => {
    const s = shop();
    noArrivals(s);
    furbetto(s, 'run');
    runOut(s);
    assert.deepEqual(s.furbetti, { caught: 0, escaped: 1 });
});

test('the floor manager picks the tap a player would: bill, spill, shelf, cart', () => {
    const s = withWarehouse();
    const till = s.objects.find((o) => o.type === 'cassa')!;
    const shelf = s.objects.find((o) => o.type === 'scaffale')!;
    assert.equal(bossTap(s), null, 'nothing to do');
    hireStaff(s, 'magazziniere');
    hireStaff(s, 'pulizie');
    s.carts.push({ id: 900, x: 6, y: 6 });
    assert.deepEqual(bossTap(s), { type: 'removeCart', cartId: 900 });
    shelf.stock = 3;
    s.warehouse.Pasta = 10;
    assert.deepEqual(bossTap(s), { type: 'restock', shelfId: shelf.id });
    const spill = addSpill(s, 7, 6)!;
    assert.deepEqual(bossTap(s), { type: 'clean', spillId: spill.id });
    const c = spawnCustomer(s, ['Pasta'])!;
    Object.assign(c, { state: 'ready', goal: { kind: 'till', id: till.id }, timer: 3 });
    assert.deepEqual(bossTap(s), { type: 'collect', tillId: till.id });
});

test('the floor manager collects bills before the cashier closes them alone (tip included)', () => {
    const s = shop();
    noArrivals(s);
    hireStaff(s, 'capo');
    const money = s.money;
    spawnCustomer(s, ['Pasta']);
    runOut(s);
    assert.equal(s.money, money + PRICES.Pasta + TIP);
});

test('the floor manager costs more than anyone with his trait, the guard less', () => {
    const s = shop();
    const off = (role: string) => s.candidates.filter((c) => c.role === role).map((c) => c.wage - TRAITS[c.trait].wage);
    assert.ok(off('capo').every((d) => d > WAGE_SPREAD), `${off('capo')}`);
    assert.ok(off('guardia').every((d) => d < -WAGE_SPREAD), `${off('guardia')}`);
});

test('old saves get the new candidates', () => {
    const old = shop();
    old.candidates = old.candidates.filter((c) => c.role !== 'guardia' && c.role !== 'capo');
    const s = loadGame(JSON.stringify({ v: 1, s: old }))!;
    assert.ok(s.candidates.some((c) => c.role === 'guardia') && s.candidates.some((c) => c.role === 'capo'));
    tick(s);
    assert.equal(apply(s, { type: 'hire', candidateId: s.candidates.find((c) => c.role === 'capo')!.id }).ok, true);
});
