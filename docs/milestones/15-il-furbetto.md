# Milestone 15: Il Furbetto

## Status

planned

## Objective

L'ultimo tipo di cliente del gameplan: il Furbetto, che salta la fila o esce senza pagare. Il giocatore lo becca con un tocco.

## Scope

- Tipo cliente `furbetto` (raro): arrivato alla cassa si mette davanti a chi è in fila (chi viene scavalcato perde pazienza); a volte invece esce senza pagare.
- Icona 👮 sopra il furbetto mentre fa il furbo: toccandolo lo becchi (paga, +reputazione). Se scappa: incasso perso e un po' di reputazione giù.
- Sprite Gemini: foglio furbetto 3×3 (camminata, si infila, scappa con la merce).

## Out of scope

- Guardia/vigilante come ruolo staff (backlog), telecamere.

## Dependencies

- **Depends on:** 08 (fila), 10 (tipi cliente), 05b (tocchi)
- **Blocks:** nessuno

## Acceptance criteria

- [ ] Il furbetto salta la fila e chi è scavalcato perde pazienza — test: `tests/furbetto.test.ts`
- [ ] Toccato paga e la reputazione sale; se scappa niente incasso e reputazione giù — test: `tests/furbetto.test.ts`
- [ ] Frame del furbetto e dell'icona nel kit — test: `tests/assets.test.ts`
- [ ] Bilanciamento: il livello si vince ancora entro 5 giorni — `output/balance.ts`
- [ ] Il furbetto si riconosce e beccarlo dà soddisfazione — verified by user playtest

## Exit condition

L'utente vede un cliente che si infila davanti alla fila, lo tocca e lo vede pagare con il messaggio "Beccato!".

## Test plan

- Test rossi: `tests/furbetto.test.ts`.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes
