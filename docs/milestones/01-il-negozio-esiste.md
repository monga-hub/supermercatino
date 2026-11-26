# Milestone 01: Il negozio esiste

## Status

done (2026-11-26) — playtest utente ok su desktop e touch

## Objective

Mettere in piedi l'ossatura su cui si appoggia tutto il resto: lo stato della simulazione (oggetto JSON in `src/sim/`, senza Phaser) che avanza con `tick(state, dt)` a passo fisso, gli hook `window.render_game_to_text()` / `window.advanceTime(ms)` per test e agenti, la griglia isometrica disegnata da Phaser con la camera navigabile (mouse e touch) e l'orologio della giornata con pausa e 3 velocità. Si fa per primo perché costruzione (02) e clienti (03) leggono e scrivono questo stato e girano su questa griglia. Grafica volutamente placeholder (rombi colorati, linoleum a scacchi in tinta): gli sprite AI arrivano in un milestone dedicato dopo il 03.

## Scope

- `src/sim/`: tipo `GameState` (griglia W×H di celle, orologio giornata, velocità), `createState()`, `tick(state, dt)` a passo fisso, `src/sim/config.ts` con i numeri (dimensione griglia, durata giornata, orari apertura/chiusura, moltiplicatori velocità).
- Velocità: `pausa`, `1x`, `2x`, `3x`. In pausa il tick non fa avanzare l'orologio.
- `src/render/`: conversione griglia↔iso (formula) e inversa schermo→cella.
- Scena `Game` sostituisce quella del template: disegna il pavimento iso placeholder, guida la sim con un accumulatore a passo fisso.
- Camera: pan con drag (mouse e un dito), zoom con rotella e pinch a due dita, con limiti min/max.
- HUD minimo: ora della giornata + pulsanti pausa/1x/2x/3x (tasti `spazio`, `1`, `2`, `3`).
- Hook: `window.render_game_to_text()` (stato sim in JSON), `window.advanceTime(ms)` (avanza la sim di tick fissi, deterministico, indipendente dal frame rate).
- Rimozione asset del template (`bg.png`, `logo.png`).

## Out of scope

- Costruzione di stanze/oggetti (milestone 02).
- Clienti, staff, economia (03 e successivi).
- Sprite AI, audio, salvataggio, menu.
- Fine giornata con riepilogo: l'orologio arriva all'orario di chiusura e ricomincia il giorno dopo, niente schermata.

## Dependencies

- **Depends on:** ADR 0001
- **Blocks:** milestone 02, milestone 03

## Acceptance criteria

- [x] `createState()` restituisce uno stato serializzabile: `JSON.parse(JSON.stringify(s))` è deep-equal a `s` — test: `tests/sim.test.ts::state is JSON-serializable`
- [x] `tick` a 1x avanza l'orologio della durata attesa; a 2x/3x proporzionalmente; in pausa non avanza — test: `tests/sim.test.ts::clock advances with speed and stops on pause`
- [x] Arrivato all'orario di chiusura il giorno successivo riparte dall'apertura e `day` incrementa — test: `tests/sim.test.ts::day rolls over at closing time`
- [x] `src/sim/` non importa Phaser — test: `tests/sim.test.ts::sim does not import phaser`
- [x] Conversione griglia→iso→griglia è identità su tutte le celle — test: `tests/iso.test.ts::grid-iso roundtrip`
- [x] Nel browser `render_game_to_text()` restituisce JSON con griglia, giorno, ora e velocità; `advanceTime(60000)` a 1x sposta l'ora del valore atteso — test: `scripts/browser-test.mjs::hooks expose and advance state`
- [x] Premere `spazio` mette in pausa (l'ora non cambia dopo `advanceTime`), `3` imposta 3x — test: `scripts/browser-test.mjs::keyboard speed controls`
- [x] Zero errori in console all'avvio e dopo 10 s di gioco — test: `scripts/browser-test.mjs::no console errors`
- [x] Pan con drag e zoom con rotella fluidi, zoom limitato — verified by user playtest
- [x] Pan con un dito e pinch-zoom a due dita su telefono/tablet — verified by user playtest

## Exit condition

L'utente apre il gioco (desktop e telefono) → vede il pavimento iso a scacchi, lo sposta trascinando e lo ingrandisce/rimpicciolisce con rotella o pinch; premendo pausa/1x/2x/3x l'ora nell'HUD si ferma o scorre più veloce.

## Test plan

- Prima i test rossi: `tests/sim.test.ts`, `tests/iso.test.ts` (`npm test`), poi le verifiche hook/tastiera in `scripts/browser-test.mjs` (`npm run test:browser` con `npm run dev-nolog` attivo).
- Playtest utente: desktop (drag, rotella) e telefono sulla stessa rete (`npx vite --config vite/config.dev.mjs --host`, aprire l'IP mostrato).
- Regressione prima di chiudere: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Test sim in `.ts` eseguiti da Node 24 con type stripping: import con estensione `.ts` esplicita (già permesso da `allowImportingTsExtensions` nel tsconfig); niente `enum`, niente parameter properties nelle classi, niente namespace (sintassi non cancellabile). Se `node --test` non trova i `.ts` di default, impostare lo script a `node --test "tests/**/*.test.ts"`.
- `scripts/browser-test.mjs` cresce da smoke a più controlli nominati; tenerlo un solo file finché regge.
- Orologio in secondi di gioco interi (`clockSec`) invece di minuti float: sommare 0,3 min a passo accumulava errore.
- La velocità esegue più passi fissi, non passi più lunghi: la sim resta identica a ogni velocità.
- `?manual` nell'URL ferma l'avanzamento in tempo reale: la sim avanza solo con `advanceTime` (test browser deterministici).
- HUD in una scena separata (`Hud`) con camera propria, così non zooma col negozio. Scala Phaser `RESIZE` a tutto schermo.
- Deploy: `.github/workflows/deploy.yml` (build + `npm test` + GitHub Pages a ogni push su main).
- Grafica placeholder decisa dall'utente il 2026-11-26 (vedi `docs/gameplan.md` → Art style).
