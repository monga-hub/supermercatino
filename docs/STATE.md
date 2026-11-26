# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 07

## Current phase

development (scaffold completato)

## Current milestone

[09 — Sembra un supermercato](milestones/09-sembra-un-supermercato.md) (implementato, in attesa di playtest). 07 e 07b implementati, in attesa di playtest. Poi [08 — Rifiniture rapide](milestones/08-rifiniture-rapide.md).

## Last action

Milestone 09: strumento Ruota (scaffali e casse, due orientamenti), muri dipinti sui bordi in fondo dell'edificio con la porta sul bordo esterno della sua cella (`src/render/walls.ts`, texture `art/sheets/pareti.jpg` inclinate da `tools/kit.py`), icone di tocco dipinte (`art/sheets/icone.jpg`). `npm test` 45/45, browser 10/10.

## Next step

Playtest dell'utente (07, 07b, 09) sul telefono, poi 08.

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
