# Milestone 25: Scaffali rifatti, pieno / mezzo / vuoto

## Status

implemented (in attesa di playtest)

## Objective

Playtest del 2026-11-27: rifare la grafica di ogni mobile con la merce, uno per uno, e far vedere a colpo d'occhio quanto è pieno: **pieno**, **mezzo**, **vuoto**.

## Scope

- Un foglio Gemini 3×1 per mobile (pieno, mezzo, vuoto, stesso mobile e stessa vista): scaffali Pasta, Frutta, Detersivi; frigo (Latticini); forno (Pane); banco salumi (Salumi).
- Frame `<base>`, `<base>_mezzo`, `<base>_vuoto` (base: `scaffale_<Categoria>`, `frigo`, `forno`, `bancone`).
- Stato dalla merce: 0 → vuoto, 1..`SHELF_HALF` (5) → mezzo, sopra → pieno. Funzione pura `objectFrame()` in `src/render/sprites.ts`.
- `tools/kit.py` cancella da solo la riga di divisione tra le celle che Gemini a volte disegna.

## Out of scope

- Merce che cala un pezzo alla volta (più di tre stati).

## Dependencies

- **Depends on:** 24

## Acceptance criteria

- [x] Ogni mobile ha tre frame nel kit (`tests/assets.test.ts`).
- [x] Lo stato segue la merce: 10 pieno, 5 mezzo, 0 vuoto (`tests/sprites.test.ts`).
- [x] Verificato dagli screenshot; giudizio finale al playtest.

## Exit condition

L'utente vede sul telefono uno scaffale passare da pieno a mezzo a vuoto mentre i clienti comprano, e tornare pieno quando arriva il magazziniere.
