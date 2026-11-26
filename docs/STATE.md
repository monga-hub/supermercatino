# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 04

## Current phase

development (scaffold completato)

## Current milestone

[05 — Rifornisci gli scaffali](milestones/05-rifornisci-gli-scaffali.md) (in-progress, AC automatiche verdi). 04 chiuso. Poi 06 Fine giornata e obiettivi; sprite AI dopo il 06.

## Last action

Milestone 05 implementato: `warehouse` per categoria, comando `order` (serve un magazzino), ruolo Magazziniere che va in magazzino, prende quanto manca e riempie gli scaffali sotto soglia; pannello Merce nell'HUD; pannelli scorrevoli. Test: `npm test` 26/26, `npm run test:browser` 7/7. Prima: stanze di qualsiasi misura (stesso tipo affiancato = un'area unica).

## Next step

Playtest utente del 05 da telefono (magazzino, Merce → Ordina, magazziniere che rifornisce). Se ok: 05 → done e si parte col 06 (Fine giornata e obiettivi).

## Blockers

none

## Notes for next session

- Con 10 pezzi per scaffale e un cliente ogni 10 minuti di gioco, gli scaffali si svuotano in ~3 ore di gioco: ora c'è il magazziniere; bilanciamento costi/prezzi da tarare col 06.
- La camera parte centrata sul lotto: un negozio costruito in alto a sinistra finisce mezzo fuori schermo. Da valutare.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
