# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 01

## Current phase

development (scaffold completato)

## Current milestone

[01 — Il negozio esiste](milestones/01-il-negozio-esiste.md) (in-progress). Poi 02 Costruisci il negozio, 03 Primo cliente paga.

## Last action

Milestone 01 implementato: sim pura (`src/sim/state.ts`, `config.ts`) con orologio in secondi interi, pausa e 1x/2x/3x, cambio giorno a chiusura; conversione iso (`src/render/iso.ts`); scene `Game` (pavimento a scacchi, drag/rotella/pinch) e `Hud` (orologio + pulsanti, tasti spazio/1/2/3); hook `render_game_to_text`/`advanceTime`; `?manual` per test deterministici. Test: `npm test` 5/5, `npm run test:browser` 3/3 su dev e su build di produzione. GitHub Pages attivo: https://monga-hub.github.io/supermercatino/ (deploy a ogni push su main; controlli browser verdi anche sul sito pubblicato).

## Next step

Playtest dell'utente sulle due AC rimaste (pan/zoom desktop, pan/pinch touch). Se ok: milestone 01 → done, si apre il 02 coi test rossi di `tests/build.test.ts`.

## Blockers

none

## Notes for next session

- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
