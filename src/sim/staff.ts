// Staff: candidates, hiring, and per-role behaviour. Pure, deterministic.
import { ROLES, TRAITS, STAFF_NAMES, CANDIDATES_PER_ROLE, WAGE_SPREAD, STAFF_SPEED } from './config.ts';
import { rand, pick } from './rng.ts';
import { pathToObject, walk, type Walkable } from './path.ts';
import type { GameState, Role, Trait, Staff, ShopObject } from './state.ts';

/** Top up the candidate list to CANDIDATES_PER_ROLE per role. */
export function refillCandidates(s: GameState) {
    for (const role of Object.keys(ROLES) as Role[]) {
        while (s.candidates.filter((c) => c.role === role).length < CANDIDATES_PER_ROLE) {
            const trait = pick(s, Object.keys(TRAITS) as Trait[]);
            const wage = TRAITS[trait].wage + Math.round((rand(s) * 2 - 1) * WAGE_SPREAD);
            s.candidates.push({ id: s.nextId++, role, name: pick(s, STAFF_NAMES), trait, wage });
        }
    }
}

/** Move a candidate into the staff; they enter from the door. Caller validates the id. */
export function hire(s: GameState, candidateId: number) {
    const c = s.candidates.splice(s.candidates.findIndex((x) => x.id === candidateId), 1)[0];
    const door = s.objects.find((o) => o.type === 'porta');
    s.staff.push({ ...c, state: 'arriving', x: door?.x ?? 0, y: door?.y ?? 0, path: [], tillId: null });
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
    return (x, y) => open.has(`${x},${y}`);
}

/** The cashier seated at this till, if any. */
export const cashierAt = (s: GameState, till: ShopObject) =>
    s.staff.find((st) => st.role === 'cassiere' && st.state === 'at_till' && st.tillId === till.id);

function updateCashier(s: GameState, st: Staff, w: Walkable) {
    let till = s.objects.find((o) => o.id === st.tillId && o.type === 'cassa');
    if (st.state === 'at_till' && till) return;
    if (!till) {
        // ponytail: idle cashiers re-search every tick; cache per layout change if lots get big
        const taken = new Set(s.staff.filter((o) => o !== st).map((o) => o.tillId));
        let best: { till: ShopObject; path: ReturnType<typeof pathToObject> } | null = null;
        for (const t of s.objects) {
            if (t.type !== 'cassa' || taken.has(t.id)) continue;
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

export function updateStaff(s: GameState) {
    if (!s.staff.length) return;
    const w = walkableFor(s);
    for (const st of s.staff) if (st.role === 'cassiere') updateCashier(s, st, w);
}
