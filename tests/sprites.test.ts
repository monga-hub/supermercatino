import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tick, createState } from '../src/sim/state.ts';
import { FEMALE_NAMES, ROLE_SEX } from '../src/sim/config.ts';
import { spawnCustomer } from '../src/sim/customers.ts';
import { personFrame, objectFrame, SHELF_FRAMES, walkBob, walkSway } from '../src/render/sprites.ts';
import type { ShopObject, Category } from '../src/sim/state.ts';
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

test('walkers bob: feet down on contact, body up mid-step (playtest 2026-11-27)', () => {
    assert.ok(walkBob({ x: 3, y: 4 }) < 0.01, 'foot down');
    assert.ok(walkBob({ x: 3.25, y: 4 }) >= 2, 'up mid-step');
    assert.ok(walkBob({ x: 3, y: 4.5 }) < 0.01, 'down again on the next contact');
});

test('walkers rock from one foot to the other (playtest 2026-11-27)', () => {
    const a = walkSway({ x: 3.25, y: 4 }), b = walkSway({ x: 3.75, y: 4 });
    assert.ok(a > 0.05 && b < -0.05, `${a} ${b}`);
    assert.ok(Math.abs(walkSway({ x: 3, y: 4 })) < 0.01, 'upright with both feet down');
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

test('furniture with goods shows full, half, empty (milestone 25)', () => {
    const at = (type: ShopObject['type'], stock: number, category?: Category) => objectFrame({ type, stock, category });
    assert.deepEqual([10, 6, 5, 1, 0].map((n) => at('scaffale', n, 'Pasta')), ['scaffale_Pasta', 'scaffale_Pasta', 'scaffale_Pasta_mezzo', 'scaffale_Pasta_mezzo', 'scaffale_Pasta_vuoto']);
    assert.deepEqual([10, 3, 0].map((n) => at('frigo', n, 'Latticini')), ['frigo', 'frigo_mezzo', 'frigo_vuoto']);
    assert.deepEqual([10, 3, 0].map((n) => at('forno', n, 'Pane')), ['forno', 'forno_mezzo', 'forno_vuoto']);
    assert.deepEqual([10, 3, 0].map((n) => at('bancone', n, 'Salumi')), ['bancone', 'bancone_mezzo', 'bancone_vuoto']);
    assert.equal(at('cassa', 0), 'cassa');
    assert.ok(SHELF_FRAMES.includes('scaffale_Detersivi_mezzo') && SHELF_FRAMES.includes('bancone_vuoto'));
});
