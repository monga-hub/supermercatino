# Milestone 12: Sporco e pulizie

## Status

planned

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

- [ ] I clienti lasciano macchie; vicino a un cestino ne lasciano meno — test: `tests/dirt.test.ts`
- [ ] Passare vicino a una macchia fa perdere pazienza — test: `tests/dirt.test.ts`
- [ ] L'addetto pulisce le macchie, prima quelle toccate — test: `tests/dirt.test.ts`
- [ ] Frame di addetto, macchie, cestino e icona nel kit — test: `tests/assets.test.ts`
- [ ] Bilanciamento: senza pulizie si fatica, con un addetto si vince ancora — `output/balance.ts`
- [ ] Lo sporco si vede e pulire dà soddisfazione — verified by user playtest

## Exit condition

L'utente vede comparire lo yogurt per terra e i clienti arrabbiarsi; assume l'addetto, tocca una macchia e lo vede correre a pulirla col mocio.

## Test plan

- Test rossi: `tests/dirt.test.ts`.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes
