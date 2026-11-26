# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 16

## Current phase

development (scaffold completato)

## Current milestone

[16 — Audio](milestones/16-audio.md) (implementato, in attesa di playtest). Nessun milestone pianificato dopo: serve milestone planning. 07–15 in attesa di playtest.

## Last action

Milestone 16: audio tutto sintetizzato (Web Audio + voce del telefono), muzak, effetti, annunci comici, tasto Audio. `npm test` 84/84, browser 13/13. Prima: Milestone 15: cliente furbetto (salta la fila o scappa senza pagare), tocco 👮 per beccarlo (paga, +rep), toast "Beccato!". Fogli Gemini `furbetto.jpg` 3×3 e `beccato.jpg`. `npm test` 80/80, browser 12/12. Prima: Milestone 14: carrelli abbandonati (il magazziniere li porta via, tocco 🛒), ispezione sanitaria al giorno 3 (multa per macchia o bonus). Obiettivo soldi livello 1 → €3500. `npm test` 74/74, browser 12/12. Prima: Milestone 13: stanza banco salumi, bancone con affettatrice, banconiere (quarto ruolo) con la sua fila; Salumi solo al banco. Fogli Gemini `bancone.jpg`, `banconiere.jpg`. `npm test` 69/69, browser 12/12. Prima: Milestone 12: macchie di yogurt (`src/sim/dirt.ts`), cestino, addetto pulizie (terzo ruolo), icona spugna da toccare; fogli Gemini `pulizie.jpg` e `sporco.jpg`. `npm test` 64/64, browser 12/12. Prima: Milestone planning (11 salvataggio e menu, 12 sporco e pulizie, 13 banco salumi, confermati dall'utente). Milestone 11: `src/sim/save.ts`, salvataggio automatico in localStorage, menu iniziale Continua/Nuova partita, briefing con gli obiettivi; `?manual&save` per i test browser. `npm test` 57/57, browser 12/12.

## Next step

Playtest dell'utente (07–16) sul telefono, poi milestone planning per i prossimi (backlog: forno e frigo, guardia, livelli successivi).

## Blockers

none

## Notes for next session

- Con 10 pezzi per scaffale e un cliente ogni 10 minuti di gioco, gli scaffali si svuotano in ~3 ore di gioco: ora c'è il magazziniere; bilanciamento costi/prezzi da tarare col 06.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
