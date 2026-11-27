// Staff: candidates, hiring, and per-role behaviour. Pure, deterministic.
import { SERVED_BY, ROLES, TRAITS, STAFF_NAMES, FEMALE_NAMES, ROLE_SEX, CANDIDATES_PER_ROLE, WAGE_SPREAD, STAFF_SPEED, SHELF_CAPACITY, AUTO_RESTOCK_BELOW,
    ENERGY_MAX, ENERGY_DRAIN_PER_H, REST_PER_H, BREAK_BELOW, TIRED_SPEED, GAME_MIN_PER_SEC, STEP_MS,
    TAP_ICON_BELOW, GUARD_RADIUS, BOSS_EVERY_SEC } from './config.ts';
import { allows } from './levels.ts';
import { rand, pick } from './rng.ts';
import { findPath, pathToObject, walk, type Cell, type Walkable } from './path.ts';
import type { GameState, Role, Trait, Staff, ShopObject, Cart } from './state.ts';
import { updateCleaner } from './dirt.ts';
import { tricking, catchFurbetto, readyAt } from './customers.ts';
import { check, apply, crossing, type Command } from './build.ts';

/** Top up the candidate list to CANDIDATES_PER_ROLE per role. */
export function refillCandidates(s: GameState) {
    for (const role of (Object.keys(ROLES) as Role[]).filter((r) => allows(s, 'roles', r))) {
        while (s.candidates.filter((c) => c.role === role).length < CANDIDATES_PER_ROLE) {
            const trait = pick(s, Object.keys(TRAITS) as Trait[]);
            const wage = TRAITS[trait].wage + ROLES[role].extra + Math.round((rand(s) * 2 - 1) * WAGE_SPREAD);
            const used = new Set([...s.candidates, ...s.staff].map((c) => c.name));
            const sex = ROLE_SEX[role];
            const names = STAFF_NAMES.filter((n) => !sex || FEMALE_NAMES.includes(n) === (sex === 'f'));
            const free = names.filter((n) => !used.has(n));
            s.candidates.push({ id: s.nextId++, role, name: pick(s, free.length ? free : names), trait, wage });
        }
    }
}

/** Move a candidate into the staff; they enter from the door. Caller validates the id. */
export function hire(s: GameState, candidateId: number) {
    const c = s.candidates.splice(s.candidates.findIndex((x) => x.id === candidateId), 1)[0];
    const door = s.objects.find((o) => o.type === 'porta');
    s.staff.push({ ...c, state: 'arriving', x: door?.x ?? 0, y: door?.y ?? 0, path: [], tillId: null, job: null, energy: ENERGY_MAX });
    refillCandidates(s);
}

export function fire(s: GameState, staffId: number) {
    s.staff.splice(s.staff.findIndex((x) => x.id === staffId), 1);
}

/** Staff walk on every room floor (warehouse included); objects block, except the door. */
function walkableFor(s: GameState): Walkable {
    const open = new Set<string>();
    for (const r of s.rooms) for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) open.add(`${x},${y}`);
    for (const o of s.objects) if (o.type !== 'porta') open.delete(`${o.x},${o.y}`);
    return Object.assign((x: number, y: number) => open.has(`${x},${y}`), { cross: crossing(s) });
}

/** Tired: below the break threshold (milestone 18). Work pace: TIRED_SPEED when tired, else the trait's speed. */
export const tired = (st: Staff) => st.energy < BREAK_BELOW;
export const pace = (st: Staff) => (tired(st) ? TIRED_SPEED : TRAITS[st.trait].speed);

const STEP_H = (GAME_MIN_PER_SEC * STEP_MS) / 1000 / 60;

/** Tired, there are lockers, and no colleague with the same role is on a break (one at a time). */
export const wantsBreak = (s: GameState, st: Staff) =>
    tired(st) && s.objects.some((o) => o.type === 'armadietti') && !s.staff.some((o) => o.role === st.role && o.state === 'resting');

/** Not in the middle of something: nobody at the till, no goods in hand, no spill or cart on the way. */
const free = (s: GameState, st: Staff) =>
    !st.job && st.cart === undefined && !st.clean &&
    !s.customers.some((c) => c.goal?.kind === 'till' && c.goal.id === st.tillId && (c.state === 'paying' || c.state === 'ready'));

/** Head to the nearest lockers for a break; false if there are none (or none reachable). */
function goRest(s: GameState, st: Staff, w: Walkable) {
    let best: Cell[] | null = null;
    for (const o of s.objects) {
        if (o.type !== 'armadietti') continue;
        const p = pathToObject(w, { x: Math.round(st.x), y: Math.round(st.y) }, o);
        if (p && (!best || p.length < best.length)) best = p;
    }
    if (!best) return false;
    Object.assign(st, { state: 'resting', path: best, tillId: null });
    return true;
}

function rest(st: Staff) {
    if (st.path.length) return walk(st, STAFF_SPEED);
    st.energy = Math.min(ENERGY_MAX, st.energy + REST_PER_H * STEP_H);
    if (st.energy >= ENERGY_MAX) st.state = 'idle';
}

