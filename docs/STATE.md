# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game scaffold

## Current phase

development (scaffold completato)

## Current milestone

[01 — Il negozio esiste](milestones/01-il-negozio-esiste.md) (planned). Poi 02 Costruisci il negozio, 03 Primo cliente paga.

## Last action

Scaffold: template ufficiale `phaserjs/template-vite-ts` variante Minimal (Phaser 4.0.0, Vite 6, TS 5.7). L'installer `npm create @phaserjs/game@latest` si bloccava al download su Node 24 (connessione a phaser.io senza seguire il redirect, CPU 100%); stesso zip scaricato da codeload GitHub e applicato a mano l'overlay "Minimal" del pacchetto installer v1.3.2. Aggiunti Playwright, `scripts/browser-test.mjs` (smoke), script `test`/`test:browser`, `.claude/launch.json`, `AGENTS.md`, `CLAUDE.md`. Smoke test verde: canvas renderizzato, zero errori console. Commit dello scaffold + AGENTS. Poi milestone planning: scritti milestone 01–03 e `docs/backlog.md`; grafica placeholder fino al 03 (gameplan aggiornato).

## Next step

Milestone 01, pipeline development step 3: scrivere i test rossi `tests/sim.test.ts` (stato serializzabile, orologio/velocità, rollover giorno, niente import Phaser) e verificare che `node --test` esegua i `.ts`.

## Blockers

none

## Notes for next session

- La scena `src/game/scenes/Game.ts` e `public/assets/{bg,logo}.png` sono del template: da sostituire nel milestone 01.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` su file `.ts` si appoggia allo type-stripping nativo di Node 24: verificarlo col primo test.
