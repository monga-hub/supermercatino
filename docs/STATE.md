# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 03

## Current phase

development (scaffold completato)

## Current milestone

[04 — Assumi il cassiere](milestones/04-assumi-il-cassiere.md) (in-progress). Poi 05 Rifornisci gli scaffali, 06 Fine giornata e obiettivi; sprite AI dopo il 06.

## Last action

Milestone 03 chiuso (utente passato al punto successivo). Milestone planning: scritti 04, 05, 06; backlog aggiornato (staff, rifornimento, economia, reputazione, obiettivi promossi); sprite AI spostati dopo il 06 (gameplan aggiornato).

## Next step

Milestone 04: test rossi in `tests/staff.test.ts`, poi sistema candidati/staff e cassiere.

## Blockers

none

## Notes for next session

- Con 10 pezzi per scaffale e un cliente ogni 10 minuti di gioco, gli scaffali si svuotano in ~3 ore di gioco: voluto (niente rifornimento fino allo staff), ma da tarare.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
