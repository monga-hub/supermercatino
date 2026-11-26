# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 11

## Current phase

development (scaffold completato)

## Current milestone

[11 — Salvataggio e menu](milestones/11-salvataggio-e-menu.md) (implementato, in attesa di playtest). Prossimi: [12 — Sporco e pulizie](milestones/12-sporco-e-pulizie.md), [13 — Banco salumi](milestones/13-banco-salumi.md). 07, 07b, 08, 09, 10 in attesa di playtest.

## Last action

Milestone planning (11 salvataggio e menu, 12 sporco e pulizie, 13 banco salumi, confermati dall'utente). Milestone 11: `src/sim/save.ts`, salvataggio automatico in localStorage, menu iniziale Continua/Nuova partita, briefing con gli obiettivi; `?manual&save` per i test browser. `npm test` 57/57, browser 12/12.

## Next step

Playtest dell'utente (07, 07b, 08, 09, 10, 11) sul telefono, poi milestone 12 (fogli Gemini per addetto pulizie, macchie, cestino, icona).

## Blockers

none

## Notes for next session

- Con 10 pezzi per scaffale e un cliente ogni 10 minuti di gioco, gli scaffali si svuotano in ~3 ore di gioco: ora c'è il magazziniere; bilanciamento costi/prezzi da tarare col 06.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
