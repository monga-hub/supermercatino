# Milestone 24: Cassa in linea, muri nuovi, staff uomini e donne

## Status

implemented (in attesa di playtest)

## Objective

Secondo giro di feedback del 2026-11-27: grafica nuova per muri e cassa (una linea di cassa dritta al posto della U col cassiere di lato), candidati divisi per mansione, cassieri uomini e magazziniere donne, e nella scheda del lavoratore una finestra che fa vedere dove si trova in quel momento (come Theme Hospital).

## Scope

- **Muri** (foglio Gemini `pareti2.jpg`): esterni in intonaco crema e mattoni con finestre e poster ogni tanto, interni tra stanze in piastrelle bianche con fascia blu e rossa, porta scorrevole, muretto davanti in mattoni.
- **Cassa in linea** (foglio `cassa.jpg`): banco dritto col nastro e il registratore; il cassiere siede dietro (lato −x, −y se girata), i clienti pagano davanti (+x, +y se girata) e fanno la fila lungo il banco. Senza cassiere si vede lo sgabello vuoto.
- **Staff uomini e donne**: il sesso viene dal nome (`FEMALE_NAMES`). Cassa e magazzino hanno entrambi (fogli `cassiere_m.jpg`, `magazziniera.jpg`); pulizie, banco, guardia e capo prendono un nome adatto al loro unico sprite (`ROLE_SEX`).
- **Tab per mansione** nel pannello Staff: si apre sul primo ruolo che non ha ancora nessuno.
- **Scheda**: al posto del ritratto, una vista dal vivo del negozio centrata sul lavoratore ("● in diretta", DynamicTexture che ridisegna la scena Game).

- **Muri solo attorno al magazzino** (e allo spogliatoio, anch'esso solo per lo staff): sala vendita, casse, banco e panetteria restano uno spazio aperto (`walled()` in `build.ts`). Il muro prende l'aspetto della stanza su cui affaccia: piastrelle bianche dentro magazzino e spogliatoio, intonaco e mattoni uniformi dal lato della sala (senza finestre né poster dove dà sul magazzino).

## Out of scope

- Cassa lunga due celle: resta una cella, il banco dritto la riempie.
- Altri ruoli in due versioni (servono altri fogli Gemini).

## Dependencies

- **Depends on:** 23
- **Blocks:** 22

## Acceptance criteria

- [x] Muri esterni e interni diversi, nuovi frame nel kit (`tests/assets.test.ts`).
- [x] Cassa dritta, cassiere dietro, clienti davanti in fila lungo il banco (`tests/customers.test.ts` "queue on distinct cells"); verificato dallo screenshot.
- [x] Cassieri uomini e magazziniere donne, sprite dal nome; nomi adatti per i ruoli a sprite unico (`tests/sprites.test.ts`).
- [x] Candidati divisi per mansione con tab; verificato dagli screenshot.
- [x] Niente muro tra sala e casse, solo attorno alle stanze dello staff (`tests/walls.test.ts`).
- [x] Cassa rifatta (playtest): registratore all'uscita accanto al cassiere, sprite intero; alone delle icone non più tagliato a quadrato. Verificato dagli screenshot.
- [x] La cassa occupa due caselle lungo la fila (`tests/build.test.ts` "a till takes two cells"); si può toccare l'una o l'altra per piazzarla. Verificato dallo screenshot.
- [x] Saracinesca aperta nei varchi del magazzino (`tests/walls.test.ts`); verificato dallo screenshot.
- [x] Scheda con vista dal vivo del lavoratore; verificato dallo screenshot, giudizio finale al playtest.

## Exit condition

L'utente vede sul telefono la cassa dritta col cassiere dietro, i muri nuovi, assume una magazziniera dal tab Magazzino e nella sua scheda la vede muoversi.
