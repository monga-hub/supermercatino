import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick, createState } from '../src/sim/state.ts';
import { FEMALE_NAMES, ROLE_SEX } from '../src/sim/config.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { personFrame } from '../src/render/sprites.ts';
import { shop, untilTicks, hireStaff, withWarehouse } from './helpers.ts';

test('a walking customer steps through walk frames', () => {
    const s = shop();
    const c = spawnCustomer(s, ['Pasta'])!;
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
        tick(s);
        seen.add(personFrame(s, c));
    }
    assert.ok([...seen].every((f) => f.startsWith('signora_walk_')), [...seen].join());
    assert.ok(seen.size >= 2, 'frames change while walking');
});

test('each customer type has its own frames', () => {
    const s = shop();
    const c = spawnCustomer(s, ['Pasta'], 'orso')!;
    assert.match(personFrame(s, c), /^orso_walk_[012]$/);
    c.state = 'queueing';
    assert.equal(personFrame(s, c), 'orso_idle');
});

test('customer poses: queue, pay, angry', () => {
    const s = shop();
    const c = spawnCustomer(s, ['Pasta'])!;
    c.state = 'queueing';
    assert.equal(personFrame(s, c), 'signora_idle');
    c.state = 'paying';
    assert.equal(personFrame(s, c), 'signora_pay');
    c.state = 'ready';
    assert.equal(personFrame(s, c), 'signora_pay');
    c.state = 'leaving_angry';
    assert.match(personFrame(s, c), /^signora_angry_[012]$/);
});

test('cashier alternates scan poses while a customer pays at her till', () => {
    const s = shop();
    const cashier = s.staff[0];
    cashier.name = 'Rosa'; // the red-smock lady
    assert.equal(personFrame(s, cashier), 'cassiere_seduto');
    const c = spawnCustomer(s, ['Pasta'])!;
    assert.ok(untilTicks(s, () => c.state === 'paying') >= 0);
    const seen = new Set<string>();
    while (c.state === 'paying') {
        seen.add(personFrame(s, cashier));
        tick(s);
    }
    assert.deepEqual([...seen].sort(), ['cassiere_scan_0', 'cassiere_scan_1']);
});

test('stocker carries a box only with goods in hand', () => {
    const s = withWarehouse();
    const st = hireStaff(s, 'magazziniere');
    st.name = 'Gino';
    st.job = { shelfId: 0, category: 'Pasta', units: 0 };
    assert.match(personFrame(s, st), /^magazziniere_walk_[012]$/);
    st.job.units = 5;
    assert.match(personFrame(s, st), /^magazziniere_carry_[012]$/);
});

test('cashiers and stockers come as men and women, the sprite follows the name', () => {
    const s = shop();
    const cashier = s.staff[0];
    cashier.name = 'Salvo';
    assert.equal(personFrame(s, cashier), 'cassiere_m_seduto');
    const st = hireStaff(withWarehouse(), 'magazziniere');
    st.name = 'Lucia';
    assert.match(personFrame(s, st), /^magazziniera_walk_[012]$/);
    const all = createState().candidates; // free shop: every role
    assert.ok(all.some((x) => ROLE_SEX[x.role]));
    for (const c of all.filter((x) => ROLE_SEX[x.role])) assert.equal(FEMALE_NAMES.includes(c.name), ROLE_SEX[c.role] === 'f', `${c.name} as ${c.role}`);
});
