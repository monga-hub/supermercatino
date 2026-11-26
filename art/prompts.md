# Prompt Gemini per gli sprite (milestone 07)

Generati su gemini.google.com (chat "Retro Italian Supermarket Sprite Sheet"), un foglio per richiesta,
nella stessa chat per tenere lo stile. I fogli scaricati vanno in `art/sheets/`; `tools/kit.py` li ritaglia.

## Stile base (in testa a ogni foglio)

Isometric 2:1 game sprite sheet, hand-painted digital illustration (painterly, soft visible brush strokes,
NOT pixel art, not 3D render), warm saturated 1980s-1990s Italian supermarket palette, soft light from the
upper left, thin dark-brown outline around every object, each item fully separated on a pure flat white
background with generous empty space between items, no cast shadows on the background, no text, no labels,
no prices. All items seen from exactly the same isometric angle: camera looking down about 30 degrees, the
object's two front faces turned toward the bottom-left and bottom-right. Same scale for all items.

## Foglio 1 — `arredi.png` (3×3)

1) empty metal supermarket shelf unit (gondola), 4 shelves, cream-painted steel, one floor tile, ~1.5 tiles tall;
2) same shelf full of dry pasta; 3) dairy; 4) cured meats; 5) bread; 6) fruit; 7) detergents;
8) checkout counter with a 1990s cash register and a short conveyor belt, one tile;
9) glass entrance double door in a metal frame with a red doormat, one tile.

## Fogli animazione (milestone 07b) — uno per personaggio, ognuno in una chat nuova

Testa comune: "Generate an image. Animation sprite sheet for a 2D isometric game, hand-painted digital illustration
(painterly, soft visible brush strokes, NOT pixel art, not 3D render), warm 1980s Italian palette, soft light from the
upper left, thin dark-brown outline, each pose fully separated on a pure flat white background with generous empty space,
no shadows on the background, no text, no labels, no grid lines. ONE character only, identical in every pose (same face,
hair, clothes, proportions, scale): <personaggio>. Full body, seen from an isometric angle (camera looking down about
30 degrees), always facing and walking toward the bottom-right. <griglia>"

- `cliente.jpg` 3×3 — woman shopper, brown bob, cream floral blouse, beige skirt, paper bag with bread.
  Riga 1 camminata ×3 (left foot forward, legs passing, right foot forward); riga 2 camminata arrabbiata ×3
  (red face, fists clenched, stomping); riga 3 in coda, porge i soldi, prende dallo scaffale.
- `cassiere.jpg` 3×2 — cashier, low bun, white paper cap, red smock, brown trousers.
  Riga 1 camminata ×3; riga 2 seduta sullo sgabello: mani sulle ginocchia, alza un articolo, batte sui tasti (no bancone).
- `magazziniere.jpg` 3×2 — stock boy, white cap, green work coat, grey trousers.
  Riga 1 camminata a mani vuote ×3; riga 2 camminata con scatolone ×3.

## Clienti (milestone 10) — 3×3 come `cliente.jpg`, chat nuova per foglio

Stessa testa comune; righe: camminata ×3, camminata arrabbiata ×3, in coda / paga / prende.
- `mamma.jpg` — giovane mamma (ricci scuri, giubbotto di jeans, gonna rossa) che tiene per mano il figlio biondo (maglietta a righe).
- `vecchietta.jpg` — vecchietta coi capelli bianchi raccolti, occhiali, cardigan grigio, bastone e cestino.
- `giovane.jpg` — ragazzo di 20 anni anni '80, giacca a vento turchese, jeans stonewashed, cuffie del walkman al collo.
- `ponzone.jpg` — Signor Ponzone: signore pomposo e panciuto, baffi arricciati, gessato blu doppiopetto, catena d'oro, naso all'insù; arrabbiato viola in faccia col pugno alzato; paga con una banconota grossa.
- `orso.jpg` — grande orso bruno simpatico in piedi, sciarpa rossa, cestino di vimini; arrabbiato ringhia coi denti; paga con una moneta d'oro.
