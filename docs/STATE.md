# Session state

> Updated at the end of each session that made progress. Read first at the start of each session by the make-game session-start sub-pipeline.

## Last updated

2026-11-26 by Claude / make-game milestone 03

## Current phase

development (scaffold completato)

## Current milestone

[03 — Primo cliente paga](milestones/03-primo-cliente-paga.md) (in-progress, AC automatiche verdi). 01 e 02 done.

## Last action

Milestone 02 chiuso dopo playtest da telefono. Milestone 03 implementato: A* (`src/sim/path.ts`), clienti come macchina a stati con lista spesa, stock scaffali (10), fila FIFO, cassa automatica, pagamento, pazienza e uscita arrabbiata (`src/sim/customers.ts`); clienti disegnati con barra pazienza, contatore Serviti/Persi nell'HUD. Test: `npm test` 17/17, `npm run test:browser` 6/6. Commit + push automatici (preferenza utente: prova solo da telefono via GitHub Pages).

## Next step

Playtest utente del 03 dal telefono: costruire negozio minimo, far scorrere il tempo, svuotare uno scaffale. Se ok: 03 → done, poi milestone planning (backlog: staff + rifornimento, reputazione, tipi cliente, sprite AI).

## Blockers

none

## Notes for next session

- Con 10 pezzi per scaffale e un cliente ogni 10 minuti di gioco, gli scaffali si svuotano in ~3 ore di gioco: voluto (niente rifornimento fino allo staff), ma da tarare.
- `npm audit` segnala vulnerabilità nelle devDependencies del template (Vite 6.3.x); valutare upgrade in un milestone dedicato, non è bloccante per lo sviluppo locale.
- `node --test` gira sui `.ts` con lo type stripping di Node 24 (verificato). Lo script `npm test` è limitato a `tests/**/*.test.ts` perché il pattern di default prendeva anche `scripts/browser-test.mjs`.
- Il pannello browser di Claude manda click/trascinamenti con down e up nello stesso frame: utile per screenshot, ma per verificare l'input usare Playwright (`page.mouse` con `steps`).
- Nel pannello browser di Claude compare `WebSocket connection to 'ws://localhost:8080/' failed` (ricarica automatica di Vite); Playwright su pagina pulita non lo vede. Non è del gioco.
- Testi Phaser a risoluzione 1: su schermi retina possono sembrare un po' sfocati; da sistemare con gli sprite/HUD definitivi.
