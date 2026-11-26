// Frame names in public/assets/kit.json (built by tools/kit.py from art/sheets/).
import type { Category } from '../sim/state.ts';

export const SPRITES = {
    porta: 'porta',
    cassa: 'cassa',
    scaffale: 'scaffale',
    shelf: (c: Category) => `scaffale_${c}`,
    cliente: 'cliente',
    clienteArrabbiato: 'cliente_arrabbiato',
    cassiere: 'cassiere',
    cassiereSeduto: 'cassiere_seduto',
    magazziniere: 'magazziniere',
    magazziniereScatolone: 'magazziniere_scatolone',
};

/** kit.png frames are stored at 2x (tools/kit.py RES). */
export const KIT_SCALE = 0.5;
