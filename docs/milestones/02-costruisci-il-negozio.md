# Milestone 02: Costruisci il negozio

## Status

done (2026-11-26) — playtest utente ok da telefono

## Objective

Primo verbo del loop: costruire. Il giocatore disegna stanze sulla griglia trascinando un rettangolo e piazza dentro gli oggetti, pagando con la cassa del negozio. Si limita alle stanze e agli oggetti che servono al milestone 03 (un cliente che entra, compra e paga), così il loop si chiude prima di allargare il catalogo. Tutto resta nella sim (comandi tipo `buildRoom`, `placeObject` validati in `src/sim/`), Phaser traduce solo input e disegna.

## Scope

- Comandi sim: `buildRoom(state, type, rect)`, `placeObject(state, type, cell, opts)`, `demolish` (stanza vuota o oggetto, rimborso parziale da `config.ts`). Ogni comando restituisce ok/errore con motivo.
- Tipi stanza: **sala vendita**, **magazzino**, **area casse**. Stanze non si sovrappongono; dimensione minima per tipo.
- Oggetti: **porta d'ingresso** (sul bordo della sala vendita), **scaffale** (sala vendita, con una categoria tra Pasta, Latticini, Salumi, Pane, Frutta, Detersivi), **cassa** (area casse). Oggetto fuori dalla stanza giusta o su cella occupata → rifiutato.
- Cassa del negozio (soldi iniziali da `config.ts`); costruire costa; senza soldi sufficienti il comando è rifiutato.
- Costruzione funziona anche in pausa.
- UI: barra strumenti (stanze, oggetti, demolisci), anteprima del rettangolo/oggetto con verde/rosso, tap per piazzare su touch, contatore soldi nell'HUD.
- Grafica placeholder: pavimenti colorati per tipo stanza, blocchi iso per gli oggetti.

## Out of scope

- Banco salumi, forno, spogliatoio, frigo, bancone, affettatrice, cestino (milestone successivi).
- Rotazione oggetti, muri/porte interne, espansione del lotto.
- Rifornimento merce (gli scaffali partono con uno stock fisso nel 03).

## Dependencies

- **Depends on:** milestone 01
- **Blocks:** milestone 03

## Acceptance criteria

- [x] `buildRoom` crea una stanza valida e scala il costo; rifiuta sovrapposizioni e rettangoli sotto la dimensione minima — test: `tests/build.test.ts::buildRoom validates and charges`
- [x] `placeObject` accetta scaffale in sala vendita e cassa in area casse, rifiuta il contrario e le celle occupate — test: `tests/build.test.ts::objects only in the right room`
- [x] La porta si piazza solo sul bordo della sala vendita — test: `tests/build.test.ts::door on sales-floor edge`
- [x] Con soldi insufficienti ogni comando di costruzione è rifiutato e lo stato non cambia — test: `tests/build.test.ts::no money no build`
- [x] `demolish` rimuove e rimborsa la quota da `config.ts` — test: `tests/build.test.ts::demolish refunds`
- [x] Nel browser, costruire in pausa aggiorna `render_game_to_text()` (stanze, oggetti, soldi) senza far avanzare l'ora — test: `scripts/browser-test.mjs::build while paused`
- [x] Trascinare con il mouse costruisce una stanza, un click piazza un oggetto — test: `scripts/browser-test.mjs::build with mouse`
- [x] Anteprima verde/rossa leggibile, piazzamento con mouse e con tap — verified by user playtest

## Exit condition

L'utente in pausa disegna una sala vendita e un'area casse, piazza porta, scaffale "Pasta" e cassa → i soldi nell'HUD calano a ogni acquisto; provando a mettere la cassa in sala vendita l'anteprima resta rossa e niente viene piazzato.

## Test plan

- Test rossi per primi: `tests/build.test.ts` (`npm test`), poi `scripts/browser-test.mjs::build while paused`.
- Playtest utente su desktop e touch.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Costi e dimensioni minime solo in `src/sim/config.ts`; numeri provvisori, si tarano in playtest.
- I comandi sono dati (`Command` in `src/sim/build.ts`): `check(state, cmd)` valida senza toccare lo stato (usato per l'anteprima), `apply(state, cmd)` valida ed esegue. UI, test e hook `window.dispatch(cmd)` passano tutti da lì. I test usano `apply` invece delle funzioni `buildRoom/placeObject/demolish` previste nello Scope: stessa logica, un solo ingresso.
- Input: niente logica su `pointerdown`. Un click veloce può consegnare down+up nello stesso frame e Phaser salta il `pointerdown` della scena; si usa `pointerup` con `pointer.downX/downY` e `getDistance()` (tap ≤ 10 px).
- Comandi touch: con strumento stanza un dito disegna, due dita zoomano e spostano; con oggetti/demolisci un dito sposta la vista e il tap piazza. Desktop: tasto destro/centrale sposta sempre la vista, `Esc` toglie lo strumento.
- `window.selectTool(tool)`: hook per agenti/test, perché le larghezze dei pulsanti dipendono dai font (in headless cambiano).
- Il lotto vuoto ora è cemento; il linoleum a scacchi è il pavimento della sala vendita.
- Categorie merce come stringhe italiane nei dati (convenzione `docs/tech.md`).
