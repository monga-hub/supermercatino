# Milestone 21: Interfaccia facile

## Status

planned

## Objective

Rendere il gioco leggibile per chi lo apre la prima volta, soprattutto sul telefono. Oggi la barra in basso ha fino a 16 tasti di testo su 3–4 righe, gli obiettivi si vedono solo nei riepiloghi, nessuno spiega cosa fanno le icone da toccare. Dopo il 20 i livelli dicono *cosa* imparare; questo milestone dice *come*, dentro la partita.

## Scope

- Barra in basso a gruppi: **Arredi**, **Staff**, **Merce**, **Attrezzi** (Ruota/Demolisci). Ogni gruppo apre una fila con icona dello sprite e prezzo; su telefono sta su una riga.
- Obiettivi sempre visibili in alto: tre barre (cassa, reputazione, serviti) con giorni rimasti.
- Guida passo passo nel livello 1: lista di passi ("Metti uno scaffale di Pasta", "Metti la cassa", "Assumi un cassiere", "Premi 1x", "Tocca 💰"); freccia/evidenziatura sul tasto o sulla cella del passo corrente; il passo si spunta da solo quando la sim lo vede fatto.
- Fumetto "Novità" la prima volta che compare in partita una meccanica del livello (prima icona 📦, prima macchia, primo furbetto...): una frase, si chiude con un tocco; ricordato nei progressi.
- Testi nitidi sul telefono (risoluzione del testo Phaser = devicePixelRatio).
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

- [ ] La barra mostra solo i gruppi, e ogni gruppo solo le voci sbloccate dal livello — test: `scripts/browser-test.mjs`
- [ ] I passi della guida del livello 1 si spuntano da soli in ordine — test: `tests/tutorial.test.ts`
- [ ] Ogni "Novità" compare una volta sola, anche dopo il ricaricamento — test: `tests/tutorial.test.ts`
- [ ] Barre obiettivi in alto coerenti con la sim — test: `scripts/browser-test.mjs` (`render_game_to_text`)
- [ ] Su telefono verticale e orizzontale la barra sta su una riga e niente si sovrappone — screenshot Playwright a 390×844 e 844×390
- [ ] A 390×844 il negozio del livello 1 occupa almeno metà dell'altezza e l'HUD in alto al massimo una riga più le barre — screenshot Playwright
- [ ] Un giocatore nuovo finisce il livello 1 seguendo solo la guida — verified by user playtest

## Exit condition

L'utente fa giocare il livello 1 a qualcuno che non l'ha mai visto: segue le frecce, apre i gruppi della barra senza aiuto, e capisce cosa sono 💰 e 📦 dai fumetti.

## Test plan

- Test rossi: `tests/tutorial.test.ts` (passi e novità sono logica sim/progressi, senza Phaser), poi browser e screenshot.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Punti 1, 6, 7, 8 del confronto con Theme Hospital (2026-11-27); i punti 2, 3, 5 (esterno, decorazioni, muri) vanno nel 21b.
- Assorbe il backlog "Barra strumenti raggruppata" (milestone 18) e la nota di STATE sui testi sfocati su retina.
