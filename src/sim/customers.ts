// Customers: a small state machine per customer (shopping -> queueing -> paying -> leaving,
// or leaving_angry when patience runs out). Pure, deterministic (seeded RNG in state).
import {
    STEP_MS, GAME_MIN_PER_SEC, CATEGORIES, PRICES, CUSTOMER_TYPES, CUSTOMER_SPEED, BEAR_HAPPY, BEAR_BONUS_MONEY, BEAR_BONUS_REP,
    SPILL_DRAIN, PATIENCE_START, PATIENCE_QUEUE_DRAIN, PATIENCE_WALK_DRAIN, PATIENCE_MISSING, PAY_SEC, TRAITS, AUTO_COLLECT_SEC,
    DAY_CLOSE_MIN, LAST_ARRIVAL_MIN, REP_SERVED, REP_LOST, SERVED_BY, SLICE_SEC, SCENT_BOOST,
    CART_CHANCE, CART_MAX, INSPECTION_DAY, INSPECTION_HOUR, INSPECTION_FINE, INSPECTION_BONUS,
    PATIENCE_CUT, FURB_REP_GAIN, FURB_REP_LOSS,
} from './config.ts';
import { findPath, pathToObject, walk, type Cell, type Walkable } from './path.ts';
import { rand } from './rng.ts';
import { cashierAt, pace, tired, wantsBreak } from './staff.ts';
import { spawnEveryMin } from './day.ts';
import { maybeSpill, spillNear } from './dirt.ts';
import type { GameState, Customer, CustomerKind, Category, ShopObject } from './state.ts';

const STEP_S = STEP_MS / 1000;
const GAME_SEC_PER_STEP = GAME_MIN_PER_SEC * 60 * STEP_S;

/** Customers walk on sales floor and checkout cells; objects block, except the door. */
export function walkableFor(s: GameState): Walkable {
    const open = new Set<string>();
    for (const r of s.rooms) {
        if (r.type === 'magazzino' || r.type === 'spogliatoio') continue; // staff only
        for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) open.add(`${x},${y}`);
    }
    for (const o of s.objects) if (o.type !== 'porta') open.delete(`${o.x},${o.y}`);
    for (const c of s.carts) open.delete(`${c.x},${c.y}`);
    return (x, y) => open.has(`${x},${y}`);
}

const door = (s: GameState) => s.objects.find((o) => o.type === 'porta');

/** Reachable till: staffed first, then shortest queue, then shortest walk. */
function pickTill(s: GameState, w: Walkable, from: Cell) {
    let best: { till: ShopObject; path: Cell[]; score: number } | null = null;
    for (const till of s.objects.filter((o) => o.type === 'cassa')) {
        const path = pathToObject(w, from, till);
        if (!path) continue;
        const queue = s.customers.filter((c) => c.goal?.kind === 'till' && c.goal.id === till.id).length;
        const score = (cashierAt(s, till) ? 0 : 1e6) + queue * 1e3 + path.length;
        if (!best || score < best.score) best = { till, path, score };
    }
    return best;
}

const KINDS = Object.keys(CUSTOMER_TYPES) as CustomerKind[];
const WEIGHT_SUM = KINDS.reduce((n, k) => n + CUSTOMER_TYPES[k].weight, 0);
function pickKind(s: GameState): CustomerKind {
    let r = rand(s) * WEIGHT_SUM;
    return KINDS.find((k) => (r -= CUSTOMER_TYPES[k].weight) < 0) ?? 'signora';
}

/**
 * New customer at the door. null if there is no door or no till reachable from it.
 * A given list (tests) defaults to a plain signora; otherwise type and list are random.
 */
export function spawnCustomer(s: GameState, list?: Category[], kind?: CustomerKind): Customer | null {
    const d = door(s);
    if (!d) return null;
    const w = walkableFor(s);
    if (!pickTill(s, w, d)) return null;
    kind ??= list ? 'signora' : pickKind(s);
    if (!list) {
        const pool = [...CATEGORIES];
        const [lo, hi] = CUSTOMER_TYPES[kind].list;
        const n = lo + Math.floor(rand(s) * (hi - lo + 1));
        list = Array.from({ length: n }, () => pool.splice(Math.floor(rand(s) * pool.length), 1)[0]);
    }
    const c: Customer = {
        id: s.nextId++, kind, state: 'shopping', x: d.x, y: d.y, path: [], goal: null,
        list, next: 0, basket: [], patience: PATIENCE_START, queuedAt: 0, timer: 0,
    };
    if (kind === 'furbetto') c.trick = rand(s) < 0.5 ? 'cut' : 'run';
    s.customers.push(c);
    return c;
}

