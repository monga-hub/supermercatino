# Milestone 07: Sprite dipinti

## Status

implemented — in attesa del playtest dell'utente

## Objective

Sostituire i blocchi colorati con sprite isometrici **dipinti** (non pixel art) generati con **Gemini**, coerenti tra loro (stessa luce, stesso angolo 2:1, stesso contorno), leggibili su telefono. La simulazione non cambia: cambia solo il disegno.

## Scope

- Foglio di stile: un prompt base unico (palette calda anni '80-'90, vista iso 2:1, luce da sinistra, sfondo bianco piatto per lo scontorno) + un prompt per foglio. Salvato in `art/prompts.md`.
- Fogli generati con Gemini in `art/sheets/` (sorgenti, versionati): oggetti (porta, scaffale vuoto + merce per le 6 categorie, cassa, scatoloni), personaggi (cliente, cliente arrabbiato, cassiere seduto/in piedi, magazziniere, magazziniere con scatolone).
- Script `tools/kit.py` (Python + Pillow, sullo stile di `spesa-nonna/tools/kit.py`): scontorna lo sfondo, scala ogni pezzo sulla casella 64×32, impacchetta `public/assets/kit.png` + `kit.json` (frame + punto d'appoggio).
- `src/render/draw.ts`: sprite al posto di `box()`, stesso ordinamento in profondità; i placeholder restano come riserva se manca un frame.
- Le icone 📦/⏳/💰 restano emoji (eventuale sostituzione dopo).
- Pavimenti e scatoloni del magazzino restano procedurali (si leggono bene; deciso in implementazione).

## Out of scope

- Animazioni a più frame (camminata): un frame per stato basta.
- Stanze e oggetti nuovi, audio.

## Dependencies

- **Depends on:** milestone 06
- **Blocks:** nessuno (08 può andare prima o dopo)

## Acceptance criteria

- [x] Ogni tipo di oggetto ha un frame in `kit.json` — test: `tests/assets.test.ts::every drawable has a frame: furniture`
- [x] Ogni personaggio ha un frame — test: `tests/assets.test.ts::every drawable has a frame: people`
- [x] Il gioco carica l'atlas senza errori in console e disegna gli sprite — test: `scripts/browser-test.mjs::no console errors` + screenshot
- [ ] Merce sullo scaffale visibile e distinguibile per categoria; scaffale vuoto riconoscibile — screenshot + verified by user playtest
- [ ] Sprite coerenti e leggibili su telefono (zoom minimo e normale) — verified by user playtest

## Exit condition

L'utente apre il gioco dal telefono e vede un supermercato dipinto: pavimenti, scaffali con la merce, casse, clienti, cassieri e magazzinieri disegnati, con lo stesso gioco di prima.

## Test plan

- Test rosso: `tests/assets.test.ts`.
- Screenshot telefono (orizzontale/verticale) a ogni foglio integrato.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Promuove dal backlog: "Sprite dipinti AI". Chiude l'open question "Strumento AI per gli sprite e formato atlas": Gemini + atlas PNG/JSON fatto in casa.
- Il foglio personaggi è venuto da una chat Gemini nuova ("1980s Italian Supermarket Sprite Sheet"): la prima chat falliva sempre. I personaggi guardano in basso a destra; `draw.ts` li specchia quando vanno verso sinistra.
- Riferimento: pipeline di `spesa-nonna` (`tools/kit.py`, `tools/scontorna.py`), che però produceva pixel art: qui lo stile resta dipinto (gameplan).