/** The cashier seated at this till (or the deli man at this counter), if any. */
export const cashierAt = (s: GameState, till: ShopObject) =>
    s.staff.find((st) => st.role === SERVED_BY[till.type] && st.state === 'at_till' && st.tillId === till.id);

function updateCashier(s: GameState, st: Staff, w: Walkable) {
    let till = s.objects.find((o) => o.id === st.tillId && SERVED_BY[o.type] === st.role);
    if (st.state === 'at_till' && till) return;
    if (!till) {
        // ponytail: idle cashiers re-search every tick; cache per layout change if lots get big
        const taken = new Set(s.staff.filter((o) => o !== st).map((o) => o.tillId));
        let best: { till: ShopObject; path: ReturnType<typeof pathToObject> } | null = null;
        for (const t of s.objects) {
            if (SERVED_BY[t.type] !== st.role || taken.has(t.id)) continue;
            const path = pathToObject(w, st, t);
            if (path && (!best || path.length < best.path!.length)) best = { till: t, path };
        }
        if (!best) {
            st.state = 'idle';
            st.tillId = null;
            st.path = [];
            return;
        }
        till = best.till;
        st.tillId = till.id;
        st.path = best.path!;
        st.state = 'arriving';
    }
    if (st.path.length) return walk(st, STAFF_SPEED);
    st.state = 'at_till'; // next to the till: take the seat
    st.x = till.x;
    st.y = till.y;
}

/** Shortest path to any free warehouse cell. */
function pathToWarehouse(s: GameState, w: Walkable, from: Cell) {
    let best: Cell[] | null = null;
    for (const r of s.rooms) {
        if (r.type !== 'magazzino') continue;
        for (let x = r.x; x < r.x + r.w; x++)
            for (let y = r.y; y < r.y + r.h; y++) {
                const p = findPath(w, from, { x, y });
                if (p && (!best || p.length < best.length)) best = p;
            }
    }
    return best;
}

/** Walk to an abandoned cart (staff can step on it) to take it away. */
function goForCart(s: GameState, st: Staff, w: Walkable, cart: Cart) {
    const path = findPath(w, { x: Math.round(st.x), y: Math.round(st.y) }, cart);
    if (!path) return false;
    Object.assign(st, { cart: cart.id, path, state: 'cart' });
    s.cartQueue = s.cartQueue.filter((id) => id !== cart.id);
    return true;
}

/**
 * One trip at a time: warehouse -> shelf, filling it up. Tapped carts and shelves first,
 * then almost empty shelves, then any abandoned cart (milestone 14).
 */
function updateStocker(s: GameState, st: Staff, w: Walkable) {
    if (st.cart !== undefined) {
        const cart = s.carts.find((c) => c.id === st.cart);
        if (cart && st.path.length) return walk(st, STAFF_SPEED * pace(st));
        if (cart) s.carts = s.carts.filter((c) => c !== cart); // taken away
        delete st.cart;
        Object.assign(st, { path: [], state: "idle" });
        return;
    }
    if (!st.job) {
        const free = s.carts.filter((c) => !s.staff.some((o) => o.cart === c.id));
        s.cartQueue = s.cartQueue.filter((id) => s.carts.some((c) => c.id === id));
        const tapped = s.cartQueue.map((id) => free.find((c) => c.id === id)).find(Boolean);
        if (tapped && goForCart(s, st, w, tapped)) return;
        st.state = 'idle';
        const taken = new Set(s.staff.map((o) => o.job?.shelfId));
        // ponytail: idle stockers re-search every tick; fine while shelves are few
        const open = s.objects.filter((o) =>
            o.category && o.type !== 'forno' && o.stock! < SHELF_CAPACITY && s.warehouse[o.category!] > 0 && !taken.has(o.id));
        s.restockQueue = s.restockQueue.filter((id) => s.objects.some((o) => o.id === id && o.stock! < SHELF_CAPACITY));
        const shelf = s.restockQueue.map((id) => open.find((o) => o.id === id)).find(Boolean)
            ?? open.find((o) => o.stock! < AUTO_RESTOCK_BELOW);
        const path = shelf && pathToWarehouse(s, w, st);
        if (!shelf || !path) return void free.find((c) => goForCart(s, st, w, c));
        s.restockQueue = s.restockQueue.filter((id) => id !== shelf.id);
        st.job = { shelfId: shelf.id, category: shelf.category!, units: 0 };
        st.path = path;
        st.state = 'fetching';
    }
    if (st.path.length) return walk(st, STAFF_SPEED * pace(st));
    const job = st.job;
    const shelf = s.objects.find((o) => o.id === job.shelfId);
    if (st.state === 'fetching') {
        // in the warehouse: load what the shelf is missing
        const units = Math.min(shelf ? SHELF_CAPACITY - shelf.stock! : 0, s.warehouse[job.category]);
        const path = shelf && units > 0 ? pathToObject(w, st, shelf) : null;
        if (!path) {
            st.job = null;
            return;
        }
        s.warehouse[job.category] -= units;
        job.units = units;
        st.path = path;
        st.state = 'delivering';
        return;
    }
    // at the shelf; whatever doesn't fit (or a demolished shelf) goes back to the warehouse
    const put = shelf ? Math.min(job.units, SHELF_CAPACITY - shelf.stock!) : 0;
    if (shelf) shelf.stock! += put;
    s.warehouse[job.category] += job.units - put;
    st.job = null;
    st.state = 'idle';
}

