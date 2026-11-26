# Milestone 08: Rifiniture rapide

## Status

planned

## Objective

Togliere i piccoli fastidi emersi nei playtest prima di aggiungere contenuti: la fila alla cassa si vede, il livello parte in pausa, la camera inquadra il negozio, i clienti non attraversano più muri demoliti.

## Scope

- **Fila visibile:** chi aspetta alla cassa occupa celle libere in fila davanti alla cassa invece di sovrapporsi sulla stessa.
- **Partenza in pausa:** il livello inizia in pausa con un messaggio "Costruisci il negozio, poi premi 1x".
- **Camera:** a ogni avvio/ricomincia la camera inquadra il lotto intero adattando lo zoom allo schermo.
- **Percorsi dopo demolizione:** dopo ogni comando di costruzione/demolizione clienti e staff ricalcolano il percorso; chi non ha più strada esce (cliente) o si ferma (staff).

## Out of scope

- Contenuti nuovi (tipi cliente, stanze), salvataggio, audio.

## Dependencies

- **Depends on:** milestone 06
- **Blocks:** nessuno

## Acceptance criteria

- [ ] Clienti in fila alla stessa cassa stanno su celle diverse, il primo accanto alla cassa — test: `tests/queue.test.ts::queue on distinct cells`
- [ ] Il livello parte in pausa e resta in pausa finché il giocatore non sceglie una velocità — test: `tests/sim.test.ts::level starts paused` + browser
- [ ] Demolire lo scaffale o il pavimento verso cui un cliente cammina gli fa ricalcolare il percorso (o uscire) — test: `tests/customers.test.ts::reroute after demolish`
- [ ] All'avvio il lotto intero è visibile su telefono in verticale e orizzontale — screenshot + verified by user playtest

## Exit condition

L'utente apre il gioco dal telefono: vede tutto il lotto, il tempo è fermo finché non preme 1x; con la cassa lenta vede la fila allinearsi; se demolisce uno scaffale mentre un cliente ci va, il cliente cambia strada.

## Test plan

- Test rossi prima: `tests/queue.test.ts`, poi gli altri.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Promuove dal backlog: "Fila visibile", "Clienti e demolizioni", e le note di STATE.md (partenza in pausa, camera).
