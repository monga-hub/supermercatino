// Customers: a small state machine per customer (shopping -> queueing -> paying -> leaving,
// or leaving_angry when patience runs out). Pure, deterministic (seeded RNG in state).
import {
    STEP_MS, GAME_MIN_PER_SEC, CATEGORIES, PRICES, CUSTOMER_TYPES, CUSTOMER_SPEED, BEAR_HAPPY, BEAR_BONUS_MONEY, BEAR_BONUS_REP,
    PATIENCE_START, PATIENCE_QUEUE_DRAIN, PATIENCE_WALK_DRAIN, PATIENCE_MISSING, PAY_SEC, TRAITS, AUTO_COLLECT_SEC,
    DAY_CLOSE_MIN, LAST_ARRIVAL_MIN, REP_SERVED, REP_LOST,
} from './config.ts';
import { findPath, pathToObject, walk, type Cell, type Walkable } from './path.ts';
import { rand } from './rng.ts';
import { cashierAt } from './staff.ts';
import { spawnEveryMin } from './day.ts';
import type { GameState, Customer, CustomerKind, Category, ShopObject } from './state.ts';

const STEP_S = STEP_MS / 1000;
const GAME_SEC_PER_STEP = GAME_MIN_PER_SEC * 60 * STEP_S;

/** Customers walk on sales floor and checkout cells; objects block, except the door. */
export function walkableFor(s: GameState): Walkable {
    const open = new Set<string>();
    for (const r of s.rooms) {
        if (r.type === 'magazzino') continue;
        for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) open.add(`${x},${y}`);
    }
    for (const o of s.objects) if (o.type !== 'porta') open.delete(`${o.x},${o.y}`);
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
            if (shelf.type !== 'scaffale' || shelf.category !== cat || !shelf.stock) continue;
            const path = pathToObject(w, c, shelf);
            if (path && (!best || path.length < best.path.length)) best = { shelf, path };
        }
        if (best) {
            c.goal = { kind: 'shelf', id: best.shelf.id };
            c.path = best.path;
            return;
        }
        c.patience -= PATIENCE_MISSING; // missing or empty: annoyed, skip it
    }
    const t = c.basket.length ? pickTill(s, w, c) : null;
    if (!t) return leave(s, c, w, true);
    c.goal = { kind: 'till', id: t.till.id };
    c.path = t.path;
}

function arrive(s: GameState, c: Customer, w: Walkable) {
    const g = c.goal;
    if (!g) return nextGoal(s, c, w);
    if (g.kind === 'shelf') {
        const shelf = s.objects.find((o) => o.id === g.id);
        if (shelf?.stock) {
            shelf.stock--;
            c.basket.push(shelf.category!);
        } else c.patience -= PATIENCE_MISSING; // emptied while walking there
        c.next++;
        c.goal = null;
        return nextGoal(s, c, w);
    }
    if (g.kind === 'till') {
        c.state = 'queueing';
        c.queuedAt = s.queueSeq++;
        return;
    }
    c.x = Number.NaN; // reached the door: gone
}

/** At each staffed till, the front of the queue starts paying when the till is free. */
function serveTills(s: GameState) {
    for (const till of s.objects.filter((o) => o.type === 'cassa')) {
        const cashier = cashierAt(s, till);
        if (!cashier) continue;
        const here = s.customers.filter((c) => c.goal?.kind === 'till' && c.goal.id === till.id);
        if (here.some((c) => c.state === 'paying' || c.state === 'ready')) continue;
        const front = here.filter((c) => c.state === 'queueing').sort((a, b) => a.queuedAt - b.queuedAt)[0];
        if (front) {
            front.state = 'paying';
            front.timer = PAY_SEC / TRAITS[cashier.trait].speed;
        }
    }
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
    if (cashier) c.patience = Math.min(PATIENCE_START, c.patience + TRAITS[cashier.trait].patienceBonus);
    s.servedToday++;
    leave(s, c, w, false);
}

export function updateCustomers(s: GameState) {
    s.spawnAcc += GAME_SEC_PER_STEP;
    const every = spawnEveryMin(s.reputation) * 60;
    if (s.spawnAcc >= every) {
        s.spawnAcc -= every;
        if (s.clockSec < (DAY_CLOSE_MIN - LAST_ARRIVAL_MIN) * 60) spawnCustomer(s);
    }
    if (!s.customers.length) return;

    serveTills(s);
    const w = walkableFor(s);
    for (const c of s.customers) {
        const away = c.state === 'leaving' || c.state === 'leaving_angry';
        const type = CUSTOMER_TYPES[c.kind];
        if (c.state === 'queueing') c.patience -= PATIENCE_QUEUE_DRAIN * type.drain * STEP_S;
        else if (c.path.length && !away) c.patience -= PATIENCE_WALK_DRAIN * type.drain * STEP_S;
        if (c.patience <= 0 && !away && c.state !== 'paying' && c.state !== 'ready') {
            leave(s, c, w, true);
            continue;
        }
        if (c.state === 'paying') {
            c.timer -= STEP_S;
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
        if (c.state === 'queueing') continue;
        if (c.path.length) walk(c, CUSTOMER_SPEED * type.speed);
        else arrive(s, c, w);
    }
    s.customers = s.customers.filter((c) => !Number.isNaN(c.x));
}
