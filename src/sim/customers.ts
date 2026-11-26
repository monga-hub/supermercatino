// Customers: a small state machine per customer (shopping -> queueing -> paying -> leaving,
// or leaving_angry when patience runs out). Pure, deterministic (seeded RNG in state).
import {
    STEP_MS, GAME_MIN_PER_SEC, CATEGORIES, PRICES, SPAWN_EVERY_MIN, LIST_MIN, LIST_MAX, CUSTOMER_SPEED,
    PATIENCE_START, PATIENCE_QUEUE_DRAIN, PATIENCE_WALK_DRAIN, PATIENCE_MISSING, PAY_SEC,
} from './config.ts';
import { findPath, type Cell } from './path.ts';
import type { GameState, Customer, Category, ShopObject } from './state.ts';

const STEP_S = STEP_MS / 1000;
const GAME_SEC_PER_STEP = GAME_MIN_PER_SEC * 60 * STEP_S;
type Walkable = (x: number, y: number) => boolean;

/** mulberry32: next float in [0, 1) from the state's seed. */
function rand(s: GameState) {
    let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

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

/** Shortest path to any walkable cell next to object `o`. */
function pathToObject(w: Walkable, from: Cell, o: ShopObject): Cell[] | null {
    let best: Cell[] | null = null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const p = findPath(w, from, { x: o.x + dx, y: o.y + dy });
        if (p && (!best || p.length < best.length)) best = p;
    }
    return best;
}

const door = (s: GameState) => s.objects.find((o) => o.type === 'porta');

/** Reachable till with the shortest queue (then shortest walk). */
function pickTill(s: GameState, w: Walkable, from: Cell) {
    let best: { till: ShopObject; path: Cell[]; queue: number } | null = null;
    for (const till of s.objects.filter((o) => o.type === 'cassa')) {
        const path = pathToObject(w, from, till);
        if (!path) continue;
        const queue = s.customers.filter((c) => c.goal?.kind === 'till' && c.goal.id === till.id).length;
        if (!best || queue < best.queue || (queue === best.queue && path.length < best.path.length)) best = { till, path, queue };
    }
    return best;
}

/** New customer at the door. null if there is no door or no till reachable from it. */
export function spawnCustomer(s: GameState, list?: Category[]): Customer | null {
    const d = door(s);
    if (!d) return null;
    const w = walkableFor(s);
    if (!pickTill(s, w, d)) return null;
    if (!list) {
        const pool = [...CATEGORIES];
        const n = LIST_MIN + Math.floor(rand(s) * (LIST_MAX - LIST_MIN + 1));
        list = Array.from({ length: n }, () => pool.splice(Math.floor(rand(s) * pool.length), 1)[0]);
    }
    const c: Customer = {
        id: s.nextId++, state: 'shopping', x: d.x, y: d.y, path: [], goal: null,
        list, next: 0, basket: [], patience: PATIENCE_START, queuedAt: 0, timer: 0,
    };
    s.customers.push(c);
    return c;
}

function leave(s: GameState, c: Customer, w: Walkable, angry: boolean) {
    c.state = angry ? 'leaving_angry' : 'leaving';
    if (angry) s.lostToday++;
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

function walk(c: Customer) {
    const step = CUSTOMER_SPEED * STEP_S;
    const n = c.path[0];
    const dx = n.x - c.x, dy = n.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d <= step) {
        c.x = n.x;
        c.y = n.y;
        c.path.shift();
    } else {
        c.x += (dx / d) * step;
        c.y += (dy / d) * step;
    }
}

/** Front of each till's queue starts paying when the till is free. */
function serveTills(s: GameState) {
    for (const till of s.objects.filter((o) => o.type === 'cassa')) {
        const here = s.customers.filter((c) => c.goal?.kind === 'till' && c.goal.id === till.id);
        if (here.some((c) => c.state === 'paying')) continue;
        const front = here.filter((c) => c.state === 'queueing').sort((a, b) => a.queuedAt - b.queuedAt)[0];
        if (front) {
            front.state = 'paying';
            front.timer = PAY_SEC;
        }
    }
}

export function updateCustomers(s: GameState) {
    s.spawnAcc += GAME_SEC_PER_STEP;
    if (s.spawnAcc >= SPAWN_EVERY_MIN * 60) {
        s.spawnAcc -= SPAWN_EVERY_MIN * 60;
        spawnCustomer(s);
    }
    if (!s.customers.length) return;

    serveTills(s);
    const w = walkableFor(s);
    for (const c of s.customers) {
        const away = c.state === 'leaving' || c.state === 'leaving_angry';
        if (c.state === 'queueing') c.patience -= PATIENCE_QUEUE_DRAIN * STEP_S;
        else if (c.path.length && !away) c.patience -= PATIENCE_WALK_DRAIN * STEP_S;
        if (c.patience <= 0 && !away && c.state !== 'paying') {
            leave(s, c, w, true);
            continue;
        }
        if (c.state === 'paying') {
            c.timer -= STEP_S;
            if (c.timer <= 0) {
                s.money += c.basket.reduce((sum, cat) => sum + PRICES[cat], 0);
                s.servedToday++;
                leave(s, c, w, false);
            }
            continue;
        }
        if (c.state === 'queueing') continue;
        if (c.path.length) walk(c);
        else arrive(s, c, w);
    }
    s.customers = s.customers.filter((c) => !Number.isNaN(c.x));
}
