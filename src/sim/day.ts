// Opening hours, day end, reputation and level outcome (milestone 06). Pure, deterministic.
import {
    ENERGY_MAX,     DAY_OPEN_MIN, DAILY_RENT, SPAWN_EVERY_MIN_AT_0, SPAWN_EVERY_MIN_AT_100, BANKRUPT_BELOW, BAD_DAYS,
    REP_MIN, SPILL_REP,
} from './config.ts';
import { checkout } from './customers.ts';
import { goalsOf } from './levels.ts';
import type { GameState } from './state.ts';

/** Minutes between arrivals: fewer at low reputation, more at high. */
export const spawnEveryMin = (rep: number) => SPAWN_EVERY_MIN_AT_0 + ((SPAWN_EVERY_MIN_AT_100 - SPAWN_EVERY_MIN_AT_0) * rep) / 100;

/** Closing: bills at the tills are closed, everyone else leaves; rent and wages paid; summary and outcome; pause. */
export function closeDay(s: GameState) {
    for (const c of [...s.customers]) if (c.state === 'paying' || c.state === 'ready') checkout(s, c, 0);
    s.customers = [];
    s.reputation = Math.max(0, s.reputation - SPILL_REP * s.spills.length); // dirt left on the floor
    const wages = s.staff.reduce((sum, st) => sum + st.wage, 0);
    s.money -= wages + DAILY_RENT;
    s.redDays = s.money < BANKRUPT_BELOW ? s.redDays + 1 : 0;
    s.lowRepDays = s.reputation < REP_MIN ? s.lowRepDays + 1 : 0;
    s.summary = {
        day: s.day, income: s.incomeToday, goods: s.goodsToday, wages, rent: DAILY_RENT,
        money: s.money, served: s.servedToday, lost: s.lostToday, reputation: s.reputation,
    };
    const { goals: g, days } = goalsOf(s);
    if (s.money >= g.money && s.reputation >= g.reputation && s.servedTotal >= g.served) s.outcome = { win: true, reason: 'Obiettivi raggiunti!' };
    else if (s.redDays >= BAD_DAYS) s.outcome = { win: false, reason: `Bancarotta: cassa in rosso per ${BAD_DAYS} chiusure di fila` };
    else if (s.lowRepDays >= BAD_DAYS) s.outcome = { win: false, reason: `Reputazione sotto il ${REP_MIN}% per ${BAD_DAYS} chiusure di fila: i clienti non vengono più` };
    else if (s.day >= days) s.outcome = { win: false, reason: 'Tempo scaduto: obiettivi non raggiunti' };
    s.paused = true;
}

/** Next morning, after the player closes the summary. */
export function nextDay(s: GameState) {
    s.day++;
    s.clockSec = DAY_OPEN_MIN * 60;
    s.servedToday = 0;
    s.lostToday = 0;
    s.incomeToday = 0;
    s.goodsToday = 0;
    s.summary = null;
    s.carts = []; // abandoned carts are put back overnight
    s.cartQueue = [];
    s.scent = 0;
    for (const st of s.staff) {
        st.energy = ENERGY_MAX; // a night's sleep
        if (st.state === 'resting') Object.assign(st, { state: 'idle', path: [] });
    }
    s.paused = false;
}