function leave(s: GameState, c: Customer, w: Walkable, angry: boolean) {
    c.state = angry ? 'leaving_angry' : 'leaving';
    if (angry) {
        s.lostToday++;
        s.reputation = Math.max(0, s.reputation - REP_LOST);
    }
    const d = door(s);
    const path = d && findPath(w, c, d);
    c.goal = { kind: 'door' };
    c.path = path ?? [];
    if (!path) c.x = Number.NaN; // door gone: vanish (removed below)
}

/** Look for the next list item; when the list is done, head to a till (or leave angry). */
function nextGoal(s: GameState, c: Customer, w: Walkable) {
    for (; c.next < c.list.length; c.next++) {
        const cat = c.list[c.next];
        let best: { shelf: ShopObject; path: Cell[] } | null = null;
        for (const shelf of s.objects) {
            if (shelf.category !== cat || !shelf.stock) continue;
            const counter = !!SERVED_BY[shelf.type]; // deli counter, oven: queue and wait to be served
            if (counter && !cashierAt(s, shelf)) continue; // nobody behind it
            const path = pathToObject(w, c, shelf);
            if (path && (!best || path.length < best.path.length)) best = { shelf, path };
        }
        if (best) {
            c.goal = { kind: SERVED_BY[best.shelf.type] ? 'till' : 'shelf', id: best.shelf.id }; // the counter has a queue, like a till
            c.path = best.path;
            return;
        }
        c.patience -= PATIENCE_MISSING; // missing or empty: annoyed, skip it
    }
    if (c.kind === 'ispettore') {
        inspect(s);
        return leave(s, c, w, false);
    }
    const t = c.basket.length ? pickTill(s, w, c) : null;
    if (!t) return leave(s, c, w, true);
    c.goal = { kind: 'till', id: t.till.id };
    c.path = t.path;
}

/** The inspector leaves: a fine per spill on the floor, or a reputation bonus for a spotless shop. */
function inspect(s: GameState) {
    const fine = s.spills.length * INSPECTION_FINE;
    const rep = fine ? 0 : INSPECTION_BONUS;
    s.money -= fine;
    s.reputation = Math.min(100, s.reputation + rep);
    s.inspection = { fine, rep };
}

function arrive(s: GameState, c: Customer, w: Walkable) {
    const g = c.goal;
    if (!g) return nextGoal(s, c, w);
    if (g.kind === 'shelf') {
        const shelf = s.objects.find((o) => o.id === g.id);
        if (c.kind === 'ispettore') { /* looks, writes, buys nothing */ } else if (shelf?.stock) {
            shelf.stock--;
            c.basket.push(shelf.category!);
            if (s.carts.length < CART_MAX && rand(s) < CART_CHANCE) s.carts.push({ id: s.nextId++, x: c.x, y: c.y }); // left the cart here
        } else c.patience -= PATIENCE_MISSING; // emptied while walking there
        c.next++;
        c.goal = null;
        return nextGoal(s, c, w);
    }
    if (g.kind === 'till') {
        const atTill = s.objects.find((o) => o.id === g.id)?.type === 'cassa';
        if (atTill && c.trick === 'run') return leave(s, c, w, false); // off with the goods
        c.state = 'queueing';
        c.queuedAt = s.queueSeq++;
        if (atTill && c.trick === 'cut') {
            const line = s.customers.filter((o) => o !== c && o.state === 'queueing' && o.goal?.kind === 'till' && o.goal.id === g.id);
            for (const o of line) o.patience -= PATIENCE_CUT;
            c.queuedAt = Math.min(c.queuedAt, ...line.map((o) => o.queuedAt)) - 1; // straight to the front
        }
        return;
    }
    if (c.trick === 'run') {
        s.reputation = Math.max(0, s.reputation - FURB_REP_LOSS);
        s.furbetti.escaped++;
    }
    c.x = Number.NaN; // reached the door: gone
}

/** Re-plan from the cell the customer stands on (mid-step: the nearest one), keeping the walk continuous. */
function replan(c: Customer, plan: () => void) {
    const at = { x: Math.round(c.x), y: Math.round(c.y) };
    const { x, y } = c;
    Object.assign(c, at, { path: [] });
    plan();
    if (Number.isNaN(c.x)) return;
    if (x !== at.x || y !== at.y) c.path.unshift(at);
    Object.assign(c, { x, y });
}

