// Frame names in public/assets/kit.json (built by tools/kit.py from art/sheets/), and which one a character shows.
import type { Category, Customer, GameState, Staff } from '../sim/state.ts';
import { CUSTOMER_TYPES, GIVE_SEC, BOSS_EVERY_SEC, FEMALE_NAMES } from '../sim/config.ts';

export const SPRITES = {
    cassa: 'cassa',
    scaffale: 'scaffale',
    cestino: 'cestino',
    carrello: 'carrello',
    bancone: 'bancone',
    banconeVuoto: 'bancone_vuoto',
    armadietti: 'armadietti',
    forno: 'forno',
    fornoVuoto: 'forno_vuoto',
    frigo: 'frigo',
    frigoVuoto: 'frigo_vuoto',
    shelf: (c: Category) => `scaffale_${c}`,
    /** Warehouse pallet of a category (milestone 21). */
    stock: (c: Category) => `merce_${c}`,
};

/** Every character frame personFrame() can return (tests/assets.test.ts checks they exist). */
const walk = (n: string) => [0, 1, 2].map((i) => `${n}_${i}`);
export const PEOPLE_FRAMES = [
    ...Object.keys(CUSTOMER_TYPES).flatMap((k) => [...walk(`${k}_walk`), ...walk(`${k}_angry`), `${k}_idle`, `${k}_pay`]),
    ...['cassiere', 'cassiere_m'].flatMap((n) => [...walk(`${n}_walk`), `${n}_seduto`, `${n}_scan_0`, `${n}_scan_1`]),
    ...['magazziniere', 'magazziniera'].flatMap((n) => [...walk(`${n}_walk`), ...walk(`${n}_carry`)]),
    ...walk('pulizie_walk'), ...walk('pulizie_mop'),
    ...walk('banconiere_walk'), 'banconiere_idle', 'banconiere_slice_0', 'banconiere_slice_1', 'banconiere_give',
    ...walk('guardia_walk'), 'guardia_idle', 'guardia_fischio', 'guardia_ferma',
    ...walk('capo_walk'), 'capo_idle', 'capo_scrive', 'capo_indica',
];

/** Yogurt spills on the floor, picked by spill id (milestone 12). */
export const SPILL_FRAMES = ['macchia_0', 'macchia_1', 'macchia_2'];

/** Wall and door panels, one per back-edge orientation (tools/kit.py WALLS). */
export const WALL_FRAMES = ['muro', 'muro_finestra', 'muro_poster', 'muro_interno', 'porta', 'muretto', 'serranda'].flatMap((n) => [`${n}_l`, `${n}_r`]);

/** Tap icon badges (Game.drawIcons). */
export const ICON_FRAMES = ['icona_restock', 'icona_arrivo', 'icona_soldi', 'icona_pulisci', 'icona_carrello', 'icona_beccato', 'icona_pausa', 'icona_stanco'];

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
        const away = p.state === 'leaving_angry' || (p.trick === 'run' && p.state === 'leaving'); // the furbetto's row 2: running off
        return `${p.kind}_${away ? 'angry' : 'walk'}_${step(p)}`;
    }
    if (p.role === 'pulizie') return p.state === 'cleaning' ? `pulizie_mop_${CYCLE[Math.floor(s.clockSec / SCAN_SEC) % CYCLE.length]}` : `pulizie_walk_${step(p)}`;
    const she = FEMALE_NAMES.includes(p.name);
    if (p.role === 'magazziniere') return `${she ? 'magazziniera' : 'magazziniere'}_${p.job?.units ? 'carry' : 'walk'}_${step(p)}`;
    const who = p.role === 'cassiere' && !she ? 'cassiere_m' : p.role; // the red-smock lady, or the young man
    if (p.role === 'guardia' || p.role === 'capo') {
        if (p.path.length || p.state === 'arriving') return `${p.role}_walk_${step(p)}`;
        const w = p.wait ?? 0;
        if (p.role === 'guardia') return w > 0.75 ? 'guardia_ferma' : w > 0 ? 'guardia_fischio' : 'guardia_idle';
        return w > BOSS_EVERY_SEC - 0.6 ? 'capo_indica' : Math.floor(s.clockSec / (SCAN_SEC * 4)) % 2 ? 'capo_scrive' : 'capo_idle';
    }
    const deli = p.role === 'banconiere';
    if (p.state !== 'at_till') return `${who}_walk_${step(p)}`;
    const busy = s.customers.find((c) => c.state === 'paying' && c.goal?.kind === 'till' && c.goal.id === p.tillId);
    const pose = Math.floor(s.clockSec / SCAN_SEC) % 2;
    if (deli) return !busy ? 'banconiere_idle' : busy.timer < GIVE_SEC ? 'banconiere_give' : `banconiere_slice_${pose}`;
    return busy ? `${who}_scan_${pose}` : `${who}_seduto`;
}
