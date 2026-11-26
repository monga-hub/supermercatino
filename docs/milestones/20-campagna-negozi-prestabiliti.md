# Milestone 20: Campagna a negozi prestabiliti

## Status

implemented (in attesa di playtest)

## Objective

Far entrare un giocatore nuovo nelle meccaniche una alla volta. Oggi la partita parte da un lotto vuoto con tutto disponibile: troppe cose insieme. Con la campagna ogni livello è un negozio inventato ma tipico italiano, con stanze e porta già costruite. Il giocatore piazza gli arredi, assume e ordina la merce per superare gli obiettivi. Ogni livello sblocca solo alcune meccaniche. È il lavoro che abilita i milestone 21 e 22: dati dei livelli, sblocchi e progressi sono quello che leggono.

## Scope

- `LEVELS` (in `src/sim/levels.ts`): per livello nome, mappa (stanze + porta + eventuali arredi fissi), soldi iniziali, giorni, obiettivi e sblocchi (oggetti, ruoli, tipi cliente, imprevisti), più il testo "Novità" del briefing.
- `createState(level)` applica la mappa. Con un livello attivo `buildRoom` è rifiutato, come `demolish` di stanze e porta (si demoliscono solo gli arredi piazzati dal giocatore).
- Sblocchi rispettati dalla sim: `check` rifiuta oggetti e assunzioni non sbloccati; i candidati sono solo dei ruoli sbloccati; i clienti nascono solo dei tipi sbloccati; macchie, carrelli, furbetti e ispezione solo se abilitati.
- `day.ts` e l'HUD usano obiettivi e giorni del livello attivo invece di `LEVEL`.
- Menu: "Campagna" apre la scelta del livello (sbloccati / lucchetto, ✓ ai vinti). Vincere sblocca il successivo, con il tasto "Livello successivo" sulla carta di vittoria. Progressi della campagna salvati in localStorage, a parte rispetto alla partita.
- La barra strumenti mostra solo stanze e oggetti sbloccati; nessun tasto stanza con livello attivo.
- "Negozio libero" = la partita attuale (lotto vuoto, tutto sbloccato, obiettivi di oggi), sbloccata dopo il livello 3.
- Livelli 1–3:
  1. **Alimentari da Pina** (piccolo, sala + casse + magazzino già pieno): scaffali, cassa, cassiere, tocco 💰. Solo signore. Niente imprevisti.
  2. **Minimarket Il Girasole**: + magazziniere, ordini merce, tocco 📦. Arrivano mamme e vecchiette.
  3. **Superette San Rocco**: + tutti i clienti normali, macchie, addetto pulizie, cestino.
- Bilanciamento con `output/levels-balance.ts` per livello (8 semi): con i tocchi si vince sempre, senza tocchi né staff giusto si perde.
- Salvataggi vecchi: si caricano come "Negozio libero".

## Out of scope

- Barra a gruppi, guida passo passo, fumetti "Novità" in partita → milestone 21.
- Livelli 4–7 → milestone 22.
- Stelle/punteggio per livello, classifiche.
- Espandere il negozio costruendo stanze nei livelli (decisione utente 2026-11-27: stanze fisse).

## Dependencies

- **Depends on:** 06 (obiettivi), 11 (salvataggio e menu), 19 (tutti i ruoli)
- **Blocks:** 21, 22

## Acceptance criteria

- [x] Un livello parte con stanze e porta della sua mappa; costruire o demolire stanze è rifiutato — test: `tests/levels.test.ts`
- [x] Oggetti e ruoli non sbloccati sono rifiutati e non compaiono tra i candidati — test: `tests/levels.test.ts`
- [x] Tipi cliente e imprevisti non sbloccati non compaiono mai — test: `tests/levels.test.ts`
- [x] Obiettivi e giorni vengono dal livello; vincere sblocca il successivo e il progresso sopravvive al ricaricamento — test: `tests/levels.test.ts`
- [x] Salvataggio vecchio → Negozio libero, gioca come prima — test: `tests/levels.test.ts`
- [x] Scelta livello, briefing con "Novità" e "Livello successivo" funzionano dal browser — test: `scripts/browser-test.mjs`
- [x] Livelli 1–3 vinti con i tocchi 8/8 — `output/levels-balance.ts`
- [ ] Il livello 1 si capisce senza spiegazioni — verified by user playtest

## Exit condition

L'utente apre "Campagna", gioca Alimentari da Pina con solo scaffali, cassa e cassiere, vince, passa al Minimarket e trova il magazziniere e gli ordini come novità.

## Test plan

- Test rossi: `tests/levels.test.ts` (mappa, sblocchi, obiettivi, progressi, compatibilità), poi browser.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`. I test esistenti usano `createState()` senza livello = Negozio libero, quindi non cambiano.

## Notes

- Decisioni utente 2026-11-27: ordine 20 → 21 → 22; negozi inventati tipici (niente marchi veri); stanze fisse, solo arredi; partita di oggi tenuta come "Negozio libero".
- Implementazione: `src/sim/levels.ts` (dati dei livelli, `allows`, `goalsOf`, `sellable`, progressi). `createState(level)`; `level: 0` = Negozio libero, quindi i test vecchi non cambiano. Gli sblocchi stanno nella sim: `check` (oggetti, ordini, stanze e porta fisse), `refillCandidates` (ruoli), `pickKind` e liste spesa (clienti e categorie vendibili), `maybeSpill`, carrelli, ispezione, stanchezza (feature `tiredness`, accesa dal livello 6).
- Livello 1: oltre a cassiere c'è anche il magazziniere (senza, gli scaffali da 10 si svuotano in un'ora e si perde 8/8). La merce però arriva da sola: magazzino pieno, niente ordini. Gli ordini arrivano al livello 2.
- Clienti per livello: 1 solo signore; 2 + mamme e vecchiette; 3 + giovani. Chiedono solo categorie vendibili nel negozio (Pasta, Frutta, Detersivi finché non ci sono frigo, bancone e forno).
- La camera inquadra le stanze del negozio, non tutto il lotto (zoom fino a 2×).
- Menu: Continua / Campagna / Negozio libero (dopo il livello 3). Campagna → lista livelli con ✓ e 🔒. Fine livello: Livello successivo / Rigioca o Riprova / Menu. Progressi in localStorage `supermercatino-campagna`.
- Bilanciamento (`output/levels-balance.ts`, 8 semi):

| Livello | Obiettivi | Con tocchi | Senza tocchi |
|---|---|---|---|
| 1 Alimentari da Pina (2 giorni) | €1500 · 55% · 80 | 8/8 (giorno 2) | 0/8 |
| 2 Minimarket Il Girasole (3 giorni) | €1800 · 60% · 150 | 8/8 (giorno 3) | 0/8 |
| 3 Superette San Rocco (4 giorni) | €2000 · 60% · 220 | 8/8 (giorno 3–4) | 0/8 |

- Al livello 3 con i tocchi si vince anche senza addetto pulizie e cestino (7/8): le macchie pesano poco. Da rivedere giocando.
