# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 08

## Current phase

development (scaffold completato)

## Current milestone

[08 — Rifiniture rapide](milestones/08-rifiniture-rapide.md) (implementato, in attesa di playtest). 07, 07b, 09, 10 implementati, in attesa di playtest. Poi: nuovo giro di milestone planning dal backlog.

## Last action

Icone di tocco alzate sopra gli oggetti; milestone 08: fila su celle diverse, livello che parte in pausa con il messaggio "Costruisci il negozio, poi premi 1x", camera che inquadra tutto il lotto all'avvio e al ricomincia, clienti e staff che ricalcolano il percorso dopo costruzioni e demolizioni. `npm test` 55/55, browser 10/10.

## Next step

Playtest dell'utente (07, 07b, 09, 10, 08) sul telefono, poi milestone planning dal backlog.

## Blockers

none

## Notes for next session

- Con 10 pezzi per scaffale e un cliente ogni 10 minuti di gioco, gli scaffali si svuotano in ~3 ore di gioco: ora c'è il magazziniere; bilanciamento costi/prezzi da tarare col 06.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
