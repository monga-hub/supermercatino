import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick } from '../src/sim/state.ts';
import { spawnCustomer, checkout } from '../src/sim/customers.ts';
import { CUSTOMER_TYPES, PRICES, BEAR_BONUS_MONEY, BEAR_BONUS_REP, REP_SERVED } from '../src/sim/config.ts';
import { shop, untilTicks, noArrivals } from './helpers.ts';

const KINDS = Object.keys(CUSTOMER_TYPES).filter((k) => k !== 'ispettore'); // the inspector never comes at random

test('natural arrivals mix every customer type, the bear is the rarest', () => {
    const s = shop({ cashier: false });
    const count: Record<string, number> = {};
    for (let i = 0; i < 3000; i++) {
        const c = spawnCustomer(s)!;
        count[c.kind] = (count[c.kind] ?? 0) + 1;
        const [lo, hi] = CUSTOMER_TYPES[c.kind].list;
        assert.ok(c.list.length >= lo && c.list.length <= hi, `${c.kind} list ${c.list.length}`);
        s.customers = [];
    }
    for (const k of KINDS) assert.ok(count[k] > 0, `no ${k}`);
    assert.ok(KINDS.every((k) => k === 'orso' || count[k] > count.orso), JSON.stringify(count));
});

test('the young man walks faster than the old lady', () => {
    const time = (kind: 'giovane' | 'vecchietta') => {
        const s = shop();
        noArrivals(s);
        const c = spawnCustomer(s, ['Pasta'], kind)!;
        return untilTicks(s, () => c.state !== 'shopping');
    };
    assert.ok(time('giovane') < time('vecchietta'));
});

test('the old lady loses patience slower in the queue than Signor Ponzone', () => {
    const s = shop({ cashier: false });
    noArrivals(s);
    const till = s.objects.find((o) => o.type === 'cassa')!;
    const [a, b] = (['vecchietta', 'ponzone'] as const).map((k) => {
        const c = spawnCustomer(s, ['Pasta'], k)!;
        Object.assign(c, { state: 'queueing', goal: { kind: 'till', id: till.id }, x: till.x, y: till.y - 1, path: [] });
        return c;
    });
    for (let i = 0; i < 20; i++) tick(s);
    assert.ok(100 - a.patience < 100 - b.patience, `${a.patience} vs ${b.patience}`);
});

test('Signor Ponzone pays more for the same basket', () => {
    const s = shop();
    const pay = (kind: 'signora' | 'ponzone') => {
        const c = spawnCustomer(s, ['Salumi'], kind)!;
        c.basket = ['Salumi'];
        const before = s.money;
        checkout(s, c, 0);
        return s.money - before;
    };
    assert.equal(pay('signora'), PRICES.Salumi);
    assert.equal(pay('ponzone'), Math.round(PRICES.Salumi * CUSTOMER_TYPES.ponzone.pay));
});

test('a happy bear pays a big bonus, an unhappy one does not', () => {
    const s = shop();
    const serve = (patience: number) => {
        const c = spawnCustomer(s, ['Frutta'], 'orso')!;
        c.basket = ['Frutta'];
        c.patience = patience;
        const m = s.money, r = s.reputation;
        s.reputation = 50;
        checkout(s, c, 0);
        return { money: s.money - m, rep: s.reputation - 50, r };
    };
    const happy = serve(90);
    assert.deepEqual([happy.money, happy.rep], [PRICES.Frutta + BEAR_BONUS_MONEY, REP_SERVED + BEAR_BONUS_REP]);
    assert.equal(s.happyBears, 1);
    const grumpy = serve(10);
    assert.deepEqual([grumpy.money, grumpy.rep], [PRICES.Frutta, REP_SERVED]);
    assert.equal(s.happyBears, 1);
});
