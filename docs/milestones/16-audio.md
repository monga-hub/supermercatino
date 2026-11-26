# Milestone 16: Audio

## Status

planned

## Objective

Il supermercato si sente: musichetta anni '80 in sottofondo, bip della cassa, yogurt che cade e annunci comici all'altoparlante.

## Scope

- Muzak in loop, SFX (bip cassa, incasso, rovescio, carrello, orso contento), annunci all'altoparlante su eventi (cassa aperta, ispettore, chiusura).
- Tasto audio sì/no nell'HUD (ricordato nel salvataggio delle preferenze). Sul telefono l'audio parte al primo tocco (regola dei browser).
- Fonte dei suoni da decidere con l'utente all'inizio del milestone (open question del gameplan): generati con AI, CC0, o sintesi vocale per gli annunci.

## Out of scope

- Musica diversa per livello, doppiaggio dei personaggi.

## Dependencies

- **Depends on:** 11 (menu), 12–14 (eventi da far suonare)
- **Blocks:** nessuno

## Acceptance criteria

- [ ] Gli eventi del sim fanno partire il suono giusto — test: `tests/audio.test.ts` (mappa evento → suono, pura)
- [ ] Il tasto audio spegne e riaccende tutto e resta dopo il ricaricamento — test: `scripts/browser-test.mjs`
- [ ] File audio presenti e caricati senza errori — test: `scripts/browser-test.mjs`
- [ ] L'atmosfera è da supermercato anni '80 — verified by user playtest

## Exit condition

L'utente gioca sul telefono e sente la musichetta, il bip a ogni incasso e un annuncio comico; con il tasto spegne tutto.

## Test plan

- Test rossi: `tests/audio.test.ts`, poi browser.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes
