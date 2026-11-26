// Audio cues (milestone 16): what changed in the sim between two frames → sounds and one loudspeaker line. Pure.
import { DAY_OPEN_MIN, DAY_CLOSE_MIN, INSPECTION_DAY } from '../sim/config.ts';
import type { GameState } from '../sim/state.ts';

export type Sound = 'bip' | 'splat' | 'carrello' | 'orso' | 'fischio' | 'vittoria' | 'sconfitta';

const OFFERS = [
    'Offerta speciale al reparto pasta: compri un pacco, lo paghi un pacco!',
    'Gentili clienti, è stato smarrito un bambino vicino ai detersivi. Si chiama Gianni, e risponde al nome di Gianni.',
    'Offerta del giorno: yogurt alla fragola, ora con ancora più fragola. Forse.',
    'Gentili clienti, il carrello numero dodici ha una ruota che va per conto suo. Prego non seguirla.',
    'Al reparto salumi, mortadella tagliata sottile sottile, come piace alla nonna.',
    'Gentili clienti, la signora con la permanente blu è attesa alla cassa: ha dimenticato il resto.',
];

export function snap(s: GameState) {
    return {
        day: s.day, clock: s.clockSec, served: s.servedTotal, spills: s.spills.length, carts: s.carts.length,
        bears: s.happyBears, ...s.furbetti, inspection: s.inspection, outcome: s.outcome,
        tills: s.staff.filter((p) => p.role === 'cassiere' && p.state === 'at_till').length,
    };
}
export type Snap = ReturnType<typeof snap>;

export function cues(a: Snap, b: Snap): { sounds: Sound[]; say: string | null } {
    const sounds: Sound[] = [];
    if (b.served > a.served) sounds.push('bip');
    if (b.spills > a.spills) sounds.push('splat');
    if (b.carts > a.carts) sounds.push('carrello');
    if (b.bears > a.bears) sounds.push('orso');
    if (b.caught > a.caught) sounds.push('fischio');
    if (b.outcome && !a.outcome) sounds.push(b.outcome.win ? 'vittoria' : 'sconfitta');

    const at = (min: number) => b.day === a.day && a.clock < min * 60 && b.clock >= min * 60;
    const i = b.inspection;
    const say =
        i && !a.inspection ? (i.fine ? `Comunicazione della direzione: multa di ${i.fine} euro per lo sporco. Che figura!` : 'Ispezione superata! La direzione ringrazia il personale delle pulizie.')
        : b.escaped > a.escaped ? 'Attenzione: un furbetto è scappato senza pagare. Il personale è pregato di stare più attento.'
        : b.tills > a.tills ? `Si apre la cassa numero ${b.tills}. Prego, avvicinarsi.`
        : at(DAY_OPEN_MIN) ? 'Buongiorno! Il Supermercatino è aperto.' + (b.day === INSPECTION_DAY ? ' Oggi passa l\'ispettore sanitario: occhio allo yogurt!' : '')
        : at(DAY_CLOSE_MIN - 30) ? 'Gentili clienti, il Supermercatino chiude tra mezz\'ora. Si prega di avvicinarsi alle casse.'
        : at(11 * 60) ? OFFERS[(b.day * 2) % OFFERS.length]
        : at(17 * 60) ? OFFERS[(b.day * 2 + 1) % OFFERS.length]
        : null;
    return { sounds, say };
}
