// Bakery (milestone 17): a staffed oven bakes bread in batches; fresh bread smell brings people in. Pure.
import { BAKE_MIN, BAKE_BATCH, SCENT_MIN, SHELF_CAPACITY, UNIT_COST, GAME_MIN_PER_SEC, STEP_MS } from './config.ts';
import { cashierAt } from './staff.ts';
import { cash } from './fx.ts';
import type { GameState } from './state.ts';

const STEP_GAME_S = (GAME_MIN_PER_SEC * 60 * STEP_MS) / 1000;

export function bake(s: GameState) {
    s.scent = Math.max(0, s.scent - STEP_GAME_S);
    for (const o of s.objects) {
        if (o.type !== 'forno' || !cashierAt(s, o)) continue;
        o.bake = (o.bake ?? 0) + STEP_GAME_S;
        if (o.bake < BAKE_MIN * 60) continue;
        o.bake = 0;
        const n = Math.min(BAKE_BATCH, SHELF_CAPACITY - o.stock!);
        if (!n) continue; // full: no batch, no smell
        o.stock! += n;
        s.money -= n * UNIT_COST.Pane;
        cash.on?.(-n * UNIT_COST.Pane, o.x, o.y);
        s.goodsToday += n * UNIT_COST.Pane;
        s.scent = SCENT_MIN * 60;
    }
}
