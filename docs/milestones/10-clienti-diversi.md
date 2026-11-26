# Milestone 10: Clienti diversi

## Status

implemented — in attesa del playtest dell'utente

## Objective

Oltre alla signora entrano altri cinque tipi di clienti, ognuno disegnato e animato e con un carattere suo: la mamma col bambino, la vecchietta, il giovane, il Signor Ponzone e l'orso. Fare contento l'orso dà tanti punti (richiesta utente 2026-11-26).

## Scope

- `CUSTOMER_TYPES` in `src/sim/config.ts`: peso di arrivo, velocità, consumo di pazienza, lunghezza della lista, moltiplicatore di prezzo.
  - Signora: la base.
  - Mamma col bambino: lista lunga (2-4), un po' lenta e impaziente.
  - Vecchietta: lentissima ma pazientissima, lista corta.
  - Giovane: veloce e impaziente, lista corta.
  - Signor Ponzone: paga il 50% in più ma perde la pazienza in fretta.
  - Orso: raro, lista lunga (3-5). Se esce contento (pazienza ≥ 50 alla cassa) dà +€60 e +6 di reputazione, con un messaggio a schermo.
- `Customer.kind`, scelto a caso all'arrivo (RNG del gioco). `spawnCustomer(s, list, kind)` per i test.
- Un foglio Gemini 3×3 per tipo (`art/sheets/<tipo>.jpg`, stesso schema del cliente: camminata, camminata arrabbiata, coda, paga, prende); frame `<tipo>_*`. Il vecchio foglio `cliente.jpg` diventa la signora.

## Out of scope

- Preferenze di categoria per tipo, gruppi che entrano insieme, dialoghi.

## Dependencies

- **Depends on:** 07b (animazioni), 09
- **Blocks:** nessuno

## Acceptance criteria

- [x] Arrivano tutti i tipi, l'orso è il più raro; le liste rispettano il tipo — test: `tests/types.test.ts`
- [x] Il giovane cammina più veloce della vecchietta; la vecchietta perde pazienza più piano del Signor Ponzone; Ponzone paga di più — test: `tests/types.test.ts`
- [x] L'orso contento dà il bonus, quello scontento no — test: `tests/types.test.ts`
- [x] Ogni tipo ha i suoi frame — test: `tests/assets.test.ts`, `tests/sprites.test.ts`
- [x] Bilanciamento: con 2 casse e i tocchi si vince ancora entro 5 giorni — `output/balance.ts` (vince al giorno 4)
- [ ] Si riconoscono i tipi e l'orso fa festa — verified by user playtest

## Exit condition

L'utente vede entrare clienti diversi e riconoscibili; quando serve bene l'orso compare il messaggio del bonus e i soldi salgono.

## Test plan

- Test rossi: `tests/types.test.ts`.
- Screenshot di tutti i tipi in negozio.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Fogli Gemini: prompt in `art/prompts.md`. Screenshot `output/shots-types.mjs`.
- "Signor Ponzone" interpretato come un signore pomposo e benestante.
