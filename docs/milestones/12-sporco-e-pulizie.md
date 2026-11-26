# Milestone 12: Sporco e pulizie

## Status

implemented — in attesa del playtest dell'utente

## Objective

Il passo "Reagisci" del gameplan: i clienti ogni tanto rovesciano lo yogurt, lo sporco fa arrabbiare chi ci passa vicino e il giocatore assume l'addetto pulizie (terzo ruolo) e mette cestini per tenere il negozio pulito.

## Scope

- **Sporco:** un cliente che cammina in sala ha una piccola probabilità per cella di lasciare una macchia (`s.spills`); la mamma col bambino di più. Massimo qualche macchia per cella e per negozio.
- **Effetto:** chi passa su una macchia o accanto perde pazienza; troppe macchie a fine giornata abbassano la reputazione.
- **Cestino:** oggetto economico per la sala vendita; vicino a un cestino le macchie nascono la metà delle volte.
- **Addetto pulizie:** ruolo `pulizie` con candidati e tratti come gli altri; va alla macchia più vecchia, pulisce in qualche secondo, poi la successiva.
- **Tocco:** icona dipinta 🧽 sulla macchia: toccandola l'addetto ci va per prima (come il 📦 sugli scaffali, ADR-0002).
- **Sprite Gemini:** foglio addetto pulizie (camminata ×3, lavaggio col mocio ×3), macchie di yogurt (2–3 varianti), cestino, icona pulisci.

## Out of scope

- Carrello incastrato e ispezione sanitaria (restano nel backlog), sporco nel magazzino.

## Dependencies

- **Depends on:** 05b (tocchi), 10
- **Blocks:** imprevisti (ispezione sanitaria)

## Acceptance criteria

- [x] I clienti lasciano macchie; vicino a un cestino ne lasciano meno — test: `tests/dirt.test.ts`
- [x] Passare vicino a una macchia fa perdere pazienza — test: `tests/dirt.test.ts`
- [x] L'addetto pulisce le macchie, prima quelle toccate — test: `tests/dirt.test.ts`
- [x] Frame di addetto, macchie, cestino e icona nel kit — test: `tests/assets.test.ts`
- [x] Bilanciamento: senza pulizie si fatica, con un addetto si vince ancora — `output/balance.ts` (2 casse e tocchi: senza addetto si perde a tempo scaduto, con l'addetto si vince al giorno 4)
- [ ] Lo sporco si vede e pulire dà soddisfazione — verified by user playtest

## Exit condition

L'utente vede comparire lo yogurt per terra e i clienti arrabbiarsi; assume l'addetto, tocca una macchia e lo vede correre a pulirla col mocio.

## Test plan

- Test rossi: `tests/dirt.test.ts`.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Sim in `src/sim/dirt.ts`; numeri in `config.ts` (SPILL_*, BIN_RADIUS, CLEAN_SEC). Le macchie restano la notte. Niente macchie sullo zerbino.
- Fogli Gemini `art/sheets/pulizie.jpg` (addetta col mocio) e `art/sheets/sporco.jpg` (3 macchie, cestino, icona spugna, cartello "pavimento bagnato" non ancora usato).
- I salvataggi del milestone 11 si caricano ancora (senza macchie).
- Screenshot: `output/shots-12.mjs`.
