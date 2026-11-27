# Milestone 21: Interfaccia facile

## Status

implemented (in attesa di playtest)

## Objective

Rendere il gioco leggibile per chi lo apre la prima volta, soprattutto sul telefono. Oggi la barra in basso ha fino a 16 tasti di testo su 3–4 righe, gli obiettivi si vedono solo nei riepiloghi, nessuno spiega cosa fanno le icone da toccare. Dopo il 20 i livelli dicono *cosa* imparare; questo milestone dice *come*, dentro la partita.

## Scope

- Barra in basso a gruppi: **Arredi**, **Staff**, **Merce** (Attrezzi tolto dopo il playtest: ruota/togli con la pressione lunga, Audio nel menu ⚙). Ogni gruppo apre una fila con icona dello sprite e prezzo; su telefono sta su una riga.
- Obiettivi sempre visibili in alto: tre barre (cassa, reputazione, serviti) con giorni rimasti.
- Guida passo passo nel livello 1: lista di passi ("Metti uno scaffale di Pasta", "Metti la cassa", "Assumi un cassiere", "Premi 1x", "Tocca 💰"); freccia/evidenziatura sul tasto o sulla cella del passo corrente; il passo si spunta da solo quando la sim lo vede fatto.
- Fumetto "Novità" la prima volta che compare in partita una meccanica del livello (prima icona 📦, prima macchia, primo furbetto...): una frase, si chiude con un tocco; ricordato nei progressi.
- Testi nitidi sul telefono (risoluzione del testo Phaser = devicePixelRatio).
- **Pressione lunga su un arredo** (richiesta utente 2026-11-27): tre icone sopra l'oggetto, ✋ sposta (poi tocca la cella), 🔄 gira, 🗑 togli (rimborso a metà). Spostare è gratis e segue le regole del piazzamento.
- Messaggi di errore più chiari dove servono (es. "Lo scaffale va nella sala vendita (pavimento giallo)").
- **Il mondo riempie lo schermo** (confronto con Theme Hospital, 2026-11-27): HUD in alto su una riga (giorno, ora, €, velocità) con icone al posto delle parole; Audio e Staff fuori dalla fila delle velocità; stats e obiettivi nelle barre; la camera del livello riempie lo spazio libero tra HUD e barra, niente vuoto marrone sopra e sotto.
- **Tasti con icone**: frame del kit (scaffale, cassa, persona, cassa di merce, martello) al posto delle sole parole.
- **Pina consigliera**: i passi della guida e le "Novità" li dice un personaggio con la faccia in un fumetto in basso (come il consigliere di Theme Hospital), non una banda nera. Faccia della signora Pina dal kit o un ritaglio Gemini.

## Out of scope

- Nuovi sprite per l'HUD oltre a quelli del kit (si usano i frame esistenti).
- Impostazioni, lingue, accessibilità avanzata.

## Dependencies

- **Depends on:** 20 (livelli, sblocchi, progressi)
- **Blocks:** 21b, 22 (i fumetti "Novità" servono alle meccaniche dei livelli 4–7)

## Acceptance criteria

- [x] La barra mostra solo i gruppi, e ogni gruppo solo le voci sbloccate dal livello — test: `scripts/browser-test.mjs`
- [x] I passi della guida del livello 1 si spuntano da soli in ordine — test: `tests/tutorial.test.ts`
- [x] Ogni "Novità" compare una volta sola, anche dopo il ricaricamento — test: `tests/tutorial.test.ts`
- [x] Barre obiettivi in alto coerenti con la sim — test: `scripts/browser-test.mjs` (`render_game_to_text`)
- [x] Su telefono verticale e orizzontale la barra sta su una riga e niente si sovrappone — screenshot Playwright a 390×844 e 844×390
- [x] A 390×844 il negozio del livello 1 occupa tutta la larghezza e l'HUD in alto è una riga più le barre (72 px) — screenshot Playwright `output/21-test-390x844.png`. Metà dell'altezza non si può: il rombo isometrico è largo il doppio che alto, in verticale lo limita la larghezza; il vuoto sopra e sotto lo riempie l'esterno del 21b.
- [x] Spostare un arredo lo tiene uguale (merce, scorte) e gratis, con le regole del piazzamento; cassiere e fila seguono la cassa spostata — test: `tests/edit.test.ts`
- [x] Pressione lunga apre le tre icone; sposta, gira e togli funzionano col dito — test: `scripts/browser-test.mjs`
- [ ] Un giocatore nuovo finisce il livello 1 seguendo solo la guida — verified by user playtest

## Exit condition

L'utente fa giocare il livello 1 a qualcuno che non l'ha mai visto: segue le frecce, apre i gruppi della barra senza aiuto, e capisce cosa sono 💰 e 📦 dai fumetti.

## Test plan

- Test rossi: `tests/tutorial.test.ts` (passi e novità sono logica sim/progressi, senza Phaser), poi browser e screenshot.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Punti 1, 6, 7, 8 del confronto con Theme Hospital (2026-11-27); i punti 2, 3, 5 (esterno, decorazioni, muri) vanno nel 21b.
- Assorbe il backlog "Barra strumenti raggruppata" (milestone 18) e la nota di STATE sui testi sfocati su retina.
- Implementazione:
  - `src/sim/tutorial.ts`: `GUIDE` (8 passi del livello 1, `guideStep` = primo non fatto), `NEWS` (10 "Novità": conto, scaffale, macchia, carrello, furbetto, ispettore, Ponzone, orso, pane, stanchezza), `newsDue`, `markSeen`. `GameState.taps` conta i tocchi del giocatore per tipo. `Progress.seen` ricorda le novità già viste.
  - HUD: in alto ora, giorno, velocità e € su una riga; tre barre obiettivo (sotto su telefono verticale, accanto se largo ≥700 px). In basso gruppi Arredi (Costruisci nel Negozio libero, con stanze e porta) / Staff / Merce; Ruota e Demolisci passano alla pressione lunga (anche sulle stanze vuote del Negozio libero, solo 🗑), Audio al menu ⚙ in alto a destra (Continua / Audio / Nuova partita, mette in pausa mentre è aperto); le voci hanno l'icona del kit e il prezzo.
  - Pina (`signora_idle`) parla in un fumetto sopra la barra (accanto in orizzontale); freccia gialla sul tasto, sulla stanza o sull'icona del passo. Le novità coperte dalla guida (💰, 📦) si segnano viste.
  - Testo nitido: canvas a `devicePixelRatio` (max 3) con `zoom 1/DPR` (`src/game/dpr.ts`, `main.ts`); la camera dell'HUD zooma di DPR, quindi il layout resta in px CSS.
  - Hook nuovi per i test: `hudButtons()`, `hudText()`.
  - Pressione lunga (450 ms, senza strumento) su un oggetto: `Game.edit`, cella evidenziata in giallo; comando sim `move` (check = piazzamento gratis senza l'oggetto). Novità 'edit' la prima volta che c'è un arredo.
  - Magazzino (richiesta utente 2026-11-27): i cubi colorati di prova sono diventati bancali dipinti, uno per categoria (`art/sheets/magazzino.jpg`, Gemini chat nuova, frame `merce_<Categoria>`).
  - Dopo playtest (2026-11-27): icone da toccare (soldi alla cassa, riempi scaffale) con pulse e glow giallo (filtro Phaser 4, solo WebGL).
