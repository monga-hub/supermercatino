// Level 1 guide and first-time "Novità" bubbles (milestone 21). Pure: the HUD shows them.
import { TAP_ICON_BELOW, DAY_OPEN_MIN } from './config.ts';
import { readyAt, tricking } from './customers.ts';
import { tired } from './staff.ts';
import type { GameState } from './state.ts';
import type { Progress } from './levels.ts';

/** What the HUD arrow points at for a step. */
export type Aim = 'scaffale' | 'cassa' | 'staff' | 'play' | 'collect' | 'restock';
export type Step = { text: string; aim: Aim; done: (s: GameState) => boolean };

const count = (s: GameState, type: string) => s.objects.filter((o) => o.type === type);
const has = (s: GameState, role: string) => s.staff.some((st) => st.role === role);

export const GUIDE: Step[] = [
    { text: 'Apri Arredi e metti uno scaffale nella sala (pavimento a scacchi).', aim: 'scaffale', done: (s) => count(s, 'scaffale').length > 0 },
    { text: 'Metti un altro scaffale con un\'altra merce: i clienti chiedono di tutto.', aim: 'scaffale', done: (s) => new Set(count(s, 'scaffale').map((o) => o.category)).size > 1 },
    { text: 'Metti la cassa nell\'area casse (pavimento verde).', aim: 'cassa', done: (s) => count(s, 'cassa').length > 0 },
    { text: 'Apri Staff e assumi un cassiere: senza di lui la cassa non serve.', aim: 'staff', done: (s) => has(s, 'cassiere') },
    { text: 'Assumi anche un magazziniere: riempie gli scaffali dal magazzino.', aim: 'staff', done: (s) => has(s, 'magazziniere') },
    { text: 'Tutto pronto! Premi 1x per aprire il negozio.', aim: 'play', done: (s) => s.day > 1 || s.clockSec > DAY_OPEN_MIN * 60 },
    { text: 'Quando sulla cassa compare 💰, toccalo: incassi subito, con la mancia.', aim: 'collect', done: (s) => !!s.taps.collect },
    { text: 'Quando uno scaffale si svuota compare 📦: toccalo e il magazziniere corre.', aim: 'restock', done: (s) => !!s.taps.restock },
];

/** Index of the guide's current step (the first not done), or -1: finished, or not level 1. */
export const guideStep = (s: GameState) => (s.level === 1 ? GUIDE.findIndex((st) => !st.done(s)) : -1);

/** First-time bubbles: the first moment each mechanic shows up in a game. */
export const NEWS: { key: string; text: string; when: (s: GameState) => boolean }[] = [
    { key: 'collect', text: 'Conto pronto! Tocca 💰 sulla cassa: incassi subito, con la mancia.', when: (s) => count(s, 'cassa').some((o) => readyAt(s, o.id)) },
    { key: 'restock', text: 'Uno scaffale si svuota: tocca 📦 e il magazziniere lo riempie per primo.', when: (s) => s.objects.some((o) => o.category && o.type !== 'forno' && o.stock! < TAP_ICON_BELOW) },
    { key: 'spill', text: 'Una macchia di yogurt! I clienti si arrabbiano: toccala e l\'addetto pulizie corre.', when: (s) => s.spills.length > 0 },
    { key: 'cart', text: 'Un carrello abbandonato blocca il passaggio: toccalo e il magazziniere lo porta via.', when: (s) => s.carts.length > 0 },
    { key: 'furbetto', text: 'Un furbetto! Salta la fila o scappa senza pagare: toccalo per beccarlo.', when: (s) => s.customers.some(tricking) },
    { key: 'ispettore', text: 'L\'ispettore sanitario: ogni macchia per terra è una multa.', when: (s) => s.customers.some((c) => c.kind === 'ispettore') },
    { key: 'ponzone', text: 'Il signor Ponzone: paga di più, ma ha pochissima pazienza.', when: (s) => s.customers.some((c) => c.kind === 'ponzone') },
    { key: 'orso', text: 'Un orso! Servilo prima che si spazientisca: lascia un bel bonus.', when: (s) => s.customers.some((c) => c.kind === 'orso') },
    { key: 'pane', text: 'Pane appena sfornato: il profumo attira più clienti.', when: (s) => s.scent > 0 },
    { key: 'stanco', text: 'Qualcuno dello staff è stanco e lavora piano: con lo spogliatoio fa le pause.', when: (s) => s.staff.some(tired) },
];

/** The next "Novità" to show, if any. */
export const newsDue = (s: GameState, seen: string[]) => NEWS.find((n) => !seen.includes(n.key) && n.when(s)) ?? null;

export const markSeen = (p: Progress, key: string): Progress => (p.seen.includes(key) ? p : { ...p, seen: [...p.seen, key] });
