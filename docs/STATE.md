# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 02

## Current phase

development (scaffold completato)

## Current milestone

[02 — Costruisci il negozio](milestones/02-costruisci-il-negozio.md) (in-progress, AC automatiche verdi). 01 done. Poi 03 Primo cliente paga.

## Last action

Milestone 01 chiuso dopo playtest utente. Milestone 02 implementato: comandi sim `buildRoom/placeObject/demolish` come dati con `check`/`apply` (`src/sim/build.ts`), soldi, stanze, oggetti, rimborso; disegno placeholder (`src/render/draw.ts`); barra strumenti, categorie scaffale, soldi e avvisi nell'HUD; anteprima verde/rossa; input basato su `pointerup` (robusto ai click istantanei). Test: `npm test` 11/11, `npm run test:browser` 5/5. Screenshot in `output/iterate/2026-11-26-m02-*.png` (non versionati).

## Next step

Playtest utente del 02 (desktop e telefono): costruire sala vendita + area casse, piazzare porta/scaffale/cassa, provare una cassa nel posto sbagliato. Se ok: 02 → done, si apre il 03 coi test rossi `tests/path.test.ts` e `tests/customers.test.ts`.

## Blockers

none

## Notes for next session

- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
