# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 04

## Current phase

development (scaffold completato)

## Current milestone

[05 — Rifornisci gli scaffali](milestones/05-rifornisci-gli-scaffali.md) (da iniziare). 04 chiuso. Poi 06 Fine giornata e obiettivi; sprite AI dopo il 06.

## Last action

Milestone 04 implementato: candidati generati dalla seed (3 per ruolo, tratti Normale/Svelto/Chiacchierone), comandi `hire`/`fire`, cassiere che entra e si siede alla cassa, casse che servono solo con cassiere, velocità di pagamento per tratto, stipendi a fine giornata; pannello Staff nell'HUD. Test: `npm test` 23/23, `npm run test:browser` 6/6. Playtest utente ok. Poi, su richiesta utente: stanze di qualsiasi misura (niente minimo), stanze dello stesso tipo affiancate formano un'unica area; la porta va sul bordo dell'area intera.

## Next step

Milestone 05 (Rifornisci gli scaffali): test rossi `tests/restock.test.ts`, poi implementazione.

## Blockers

none

## Notes for next session

- Con 10 pezzi per scaffale e un cliente ogni 10 minuti di gioco, gli scaffali si svuotano in ~3 ore di gioco: voluto (niente rifornimento fino allo staff), ma da tarare.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
