# Milestone 05b: Tocca per accelerare (ibrido)

## Status

done — playtest utente ok da telefono (2026-11-26)

## Objective

Rendere il gioco attivo sul telefono senza perdere il gestionale (ADR-0002). Il giocatore **tocca** per accelerare: uno scaffale che si svuota mostra un'icona 📦, toccandola entra nella coda di lavoro dei magazzinieri; quando un cliente ha finito alla cassa compare 💰, toccandola si incassa subito con una mancia. Senza tocchi il negozio va avanti da solo, ma più lento: il magazziniere rifornisce solo scaffali quasi vuoti, il cassiere chiude il conto da solo dopo qualche secondo.

## Scope

- Stato sim: `restockQueue` (id scaffali in coda, FIFO). Cliente nuovo stato `ready` (conto battuto, aspetta l'incasso).
- Comando `{ type: 'restock', shelfId }`: mette lo scaffale in coda. Errori: non è uno scaffale, già pieno, già in coda o in rifornimento, nessun magazziniere, niente merce di quella categoria in magazzino.
- Magazzinieri: prima la coda (in ordine), poi in automatico gli scaffali sotto `AUTO_RESTOCK_BELOW`. Più magazzinieri = più scaffali in parallelo (già così dal 05).
- Comando `{ type: 'collect', tillId }`: incassa il cliente `ready` a quella cassa con `TIP` di mancia. Senza tocco, dopo `AUTO_COLLECT_SEC` incasso automatico senza mancia. La cassa resta occupata finché il cliente è `ready`.
- UI: icone sopra gli oggetti (📦 scaffale sotto `TAP_ICON_BELOW`, ⏳ scaffale in coda o in rifornimento, 💰 cassa con cliente pronto). Un tocco sull'icona (o sull'oggetto, senza attrezzo attivo) manda il comando.
- Numeri in `config.ts`.

## Out of scope

- Capo reparto / potenziamenti che automatizzano del tutto (backlog).
- Animazioni e suoni dell'incasso.

## Dependencies

- **Depends on:** milestone 05
- **Blocks:** milestone 06 (gli obiettivi tengono conto di mance e tocchi)

## Acceptance criteria

- [x] Toccare uno scaffale lo mette in coda e il magazziniere lo rifornisce prima degli altri — test: `tests/taps.test.ts::tap queues shelf first`
- [x] Senza tocchi il magazziniere rifornisce solo sotto `AUTO_RESTOCK_BELOW` — test: `tests/taps.test.ts::auto restock only when almost empty`
- [x] `restock` rifiuta scaffale pieno, già in coda, senza magazziniere, senza merce — test: `tests/taps.test.ts::restock validation`
- [x] Toccare 💰 incassa subito con mancia; senza tocco incasso automatico dopo `AUTO_COLLECT_SEC` senza mancia — test: `tests/taps.test.ts::collect with tip` e `::auto collect without tip`
- [x] Nel browser, toccando l'icona 💰 sulla cassa i soldi salgono — test: `scripts/browser-test.mjs::tap icon collects`
- [x] Icone leggibili e facili da toccare su telefono — verified by user playtest

## Exit condition

L'utente gioca dal telefono: tocca 📦 su uno scaffale che si svuota e vede il magazziniere andarci subito; tocca 💰 sulla cassa e vede i soldi salire con la mancia; se non tocca niente, il negozio va avanti più lento.

## Test plan

- Test rossi: `tests/taps.test.ts`, poi `scripts/browser-test.mjs::tap icon collects`.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.
- Playtest da telefono.

## Notes

- Bilanciamento: `AUTO_COLLECT_SEC` 3 s (con 4 s una cassa sola senza tocchi perdeva metà dei clienti), `TIP` €1, `AUTO_RESTOCK_BELOW` 2, `TAP_ICON_BELOW` 5. Senza tocchi una cassa da sola non regge l'afflusso: o tocchi o apri una seconda cassa.
- Cambia AC del 03/05: il cliente ora passa da `ready` prima di uscire; il rifornimento automatico parte sotto `AUTO_RESTOCK_BELOW` (2) invece di 4.
