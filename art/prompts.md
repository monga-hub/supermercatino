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

## Sporco e pulizie (milestone 12) — chat nuova per foglio

- `pulizie.jpg` 3×2 (testa comune dei personaggi) — addetta pulizie di mezza età, permanente riccia grigio-castana, grembiule azzurro col colletto bianco, guanti gialli, zoccoli bianchi, mocio. Riga 1 camminata col mocio dritto ×3; riga 2 passa il mocio ×3 (sinistra, centro, destra, bolle di sapone).
- `sporco.jpg` 3×2 (testa comune degli arredi) — pozza di yogurt bianco col vasetto rovesciato, schizzo di yogurt alla fragola, pozza di latte (tutte schiacciate come decalcomanie sul pavimento); cestino verde anni '80 su palo; icona tonda crema col bordo marrone e una spugna gialla con le bolle; cartello giallo "pavimento bagnato" senza scritte.

## Banco salumi (milestone 13) — chat nuova per foglio

- `bancone.jpg` 3×1 (testa comune degli arredi) — banco salumi in legno scuro con vetrina curva piena di prosciutto, salame, mortadella e formaggi e un'affettatrice rossa tipo Berkel sopra; lo stesso con la vetrina vuota; pacchetto di affettato incartato.
- `banconiere.jpg` 4×2 (testa comune dei personaggi, "NO counter, NO slicer") — salumiere cinquantenne grassoccio, calvo coi baffi grigi, cappellino di carta bianco, camice bianco, grembiule a righe bianche e rosse. Riga 1: camminata ×3, fermo con le mani sulla pancia; riga 2: affetta (braccio avanti, braccio indietro), porge il pacchetto, saluta.

## Imprevisti (milestone 14)

- `ispettore.jpg` 3×3 (testa comune dei personaggi) — ispettore sanitario magro e severo, capelli neri impomatati, baffetti, occhiali tondi, impermeabile beige, cartellina e penna. Righe: camminata rigida ×3; camminata scrivendo ×3; fermo che scruta, spunta la cartellina, annusa disgustato.
- `imprevisti.jpg` 3×1 — chiesto nella chat delle icone ("same style"): icona tonda col carrello, icona tonda con cartellina e timbro, carrello rosso anni '80 con sacchetto di carta in iso. Gemini ha fatto un layout irregolare: ritagliato a mano in un 3×1 (carrello, icona carrello, icona ispezione).

## Il Furbetto (milestone 15)

- `furbetto.jpg` 3×3 come `cliente.jpg`: ragazzo anni '80 col giubbotto di pelle marrone e jeans; righe camminata, si infila (furtivo), scappa con la merce (angry).
- `beccato.jpg` 1×1 — chiesto nella chat delle icone ("same style"): icona tonda con cappello da vigile e fischietto.

## Forno e frigo (milestone 17)

- `forno.jpg` 2×2 — chiesto nella chat delle icone ("NOT round icons: game furniture sprites" + stile base, ogni pezzo largo una cella): bancone del pane con forno a legna in mattoni acceso e cesta piena di pagnotte, baguette e rosette; lo stesso spento e vuoto; frigo bianco anni '80 con porta a vetri pieno di latte, yogurt e formaggi; lo stesso vuoto e spento.

## Spogliatoio (milestone 18)

- `spogliatoio.jpg` 3×1 — chiesto nella chat delle icone: armadietti metallici verde pallido anni '80 con panca di legno, grembiule e thermos (stile arredi del forno); icona tonda con tazzina di espresso fumante (pausa caffè); icona tonda faccina che sbadiglia con goccia di sudore e zzz (stanco). Gemini ha allargato gli armadietti oltre la prima colonna: ricomposto con PIL in 3 colonne da 800 px.

## Guardia e capo reparto (milestone 19) — chat nuova per foglio, testa comune dei personaggi

- `guardia.jpg` 3×2 — guardia giurata anni '80 robusta, baffoni neri, divisa blu con berretto a visiera e distintivo argento, camicia azzurra, cravatta scura, fischietto al collo. Riga 1 camminata ×3; riga 2 ferma con le mani dietro la schiena, fischia indicando col braccio alzato, palmo alzato "alt".
- `capo.jpg` 3×2 — capo reparto magro e pignolo sui quarant'anni, capelli grigi all'indietro, occhialoni squadrati, camicia bianca a maniche corte con la penna nel taschino, cravatta marrone larga, pantaloni beige, mocassini, cartellina. Riga 1 camminata svelta con la cartellina sotto il braccio ×3; riga 2 fermo con la cartellina, scrive, indica con la penna.

## Playtest 2026-11-27 (milestone 24) — chat nuova per foglio

- `pareti2.jpg` 4×1 — pannelli frontali piatti (non isometrici): muro esterno intonaco crema + mattoni con finestra; muro interno piastrelle bianche con fascia blu e rossa; muro esterno con poster della pasta; porta scorrevole di vetro. `tools/kit.py` taglia la fascia sbiadita in alto (`WALL_TOP`).
- `serranda.jpg` 2×1 — saracinesca da supermercato, pannelli frontali piatti: APERTA (binari grigi, cassonetto arrotolato in alto con fascia gialla-nera, vano vuoto bianco) e CHIUSA. Il kit usa solo quella aperta; il vano bianco diventa trasparente.
- `cassa.jpg` 3×1 (testa comune degli arredi) — banco cassa dritto e stretto col nastro nero e il registratore in fondo, in diagonale da basso-sinistra ad alto-destra, niente U; lo stesso col cassetto aperto (non usato); sgabello rosso.
- `cassiere_m.jpg` 3×2 (testa comune dei personaggi) — cassiere giovane, ricci scuri, baffetti, cappellino di carta, camice rosso. Riga 1 camminata ×3; riga 2 seduto sullo sgabello: mani sulle ginocchia, alza un articolo, batte i tasti.
- `magazziniera.jpg` 3×2 — magazziniera giovane, coda di cavallo, cappellino bianco, camice verde. Riga 1 camminata ×3; riga 2 con lo scatolone ×3.
