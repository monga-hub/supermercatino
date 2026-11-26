# Milestone 19: Guardia e capo reparto

## Status

planned

## Objective

Completare la curva di ADR-0002: all'inizio si tocca tutto, poi si paga per automatizzare. La guardia ferma i furbetti da sola, il capo reparto fa i tocchi su scaffali, casse, macchie e carrelli.

## Scope

- Ruolo `guardia`: sta vicino alle casse e becca da sola i furbetti in un raggio (stessa resa del tocco, senza mancia di reputazione extra o con metà bonus: da tarare).
- Ruolo `capo reparto` (caro): ogni pochi secondi fa da solo il tocco più urgente (scaffale quasi vuoto, conto pronto, macchia, carrello). I tocchi del giocatore restano possibili e più rapidi.
- Pannello Staff: i nuovi ruoli tra i candidati.
- Sprite Gemini: guardia (divisa anni '80, cappello) e capo reparto (camicia, cravatta, cartellina), 3×2 come gli altri.

## Out of scope

- Telecamere, potenziamenti acquistabili, alberi di abilità.

## Dependencies

- **Depends on:** 15 (furbetto), 05b (tocchi), 18 (pause dello staff)
- **Blocks:** nessuno

## Acceptance criteria

- [ ] La guardia vicino alle casse becca il furbetto senza tocco — test: `tests/automation.test.ts`
- [ ] Il capo reparto mette in coda scaffali, conti, macchie e carrelli come i tocchi — test: `tests/automation.test.ts`
- [ ] Senza tocchi ma con guardia e capo reparto il livello si vince entro 5 giorni (con i tocchi prima) — `output/balance.ts`
- [ ] Frame dei due nuovi ruoli nel kit — test: `tests/assets.test.ts`
- [ ] Assumere il capo reparto si sente come un sollievo, non come un obbligo — verified by user playtest

## Exit condition

L'utente assume guardia e capo reparto, smette di toccare e vede il negozio andare avanti da solo, un po' peggio che con i suoi tocchi.

## Test plan

- Test rossi: `tests/automation.test.ts`, poi assets.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes
