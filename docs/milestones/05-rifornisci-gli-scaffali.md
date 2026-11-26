# Milestone 05: Rifornisci gli scaffali

## Status

done — playtest utente ok da telefono (2026-11-26)

## Objective

Terzo verbo del loop: "Rifornisci". Oggi uno scaffale vuoto resta vuoto per sempre. Il giocatore ordina merce per categoria, che arriva in magazzino; il **Magazziniere** la porta agli scaffali che si stanno svuotando. Così il negozio regge una giornata intera e nasce la tensione costo-merce/incasso.

## Scope

- Stato sim: `warehouse` (pezzi per categoria in magazzino).
- Comando `{ type: 'order', category }`: compra una cassa di N pezzi a costo unitario (da `config.ts`), consegnata subito in magazzino. Serve almeno una stanza magazzino.
- Ruolo **Magazziniere** nel sistema staff del 04 (candidati, assunzione, stipendio).
- Comportamento: se uno scaffale scende sotto una soglia e il magazzino ha la sua categoria, il magazziniere va in magazzino, prende un carico, lo porta allo scaffale e lo riempie fino alla capienza. Un magazziniere fa un giro alla volta.
- Capienza scaffale da `config.ts` (oggi stock iniziale fisso 10).
- UI: pannello **Merce** nell'HUD: per ogni categoria pezzi in magazzino, costo cassa, pulsante *Ordina*.
- Disegno: magazziniere con colore suo, cassa di merce in mano mentre trasporta; scatoloni in magazzino.

## Out of scope

- Consegne con ritardo, fornitori, prezzi variabili, merce che scade.
- Prezzi di vendita regolabili (domanda aperta, default fissi).

## Dependencies

- **Depends on:** milestone 04
- **Blocks:** milestone 06

## Acceptance criteria

- [x] `order` scala il costo e aggiunge pezzi al magazzino; senza magazzino o senza soldi → errore — test: `tests/restock.test.ts::order goes to warehouse`
- [x] Il magazziniere rifornisce uno scaffale sotto soglia fino alla capienza, scalando il magazzino — test: `tests/restock.test.ts::stocker refills low shelf`
- [x] Senza merce in magazzino il magazziniere non parte; senza magazziniere nessun rifornimento — test: `tests/restock.test.ts::no stock or no stocker no refill`
- [x] Nel browser, con magazziniere e merce ordinata, dopo mezza giornata gli scaffali non sono vuoti — test: `scripts/browser-test.mjs::shelves get restocked`
- [x] Pannello Merce chiaro su telefono, trasporto della merce visibile — verified by user playtest

## Exit condition

L'utente costruisce un magazzino, assume un magazziniere, ordina Pasta → quando lo scaffale Pasta si svuota l'omino va in magazzino, torna con la merce e lo scaffale si riempie.

## Test plan

- Test rossi: `tests/restock.test.ts`, poi `scripts/browser-test.mjs::shelves get restocked`.
- Playtest da telefono.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Promuove dal backlog: "Rifornimento".
- Implementato: `ORDER_UNITS` 20 pezzi per cassa, `UNIT_COST` circa metà prezzo di vendita, `RESTOCK_BELOW` 4, `SHELF_CAPACITY` 10 (tutto in `config.ts`). Il tratto del magazziniere cambia la velocità di camminata.
- I pannelli Staff e Merce ora scorrono col dito e stanno tra barra in alto e toolbar (su telefono orizzontale non ci stavano). Nomi dei candidati senza doppioni.