/** After the layout changes: staff whose path got blocked stop on their cell and re-plan next tick. */
export function rerouteStaff(s: GameState) {
    const w = walkableFor(s);
    const door = s.objects.find((o) => o.type === 'porta');
    for (const st of s.staff) {
        if (door && !w(Math.round(st.x), Math.round(st.y)) && !(st.x === door.x && st.y === door.y))
            Object.assign(st, { x: door.x, y: door.y, path: [] }); // hired before there was a door: come in now
        if (st.path.every((c) => w(c.x, c.y))) continue;
        // ponytail: snap to the nearest cell and drop the errand (goods go back to the warehouse); re-plan from scratch
        Object.assign(st, { x: Math.round(st.x), y: Math.round(st.y), path: [], state: 'idle' });
        if (st.role === 'cassiere' || st.role === 'banconiere') st.tillId = null;
        else if (st.role === 'pulizie') delete st.clean;
        else if (st.cart !== undefined) delete st.cart;
        else if (st.job) {
            s.warehouse[st.job.category] += st.job.units;
            st.job = null;
        }
    }
}

/** Guard and floor manager stand next to the nearest till; true once there. */
function atPost(s: GameState, st: Staff, w: Walkable) {
    if (st.path.length) return void walk(st, STAFF_SPEED * pace(st));
    const tills = s.objects.filter((o) => o.type === 'cassa');
    if (tills.some((o) => Math.abs(o.x - st.x) <= 1 && Math.abs(o.y - st.y) <= 1)) return (st.state = 'idle'), true;
    let best: Cell[] | null = null;
    for (const o of tills) {
        const p = pathToObject(w, { x: Math.round(st.x), y: Math.round(st.y) }, o);
        if (p && (!best || p.length < best.length)) best = p;
    }
    Object.assign(st, { path: best ?? [], state: best?.length ? 'arriving' : 'idle' });
    return false;
}

const STEP_S = STEP_MS / 1000;

/** Milestone 19: at his post the guard catches any furbetto in range (he pays; less reputation than a tap). */
function updateGuard(s: GameState, st: Staff, w: Walkable) {
    st.wait = Math.max(0, (st.wait ?? 0) - STEP_S);
    if (!atPost(s, st, w)) return;
    for (const c of s.customers)
        if (tricking(c) && Math.abs(c.x - st.x) <= GUARD_RADIUS && Math.abs(c.y - st.y) <= GUARD_RADIUS) {
            catchFurbetto(s, c, 1);
            st.wait = 1.5; // whistle pose
        }
}

/** The tap a player would make next: bill ready, spill, almost empty shelf (emptiest first), abandoned cart. */
export function bossTap(s: GameState): Command | null {
    const ok = (c: Command) => check(s, c).ok;
    const shelves = s.objects.filter((o) => o.category && o.stock! < TAP_ICON_BELOW).sort((a, b) => a.stock! - b.stock!);
    return [
        ...s.objects.filter((o) => readyAt(s, o.id)).map((o): Command => ({ type: 'collect', tillId: o.id })),
        ...s.spills.map((p): Command => ({ type: 'clean', spillId: p.id })),
        ...shelves.map((o): Command => ({ type: 'restock', shelfId: o.id })),
        ...s.carts.map((c): Command => ({ type: 'removeCart', cartId: c.id })),
    ].find(ok) ?? null;
}

/** Milestone 19: the floor manager makes one tap every BOSS_EVERY_SEC (slower when tired). */
function updateBoss(s: GameState, st: Staff, w: Walkable) {
    if (!atPost(s, st, w)) return;
    st.wait = (st.wait ?? 0) - STEP_S;
    if (st.wait > 0) return;
    const c = bossTap(s);
    if (c) apply(s, c);
    st.wait = c ? BOSS_EVERY_SEC / pace(st) : 0;
}

export function updateStaff(s: GameState) {
    if (!s.staff.length) return;
    const w = walkableFor(s);
    for (const st of s.staff) {
        if (st.state === 'resting') {
            rest(st);
            continue;
        }
        if (allows(s, 'features', 'tiredness')) st.energy = Math.max(0, st.energy - ENERGY_DRAIN_PER_H * STEP_H);
        if (wantsBreak(s, st) && free(s, st) && goRest(s, st, w)) continue;
        if (st.role === 'cassiere' || st.role === 'banconiere') updateCashier(s, st, w);
        else if (st.role === 'pulizie') updateCleaner(s, st, w);
        else if (st.role === 'guardia') updateGuard(s, st, w);
        else if (st.role === 'capo') updateBoss(s, st, w);
        else updateStocker(s, st, w);
    }
}
