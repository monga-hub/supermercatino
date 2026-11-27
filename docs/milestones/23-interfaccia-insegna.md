# Milestone 23: Interfaccia "Insegna", muri e scheda del lavoratore

## Status

implemented (in attesa di playtest)

## Objective

Feedback del playtest del 2026-11-27, con gli screenshot di Theme Hospital: il livello 1 era noioso (due giorni degli stessi tocchi, solo signore), i menu "non degni", i muri tra le stanze non si vedevano, mancava una scheda per ogni lavoratore. Questo milestone rifà la grafica di tutta l'interfaccia con una palette nuova, mette i muri tra le stanze come Theme Hospital e dà a ogni lavoratore la sua scheda.

## Scope

- **Livello 1**: un giorno solo (€850, reputazione 45%, 45 serviti; provato con un bot che tocca cassa e scaffali); arrivano anche le vecchiette.
- **Palette "Insegna"**: crema, blu, rosso pomodoro, senape, inchiostro blu scuro: le insegne dei supermercati italiani anni '80. Confrontata con "Formica" (teal, tipo Theme Hospital) e "Tramonto" (S-Sunset7 di Lospec, viola e arancio): scelta perché il blu su crema si legge meglio e stacca dal prato verde. Confronto in `output/palette-confronto.png` (non versionato).
- **Grafica UI disegnata in codice** (nitida a ogni risoluzione, niente Gemini): barre crema in alto e in basso col filo blu, tasti in rilievo (crema normali, blu gruppi, senape attivo, rosso pericolo), card e pannelli crema col bordo blu e i titoli blu, toast blu scuro.
- **Muri Theme Hospital** (poi ristretti alle stanze dello staff nel milestone 24): tra stanze di tipo diverso un muro alto con un varco al centro (una o due celle); la sim fa passare clienti e staff solo dal varco (`Walkable.cross`), e lì non si mettono arredi ("Lascia libero il passaggio"). Sul davanti muretti bassi (taglio), così il negozio resta visibile.
- **Scheda del lavoratore**: tocca un lavoratore nel negozio (o "Scheda" nel pannello Staff): ritratto, nome, ruolo, carattere, barre Energia e Velocità, stipendio, cosa sta facendo; tasti Licenzia e Trova (centra la camera su di lui).

## Out of scope

- Umore dei lavoratori, abilità che crescono, promozioni (Theme Hospital ha Junior/Doctor/Consultant): backlog.
- Prendere in mano un lavoratore e spostarlo (la gru di Theme Hospital): backlog.
- Cassiera che sparisce: non riprodotta (sim e browser la tengono alla cassa tutto il giorno, anche con la cassa ruotata). In attesa di dettagli dall'utente.

## Dependencies

- **Depends on:** 21b
- **Blocks:** 22 (i livelli 4–7 nascono con i muri tra le stanze)

## Acceptance criteria

- [x] Livello 1 dura un giorno, con obiettivi €850 / 45% / 45 serviti e clienti signora e vecchietta (test browser "phone": barre obiettivo).
- [x] Muri tra stanze di tipo diverso con varco al centro; si passa solo dal varco; niente arredi sul varco; muretti bassi sul davanti (`tests/walls.test.ts`).
- [x] Tutta la UI nella palette Insegna: barre, tasti, card, pannelli, fumetto di Pina. Verificato dagli screenshot (telefono dritto e girato); giudizio finale al playtest.
- [x] Toccare un lavoratore apre la sua scheda; Licenzia dalla scheda lo licenzia (test browser "tap a worker").
- [x] Il fumetto di Pina non resta sopra il pannello Staff (bug: `bubbleKey` azzerato da `layout()`).

## Exit condition

L'utente gioca il livello 1 sul telefono in un giorno, vede i muri tra le stanze, apre la scheda di un lavoratore toccandolo e trova i menu all'altezza.

## Notes

- I bottoni HUD si disegnano ogni frame su un Graphics `chrome` sotto i testi (`bevel()`); quelli nelle card e nei pannelli hanno il loro `pill()` dentro il container.
- `hudButtons()` ora tiene conto dell'origine dei testi e del container che scorre: espone anche i tasti di card, pannelli e scheda.
- Telefono girato: il fumetto di Pina va in alto a destra, sotto la barra, e non copre più la fila degli arredi.