/** Line cells for a till: the cell customers reach it by from the door, then away from the till, turning when blocked. */
function queueCells(s: GameState, w: Walkable, till: ShopObject, n: number): Cell[] {
    const d = door(s);
    const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: till.x + dx, y: till.y + dy })).filter((c) => w(c.x, c.y));
    // ponytail: A* from the door per till per tick while someone queues; cache per layout change if lots get big
    const front = (d && pathToObject(w, d, till)?.slice(-1)[0]) || adj[0];
    if (!front) return [];
    const cells = [front];
    const used = new Set([`${front.x},${front.y}`]);
    const [dx, dy] = [front.x - till.x, front.y - till.y];
    for (let cur = front; cells.length < n; ) {
        const next = [[dx, dy], [dy, dx], [-dy, -dx]].map(([a, b]) => ({ x: cur.x + a, y: cur.y + b }))
            .find((c) => w(c.x, c.y) && !used.has(`${c.x},${c.y}`));
        if (!next) break; // no room: the rest share the last cell
        cells.push(next);
        used.add(`${next.x},${next.y}`);
        cur = next;
    }
    return cells;
}

/** Everyone at a till stands in line on their own cell: whoever is paying first, then by arrival. */
function lineUp(s: GameState, w: Walkable) {
    for (const till of s.objects.filter((o) => SERVED_BY[o.type])) {
        const rank = (c: Customer) => (c.state === 'queueing' ? 1 : 0);
        const line = s.customers
            .filter((c) => c.goal?.kind === 'till' && c.goal.id === till.id && c.state !== 'shopping')
            .sort((a, b) => rank(a) - rank(b) || a.queuedAt - b.queuedAt);
        if (!line.length) continue;
        const cells = queueCells(s, w, till, line.length);
        line.forEach((c, i) => {
            const to = cells[i] ?? cells[cells.length - 1];
            const end = c.path[c.path.length - 1] ?? c;
            if (c.state !== 'queueing' || !to || (end.x === to.x && end.y === to.y)) return;
            replan(c, () => (c.path = findPath(w, c, to) ?? []));
        });
    }
}

/** After the layout changes (build/demolish): customers re-plan from where they stand; with no way out they vanish. */
export function rerouteCustomers(s: GameState) {
    const w = walkableFor(s);
    for (const c of s.customers) {
        if (c.goal?.kind === 'till' && !s.objects.some((o) => c.goal?.kind === 'till' && o.id === c.goal.id)) c.state = 'shopping'; // till gone
        if (c.state === 'shopping') replan(c, () => { c.goal = null; nextGoal(s, c, w); });
        else if (c.state === 'leaving' || c.state === 'leaving_angry') replan(c, () => {
            const d = door(s);
            const p = d && findPath(w, c, d);
            if (p) c.path = p;
            else c.x = Number.NaN;
        });
    }
    s.customers = s.customers.filter((c) => !Number.isNaN(c.x));
}

/** At each staffed till, the front of the queue starts paying when the till is free and it is at the counter. */
function serveTills(s: GameState) {
    for (const till of s.objects.filter((o) => SERVED_BY[o.type])) {
        const cashier = cashierAt(s, till);
        if (!cashier) continue;
        if (wantsBreak(s, cashier)) continue; // closing for a break: no new customer
        const here = s.customers.filter((c) => c.goal?.kind === 'till' && c.goal.id === till.id);
        if (here.some((c) => c.state === 'paying' || c.state === 'ready')) continue;
        const front = here.filter((c) => c.state === 'queueing').sort((a, b) => a.queuedAt - b.queuedAt)[0];
        if (front && !front.path.length) {
            delete front.trick; // got away with jumping the queue
            front.state = 'paying';
            front.timer = (till.type === 'cassa' ? PAY_SEC : SLICE_SEC) / pace(cashier);
        }
    }
}

/** Done at a counter (deli, oven): the goods go in the basket and shopping goes on. false at a till. */
function sliced(s: GameState, c: Customer, w: Walkable) {
    const counter = s.objects.find((o) => c.goal?.kind === 'till' && o.id === c.goal.id);
    if (!counter?.category) return false;
    if (counter.stock) {
        counter.stock--;
        c.basket.push(counter.category);
    } else c.patience -= PATIENCE_MISSING;
    Object.assign(c, { state: 'shopping', goal: null, next: c.next + 1 });
    nextGoal(s, c, w);
    return true;
}

/** A furbetto caught in the act: jumping the queue, or running off with the goods. */
export const tricking = (c: Customer) => (c.trick === 'cut' && c.state === 'queueing') || (c.trick === 'run' && c.state === 'leaving');

