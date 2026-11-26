# Milestone 20: Campagna a negozi prestabiliti

## Status

planned

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
- Bilanciamento con `output/balance.ts` per livello (8 semi): con i tocchi si vince sempre, senza tocchi né staff giusto si perde.
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

- [ ] Un livello parte con stanze e porta della sua mappa; costruire o demolire stanze è rifiutato — test: `tests/levels.test.ts`
- [ ] Oggetti e ruoli non sbloccati sono rifiutati e non compaiono tra i candidati — test: `tests/levels.test.ts`
- [ ] Tipi cliente e imprevisti non sbloccati non compaiono mai — test: `tests/levels.test.ts`
- [ ] Obiettivi e giorni vengono dal livello; vincere sblocca il successivo e il progresso sopravvive al ricaricamento — test: `tests/levels.test.ts`
- [ ] Salvataggio vecchio → Negozio libero, gioca come prima — test: `tests/levels.test.ts`
- [ ] Scelta livello, briefing con "Novità" e "Livello successivo" funzionano dal browser — test: `scripts/browser-test.mjs`
- [ ] Livelli 1–3 vinti con i tocchi 8/8 — `output/balance.ts`
- [ ] Il livello 1 si capisce senza spiegazioni — verified by user playtest

## Exit condition

L'utente apre "Campagna", gioca Alimentari da Pina con solo scaffali, cassa e cassiere, vince, passa al Minimarket e trova il magazziniere e gli ordini come novità.

## Test plan

- Test rossi: `tests/levels.test.ts` (mappa, sblocchi, obiettivi, progressi, compatibilità), poi browser.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`. I test esistenti usano `createState()` senza livello = Negozio libero, quindi non cambiano.

## Notes

- Decisioni utente 2026-11-27: ordine 20 → 21 → 22; negozi inventati tipici (niente marchi veri); stanze fisse, solo arredi; partita di oggi tenuta come "Negozio libero".
