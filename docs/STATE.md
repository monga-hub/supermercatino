# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 04

## Current phase

development (scaffold completato)

## Current milestone

[06 — Fine giornata e obiettivi](milestones/06-fine-giornata-e-obiettivi.md) (in-progress, AC automatiche verdi). 04, 05, 05b chiusi. Dopo il 06: milestone sprite AI (da scrivere).

## Last action

Milestone 06: chiusura vera (stop arrivi nell'ultima ora, negozio svuotato), affitto e stipendi, riepilogo di fine giornata che mette in pausa (comando `continue`), reputazione che guida gli arrivi, livello 1 da 5 giornate con obiettivi, vittoria/sconfitta e Ricomincia. HUD con giorno N/5, reputazione e obiettivi. Test: `npm test` 35/35, `npm run test:browser` 10/10. Prima: 05 e 05b chiusi dopo playtest.

## Next step

Playtest utente di un livello intero da telefono; taratura numeri in `config.ts` (obiettivi, affitto, prezzi). Se ok: 06 → done, poi milestone planning per gli sprite AI.

## Blockers

none

## Notes for next session

- Con 10 pezzi per scaffale e un cliente ogni 10 minuti di gioco, gli scaffali si svuotano in ~3 ore di gioco: ora c'è il magazziniere; bilanciamento costi/prezzi da tarare col 06.
- Il livello parte col tempo che scorre a 1x mentre si costruisce: valutare partenza in pausa.
- La camera parte centrata sul lotto: un negozio costruito in alto a sinistra finisce mezzo fuori schermo. Da valutare.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
