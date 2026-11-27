# Milestone 21b: Atmosfera

## Status

implemented (in attesa di playtest)

## Objective

Far sembrare il negozio un posto vero dentro una città, come l'ospedale di Theme Hospital dentro il suo prato. Oggi il negozio galleggia in un vuoto marrone su una griglia grigia, le stanze sono spoglie e i muri alti nascondono il magazzino. Solo grafica: niente cambia nella sim.

## Scope

- **Esterno**: fuori dal lotto marciapiede con lampioni, strada con una Fiat 127 o un Ape che passa ogni tanto, aiuole e alberi, parcheggio con le auto. I clienti arrivano dal marciapiede. Lo sfondo vuoto sparisce.
- **Facciata**: insegna col nome del negozio sopra la porta (nome del livello, o "Il Supermercatino" nel Negozio libero), vetrine sul muro della sala verso la strada, tenda a righe.
- **Decorazioni dentro**, solo grafica e messe dal livello, non dal giocatore: piante, cartelli dei reparti appesi, estintore, calendario, radio sul banco, ceste. Nel Negozio libero si mettono da sole lungo i muri.
- **Muri leggibili**: muri bassi o tagliati come Theme Hospital, così si vede dentro tutte le stanze; finestre sui muri esterni; muro con passaggio tra magazzino e sala; pavimento del magazzino più chiaro.
- Sprite Gemini nuovi: tile esterni (marciapiede, asfalto, erba), auto, alberi, insegna, vetrina, pacchetto decorazioni.

## Out of scope

- Decorazioni comprabili che cambiano l'umore dei clienti (le piante di Theme Hospital): idea per il backlog.
- Più folla: backlog, tocca il bilanciamento.
- Giorno e notte, meteo.

## Dependencies

- **Depends on:** 21 (layout dello schermo: la camera e lo spazio intorno al negozio cambiano lì)
- **Blocks:** 22 (i negozi grandi dei livelli 4–7 nascono già con esterno e decorazioni)

## Acceptance criteria

- [x] Ogni livello ha strada e marciapiede sul lato della porta e nessuna cella di sfondo vuoto nell'inquadratura — `tests/scenery.test.ts` + screenshot Playwright 390×844 e 844×390 (conta i pixel del vecchio sfondo)
- [x] Le decorazioni non bloccano celle: arredi, clienti e staff passano come prima — test: `tests/scenery.test.ts`
- [x] I muri non coprono nessun arredo o personaggio dentro le stanze — solo muri sul retro (già da 09, `tests/walls.test.ts`), screenshot Playwright
- [x] Frame nuovi nel kit — test: `tests/scenery.test.ts`, `tests/assets.test.ts`
- [ ] Guardando il livello 1 sembra una bottega in una via italiana anni '80 — verified by user playtest

## Exit condition

L'utente apre il livello 1 sul telefono e vede una bottega su una strada, con insegna, vetrine e piante; dentro si vede tutto, magazzino compreso.

## Test plan

- Test rossi: decorazioni nei dati del livello in `tests/levels.test.ts`, poi assets, poi screenshot.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Nasce dal confronto con Theme Hospital del 2026-11-27 (punti 2, 3, 5). I punti 1, 6, 7, 8 sono nel 21; il punto 4 (folla) è nel backlog.
- Implementazione (`src/render/scenery.ts`, puro):
  - `terrain`: fuori dal lotto prato; lungo il lato +x (dove guardano tutte le porte della campagna) marciapiede, due corsie con la linea tratteggiata, marciapiede. Disegnato per 24 celle intorno; oltre, lo sfondo della camera è dello stesso verde, quindi non resta mai vuoto.
  - `props`: lampioni, fioriere e panchine sui marciapiedi (davanti al negozio solo fioriere), alberi, cipressi e cespugli sul prato con un hash fisso, lontani dalla facciata. `carAt`: ogni 16 s una macchina (127 rossa, Ape, Panda bianca) passa sulla corsia vicina.
  - `decor`: negli angoli delle stanze piante, estintore, sagoma del pomodoro (sala), ceste (casse), scopa e secchio (magazzino); spariscono dove metti un arredo.
  - Insegna col nome del livello sopra la porta (testo Phaser nel mondo, "Il Supermercatino" nel Negozio libero). Piazzale del lotto in pietra chiara, pavimento del magazzino in cemento chiaro.
  - Fogli Gemini in chat nuove: `esterno.jpg` 3×3, `interni.jpg` 3×2.
- Non fatto, nel backlog: vetrine e finestre sui muri (servono pezzi di muro nuovi), tenda a righe, clienti che arrivano camminando dal marciapiede (oggi compaiono sulla porta).

