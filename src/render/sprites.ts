// Frame names in public/assets/kit.json (built by tools/kit.py from art/sheets/), and which one a character shows.
import type { Category, Customer, GameState, Staff } from '../sim/state.ts';
import { CUSTOMER_TYPES, GIVE_SEC } from '../sim/config.ts';

export const SPRITES = {
    cassa: 'cassa',
    scaffale: 'scaffale',
    cestino: 'cestino',
    bancone: 'bancone',
    banconeVuoto: 'bancone_vuoto',
    shelf: (c: Category) => `scaffale_${c}`,
};

/** Every character frame personFrame() can return (tests/assets.test.ts checks they exist). */
const walk = (n: string) => [0, 1, 2].map((i) => `${n}_${i}`);
export const PEOPLE_FRAMES = [
    ...Object.keys(CUSTOMER_TYPES).flatMap((k) => [...walk(`${k}_walk`), ...walk(`${k}_angry`), `${k}_idle`, `${k}_pay`]),
    ...walk('cassiere_walk'), 'cassiere_seduto', 'cassiere_scan_0', 'cassiere_scan_1',
    ...walk('magazziniere_walk'), ...walk('magazziniere_carry'),
    ...walk('pulizie_walk'), ...walk('pulizie_mop'),
    ...walk('banconiere_walk'), 'banconiere_idle', 'banconiere_slice_0', 'banconiere_slice_1', 'banconiere_give',
];

/** Yogurt spills on the floor, picked by spill id (milestone 12). */
export const SPILL_FRAMES = ['macchia_0', 'macchia_1', 'macchia_2'];

/** Wall and door panels, one per back-edge orientation (tools/kit.py WALLS). */
export const WALL_FRAMES = ['muro', 'muro_poster', 'porta'].flatMap((n) => [`${n}_l`, `${n}_r`]);

/** Tap icon badges (Game.drawIcons). */
export const ICON_FRAMES = ['icona_restock', 'icona_arrivo', 'icona_soldi', 'icona_pulisci'];

/** kit.png frames are stored at 2x (tools/kit.py RES). */
export const KIT_SCALE = 0.5;

// Walk cycle locked to position (no sliding feet, frozen when paused): STRIDE frames per cell, poses 0-1-2-1.
const STRIDE = 4;
const CYCLE = [0, 1, 2, 1];
const step = (p: { x: number; y: number }) => CYCLE[Math.floor((p.x + p.y) * STRIDE) % CYCLE.length];
/** Game seconds per scan pose while a customer pays (GAME_MIN_PER_SEC 3: ~0.3 s real at 1x). */
const SCAN_SEC = 54;

/** Character frame for the sim state. Pure: tests/sprites.test.ts. */
export function personFrame(s: GameState, p: Customer | Staff): string {
    if (!('role' in p)) {
        if (p.state === 'queueing' && !p.path.length) return `${p.kind}_idle`;
        if (p.state === 'paying' || p.state === 'ready') return `${p.kind}_pay`;
        return `${p.kind}_${p.state === 'leaving_angry' ? 'angry' : 'walk'}_${step(p)}`;
    }
    if (p.role === 'pulizie') return p.state === 'cleaning' ? `pulizie_mop_${CYCLE[Math.floor(s.clockSec / SCAN_SEC) % CYCLE.length]}` : `pulizie_walk_${step(p)}`;
    if (p.role === 'magazziniere') return `magazziniere_${p.job?.units ? 'carry' : 'walk'}_${step(p)}`;
    const deli = p.role === 'banconiere';
    if (p.state !== 'at_till') return `${p.role}_walk_${step(p)}`;
    const busy = s.customers.find((c) => c.state === 'paying' && c.goal?.kind === 'till' && c.goal.id === p.tillId);
    const pose = Math.floor(s.clockSec / SCAN_SEC) % 2;
    if (deli) return !busy ? 'banconiere_idle' : busy.timer < GIVE_SEC ? 'banconiere_give' : `banconiere_slice_${pose}`;
    return busy ? `cassiere_scan_${pose}` : 'cassiere_seduto';
}
