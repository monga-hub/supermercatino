# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 07

## Current phase

development (scaffold completato)

## Current milestone

[07b — Animazioni personaggi](milestones/07b-animazioni-personaggi.md) (implementato, in attesa di playtest). 07 implementato. Poi [08 — Rifiniture rapide](milestones/08-rifiniture-rapide.md); pareti nel backlog.

## Last action

Milestone 07b: fogli Gemini per personaggio (`art/sheets/cliente.jpg`, `cassiere.jpg`, `magazziniere.jpg`), `personFrame()` in `src/render/sprites.ts` sceglie la posa dallo stato (camminata agganciata alla posizione, coda, paga, arrabbiata, cassiera che batte, magazziniere con scatolone). `npm test` 41/41, browser 10/10.

## Next step

Playtest dell'utente (07 + 07b) sul telefono, poi 08 o pareti.

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