/** Tapped: the furbetto pays up (and leaves), the shop gains reputation. */
export function catchFurbetto(s: GameState, c: Customer) {
    delete c.trick;
    checkout(s, c, 0);
    s.reputation = Math.min(100, s.reputation + FURB_REP_GAIN);
    s.furbetti.caught++;
}

/** The customer whose bill is ready at this till, waiting for the 💰 tap. */
export const readyAt = (s: GameState, tillId: number) =>
    s.customers.find((c) => c.state === 'ready' && c.goal?.kind === 'till' && c.goal.id === tillId);

/** Take the money (plus a tip when collected with a tap) and let the customer go. */
export function checkout(s: GameState, c: Customer, tip: number, w = walkableFor(s)) {
    const happyBear = c.kind === 'orso' && c.patience >= BEAR_HAPPY;
    const goods = Math.round(c.basket.reduce((sum, cat) => sum + PRICES[cat], 0) * CUSTOMER_TYPES[c.kind].pay);
    const paid = goods + tip + (happyBear ? BEAR_BONUS_MONEY : 0);
    s.money += paid;
    s.incomeToday += paid;
    s.servedTotal++;
    if (happyBear) s.happyBears++;
    s.reputation = Math.min(100, s.reputation + REP_SERVED + (happyBear ? BEAR_BONUS_REP : 0));
    const till = s.objects.find((o) => c.goal?.kind === 'till' && o.id === c.goal.id);
    const cashier = till && cashierAt(s, till);
    if (cashier && !tired(cashier)) c.patience = Math.min(PATIENCE_START, c.patience + TRAITS[cashier.trait].patienceBonus);
    s.servedToday++;
    leave(s, c, w, false);
}

export function updateCustomers(s: GameState) {
    s.spawnAcc += GAME_SEC_PER_STEP;
    const every = (spawnEveryMin(s.reputation) * 60) / (s.scent > 0 ? SCENT_BOOST : 1);
    if (s.spawnAcc >= every) {
        s.spawnAcc -= every;
        if (s.clockSec < (DAY_CLOSE_MIN - LAST_ARRIVAL_MIN) * 60) spawnCustomer(s);
    }
    if (s.day === INSPECTION_DAY && !s.inspection && s.clockSec >= INSPECTION_HOUR * 3600 && !s.customers.some((c) => c.kind === 'ispettore'))
        spawnCustomer(s, undefined, 'ispettore');
    if (!s.customers.length) return;

    serveTills(s);
    const carts = s.carts.length;
    const w = walkableFor(s);
    for (const c of s.customers) {
        const away = c.state === 'leaving' || c.state === 'leaving_angry';
        const type = CUSTOMER_TYPES[c.kind];
        if (c.state === 'queueing') c.patience -= PATIENCE_QUEUE_DRAIN * type.drain * STEP_S;
        else if (c.path.length && !away) c.patience -= PATIENCE_WALK_DRAIN * type.drain * STEP_S;
        if (!away && c.state !== 'paying' && c.state !== 'ready' && spillNear(s, c.x, c.y)) c.patience -= SPILL_DRAIN * type.drain * STEP_S;
        if (c.patience <= 0 && !away && c.kind !== 'ispettore' && c.state !== 'paying' && c.state !== 'ready') {
            leave(s, c, w, true);
            continue;
        }
        if (c.state === 'paying') {
            c.timer -= STEP_S;
            if (c.timer <= 0 && sliced(s, c, w)) continue;
            if (c.timer <= 0) {
                c.state = 'ready'; // bill done: waits for the 💰 tap
                c.timer = AUTO_COLLECT_SEC;
            }
            continue;
        }
        if (c.state === 'ready') {
            c.timer -= STEP_S;
            if (c.timer <= 0) checkout(s, c, 0, w); // nobody tapped: the cashier closes it, no tip
            continue;
        }
        if (c.state === 'queueing') {
            if (c.path.length) walk(c, CUSTOMER_SPEED * type.speed); // moving up the line
            continue;
        }
        if (c.path.length) {
            const left = c.path.length;
            walk(c, CUSTOMER_SPEED * type.speed);
            if (c.path.length < left) maybeSpill(s, c); // stepped onto a new cell
        } else arrive(s, c, w);
    }
    s.customers = s.customers.filter((c) => !Number.isNaN(c.x));
    if (s.carts.length > carts) return rerouteCustomers(s); // a cart now blocks the aisle: everyone re-plans
    lineUp(s, w); // after moving: whoever just reached a till already has their place in line
}
