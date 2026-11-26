# Milestone 07b: Animazioni dei personaggi

## Status

implemented — in attesa del playtest dell'utente

## Objective

I personaggi oggi scivolano come manichini. Ogni personaggio ha il suo foglio Gemini con le pose che servono: camminata in 3 passi, l'azione principale e (per il cliente) l'arrabbiatura. Il disegno sceglie la posa dallo stato della simulazione; la simulazione non cambia.

## Scope

- Un foglio per personaggio in `art/sheets/` (prompt in `art/prompts.md`), tutti rivolti in basso a destra come il foglio attuale:
  - `cliente.jpg` (3×3): camminata ×3, camminata arrabbiata ×3, in attesa in coda, porge i soldi, prende dallo scaffale (riserva).
  - `cassiere.jpg` (2×3): camminata ×3, seduta ferma, seduta che passa un articolo, seduta che batte sul registratore.
  - `magazziniere.jpg` (2×3): camminata ×3, camminata con scatolone ×3.
- `tools/kit.py` ritaglia i nuovi fogli; `personaggi.jpg` esce dal kit.
- `src/render/sprites.ts::personFrame()` (pura, testata): sceglie il frame.
  - Camminata agganciata alla posizione (4 frame per casella, sequenza 1-2-3-2): ferma in pausa, niente piedi che pattinano.
  - Cliente: coda → in attesa; paga/pronto → porge i soldi; esce arrabbiato → camminata arrabbiata.
  - Cassiera: alla cassa ferma; con un cliente che paga alla sua cassa → alterna "passa articolo" e "batte sul registratore".
  - Magazziniere: con merce in mano → camminata con scatolone.

## Out of scope

- Animazione "prende dallo scaffale": nella sim il prelievo è istantaneo; il frame resta nel kit per dopo.
- Pareti (backlog), nuovi personaggi.

## Dependencies

- **Depends on:** 07 (kit e sprite nel gioco)
- **Blocks:** nessuno

## Acceptance criteria

- [x] Ogni frame usato da `personFrame()` esiste in `kit.json` — test: `tests/assets.test.ts::every drawable has a frame: people`
- [x] Il cliente che cammina cambia frame avanzando e resta fermo se non si muove; in coda, alla cassa e arrabbiato usa le sue pose — test: `tests/sprites.test.ts`
- [x] La cassiera alterna le pose mentre un cliente paga alla sua cassa; il magazziniere con merce usa la camminata con scatolone — test: `tests/sprites.test.ts`
- [ ] Movimento credibile su telefono (non più manichini) — verified by user playtest

## Exit condition

L'utente apre il gioco sul telefono e vede i clienti camminare passo passo, arrabbiarsi uscendo, pagare alla cassa; la cassiera che batte gli scontrini; il magazziniere che porta lo scatolone.

## Test plan

- Test rossi: `tests/sprites.test.ts`, `tests/assets.test.ts` aggiornato.
- Screenshot ravvicinati di cassa, corsia e magazzino.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Fogli generati il 2026-11-26 in tre chat Gemini nuove. La camminata della cassiera è quasi ferma (Gemini ha disegnato 3 pose simili): accettabile, cammina solo per arrivare alla cassa.
- `tools/kit.py`: scala unica per foglio personaggio, ancora sul centro della cella (niente sobbalzi), e ogni frame ha un'ancora (le immagini riusate prendono l'origine dal frame).
- Richiesta utente dopo il playtest del 07 (2026-11-26). Rischio: Gemini può variare il personaggio tra un frame e l'altro dello stesso foglio.
