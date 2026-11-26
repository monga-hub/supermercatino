# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 04

## Current phase

development (scaffold completato)

## Current milestone

[05b — Tocca per accelerare](milestones/05b-tocca-per-accelerare.md) (in-progress, AC automatiche verdi; ADR-0002 modello ibrido). [05](milestones/05-rifornisci-gli-scaffali.md) in attesa di playtest. 04 chiuso. Poi 06 Fine giornata e obiettivi; sprite AI dopo il 06.

## Last action

Milestone 05b (ADR-0002, tocchi ibridi): icone 📦/⏳ sugli scaffali e 💰 sulle casse; comando `restock` (coda con priorità per i magazzinieri), comando `collect` (incasso con mancia), stato cliente `ready` con incasso automatico dopo 3 s. Test: `npm test` 31/31, `npm run test:browser` 8/8. Prima: milestone 05 (magazzino, Merce, magazziniere).

## Next step

Playtest utente da telefono di 05 e 05b insieme (Merce → Ordina, magazziniere, tocchi su 📦 e 💰). Se ok: 05 e 05b → done, poi 06 (Fine giornata e obiettivi, con le mance).

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
