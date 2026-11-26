# Milestone 02: Costruisci il negozio

## Status

planned

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

- [ ] `buildRoom` crea una stanza valida e scala il costo; rifiuta sovrapposizioni e rettangoli sotto la dimensione minima — test: `tests/build.test.ts::buildRoom validates and charges`
- [ ] `placeObject` accetta scaffale in sala vendita e cassa in area casse, rifiuta il contrario e le celle occupate — test: `tests/build.test.ts::objects only in the right room`
- [ ] La porta si piazza solo sul bordo della sala vendita — test: `tests/build.test.ts::door on sales-floor edge`
- [ ] Con soldi insufficienti ogni comando di costruzione è rifiutato e lo stato non cambia — test: `tests/build.test.ts::no money no build`
- [ ] `demolish` rimuove e rimborsa la quota da `config.ts` — test: `tests/build.test.ts::demolish refunds`
- [ ] Nel browser, costruire in pausa aggiorna `render_game_to_text()` (stanze, oggetti, soldi) senza far avanzare l'ora — test: `scripts/browser-test.mjs::build while paused`
- [ ] Anteprima verde/rossa leggibile, piazzamento con mouse e con tap — verified by user playtest

## Exit condition

L'utente in pausa disegna una sala vendita e un'area casse, piazza porta, scaffale "Pasta" e cassa → i soldi nell'HUD calano a ogni acquisto; provando a mettere la cassa in sala vendita l'anteprima resta rossa e niente viene piazzato.

## Test plan

- Test rossi per primi: `tests/build.test.ts` (`npm test`), poi `scripts/browser-test.mjs::build while paused`.
- Playtest utente su desktop e touch.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Costi e dimensioni minime solo in `src/sim/config.ts`; numeri provvisori, si tarano in playtest.
- Categorie merce come stringhe italiane nei dati (convenzione `docs/tech.md`).
