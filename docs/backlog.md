# Backlog

> Out-of-scope ideas, feature requests, and follow-ups captured during sessions but **not** worked on in the session that captured them. Read at the start of every milestone-creation conversation. Append-only — promoted items get a checkbox tick and a link to the milestone that absorbed them, not a deletion.
>
> If an item turns out to be wrong / no longer wanted, mark it `~~struck through~~` with a one-line reason rather than removing it; future sessions need to see that it was considered and rejected.

## How to write a backlog entry

```
- [ ] <short title> — <one-sentence description of the desired behavior or change>
  - Source: <session date or user message that introduced it>
  - Rough size: <S | M | L> · Rough value: <S | M | L>
  - Notes: <optional — constraints, dependencies, related milestones, references>
```

Promoted → `[x]` + `→ milestone NN-<slug>.md`. Rejected → `~~title~~` + `Rejected: <reason>`.

## Gameplay & features

- [x] Staff e assunzioni — lista candidati (stipendio vs abilità/tratto), 4 ruoli (Cassiere, Magazziniere, Addetto pulizie, Banconiere); il cassiere sostituisce la cassa automatica del milestone 03.
  - Source: gameplan v1, milestone planning 2026-11-26
  - Rough size: L · Rough value: L
  - Notes: spezzato: cassiere → milestone 04-assumi-il-cassiere.md, magazziniere → milestone 05-rifornisci-gli-scaffali.md; pulizie e banconiere restano da pianificare.
- [x] Rifornimento — ordini merce per categoria, consegna in magazzino, il magazziniere la porta agli scaffali; sostituisce lo stock fisso del 03.
  - Source: gameplan v1, milestone planning 2026-11-26
  - Rough size: M · Rough value: L
  - Notes: dipende da staff (magazziniere). → milestone 05-rifornisci-gli-scaffali.md
- [x] Economia giornaliera — affitto, stipendi, costo merce; riepilogo a fine giornata.
  - Source: gameplan v1
  - Rough size: M · Rough value: L
  - Notes: → milestone 06-fine-giornata-e-obiettivi.md
- [x] Reputazione → afflusso — 0–100%, sale con clienti soddisfatti, scende con arrabbiati, determina il tasso di arrivo.
  - Source: gameplan v1
  - Rough size: S · Rough value: L
  - Notes: → milestone 06-fine-giornata-e-obiettivi.md
- [x] Tipi cliente — Nonna con la lista, Studente fuori sede, Mamma di fretta, Furbetto (salta fila/taccheggia).
  - Source: gameplan v1
  - Rough size: M · Rough value: L
  - Notes: il Furbetto richiede staff vicino alle casse. In parte → milestone 10-clienti-diversi.md (mamma, vecchietta, giovane, Ponzone, orso); Furbetto → milestone 15-il-furbetto.md.
- [ ] Stanze e oggetti restanti — banco salumi, forno, spogliatoio staff; frigo, bancone, affettatrice, forno, cestino.
  - Source: gameplan v1
  - Rough size: M · Rough value: M
  - Notes: banco salumi + bancone + banconiere → milestone 13-banco-salumi.md; cestino → 12; forno e frigo → milestone 17-forno-e-frigo.md; spogliatoio → milestone 18-spogliatoio-e-stanchezza.md.
- [x] Sporco e imprevisti — yogurt rovesciato, carrello incastrato, ispezione sanitaria.
  - Source: gameplan v1
  - Rough size: M · Rough value: M
  - Notes: dipende da addetto pulizie. Sporco + addetto pulizie → milestone 12-sporco-e-pulizie.md; carrello incastrato e ispezione sanitaria → milestone 14-imprevisti.md.
- [x] Obiettivi livello, vittoria e sconfitta — soglie cassa/reputazione/clienti entro N giornate; bancarotta o reputazione minima.
  - Source: gameplan v1
  - Rough size: M · Rough value: L
  - Notes: → milestone 06-fine-giornata-e-obiettivi.md
- [x] Forno e frigo — stanza forno col fornaio (il pane come i salumi al banco) e frigo per i latticini.
  - Source: milestone planning 2026-11-26 (rimandato dopo 14–16)
  - Rough size: M · Rough value: M
  - Notes: → milestone 17-forno-e-frigo.md
- [x] Guardia / vigilante — ruolo staff vicino alle casse che ferma il furbetto da solo (automazione del tocco del 15).
  - Source: milestone planning 2026-11-26
  - Rough size: S · Rough value: S
  - Notes: → milestone 19-guardia-e-capo-reparto.md
- [x] Capo reparto / automazione completa — dipendente o potenziamento che rende inutili i tocchi su scaffali e casse (curva "tocco tutto" → "automatizzo", ADR-0002).
  - Source: user 2026-11-26
  - Notes: → milestone 19-guardia-e-capo-reparto.md

- [x] Barra strumenti raggruppata — con 16 tasti (6 stanze + 8 oggetti + Ruota/Demolisci) su telefono occupa 3–4 righe; raggruppare in "Stanze" / "Arredi" a tendina.
  - Source: milestone 18 (2026-11-26)
  - Rough size: S · Rough value: M
  - Notes: → milestone 21-interfaccia-facile.md

- [x] Campagna a livelli — negozi prestabiliti, arredi e staff, una meccanica nuova per livello, interfaccia più facile.
  - Source: utente 2026-11-27
  - Rough size: L · Rough value: L
  - Notes: → milestone 20-campagna-negozi-prestabiliti.md, 21-interfaccia-facile.md, 22-livelli-4-7.md (ADR-0003)

- [ ] Stanze da costruire nei livelli — un pezzo di lotto libero per espandere il negozio prestabilito.
  - Source: milestone planning 2026-11-27 (scartato per ora dall'utente: stanze fisse)
  - Rough size: M · Rough value: S

- [ ] Stelle o punteggio per livello — rigiocare i livelli per fare meglio.
  - Source: milestone planning 2026-11-27
  - Rough size: S · Rough value: S

- [x] Salvataggio locale — stato sim serializzato in localStorage. → milestone 11-salvataggio-e-menu.md
  - Source: gameplan v1
  - Rough size: S · Rough value: M
- [x] Menu e schermate — menu iniziale, briefing livello, fine livello. → milestone 11-salvataggio-e-menu.md (la schermata di fine livello c'è dal 06)
  - Source: gameplan v1
  - Rough size: S · Rough value: M

## Polish & juice

- [ ] Lavoratori come Theme Hospital: umore, abilità che crescono, promozioni; prenderli in mano e spostarli.
  - Source: utente 2026-11-27 (screenshot scheda di Theme Hospital)
  - Rough size: M · Rough value: M
- [ ] Cassiera che sparisce durante il livello 1 — non riprodotta; servono dettagli (quando, dopo cosa).
  - Source: playtest utente 2026-11-27
  - Rough size: S · Rough value: H

- [ ] Vetrine, finestre e tenda a righe sulla facciata; clienti che arrivano a piedi dal marciapiede invece di comparire sulla porta.
  - Source: milestone 21b, 2026-11-27
  - Rough size: M · Rough value: M
  - Notes: servono pezzi di muro Gemini con la finestra (l/r) e un tratto di cammino fuori dal lotto (solo grafica o sim?).

- [ ] Più folla — Theme Hospital ha decine di personaggi piccoli in coda, guardarli è metà del divertimento; da noi pochi clienti grandi. Più clienti (più lenti a spendere?) o camera più lontana.
  - Source: confronto Theme Hospital, 2026-11-27
  - Rough size: M · Rough value: M
  - Notes: tocca il bilanciamento (spawn, obiettivi): rifare `output/balance.ts` e `output/levels-balance.ts`.

- [x] Esterno, decorazioni e muri leggibili (confronto Theme Hospital) → milestone 21b-atmosfera.md
  - Source: confronto Theme Hospital, 2026-11-27
  - Rough size: M · Rough value: L

- [x] Fila visibile — chi aspetta alla cassa si mette in coda su celle diverse invece di sovrapporsi sulla stessa.
  - Source: milestone 03, 2026-11-26
  - Rough size: S · Rough value: M
  - Notes: → milestone 08-rifiniture-rapide.md; oggi la fila è solo logica (`queuedAt`); serve scegliere celle di coda libere davanti alla cassa.

- [x] Sprite dipinti AI — sostituire i placeholder con sprite iso dipinti, foglio di stile/prompt unico.
  - Source: milestone planning 2026-11-26 (utente: placeholder ora, sprite AI dopo il 03; poi rimandato a dopo il 06, decisione utente 2026-11-26)
  - Rough size: L · Rough value: L
  - Notes: → milestone 07-sprite-dipinti.md; richiede di chiudere l'open question su strumento AI e formato atlas; riferimento moodboard `spesa-nonna`.
- [x] Audio — muzak in loop, annunci comici all'altoparlante, SFX (bip cassa, carrello, rovescio). → milestone 16-audio.md
  - Source: gameplan v1
  - Rough size: M · Rough value: M

- [x] Animazioni dei personaggi — un foglio Gemini per personaggio: camminata in 3 passi, azione principale (cliente prende dallo scaffale / cassiera batte lo scontrino / magazziniere scarica), arrabbiatura; diverso per ogni personaggio. Oggi sembrano "manichini che si muovono".
  - Source: utente 2026-11-26 (playtest 07)
  - Rough size: M · Rough value: L
  - Notes: rischio: Gemini non tiene lo stesso personaggio identico tra i frame; provare a dare il foglio attuale come riferimento. kit.py va esteso a griglie N×M per personaggio + animazioni Phaser. → milestone 07b-animazioni-personaggi.md

- [x] Pareti sui due lati posteriori — muri sui bordi in alto a sinistra e in alto a destra delle stanze (quelli rivolti verso il giocatore), stile Theme Hospital.
  - Source: utente 2026-11-26 (playtest 07)
  - Rough size: M · Rough value: M
  - Notes: sprite muro (2 orientamenti) da Gemini; i muri non devono coprire le stanze davanti; porta incassata nel muro. → milestone 09-sembra-un-supermercato.md

- [ ] Quattro orientamenti veri per scaffali e casse (oggi due, con lo specchio) — servono sprite visti da dietro.
  - Source: milestone 09, 2026-11-26
  - Rough size: M · Rough value: S

- [x] ~~Muri interni tra stanze diverse~~ → milestone 23-interfaccia-insegna.md. Restano le icone faccina felice/arrabbiata e cestino già nel kit da usare nell'HUD.
  - Source: milestone 09, 2026-11-26
  - Rough size: S · Rough value: S

## Tech & refactors

- [x] Clienti e demolizioni — se demolisci il pavimento o lo scaffale verso cui un cliente sta camminando, il cliente finisce il percorso vecchio.
  - Source: milestone 03, 2026-11-26
  - Rough size: S · Rough value: S
  - Notes: → milestone 08-rifiniture-rapide.md; ricalcolare i percorsi dopo ogni comando di costruzione, o vietare la demolizione con clienti dentro.

- [ ] Upgrade dipendenze del template — `npm audit` segnala vulnerabilità high (nanoid, picomatch via Vite 6.3); valutare Vite/Phaser più recenti (Phaser 4.2.1 disponibile).
  - Source: scaffold 2026-11-26
  - Rough size: S · Rough value: S

## Tooling & QA

- [x] Deploy su GitHub Pages — workflow `.github/workflows/deploy.yml` che a ogni push su main fa `npm run build-nolog` e pubblica `dist/` su https://monga-hub.github.io/supermercatino/ per testare da qualsiasi dispositivo.
  - Source: utente 2026-11-26 ("aspettiamo che ci sia qualcosa di vero da provare")
  - Rough size: S · Rough value: M
  - Notes: da fare a fine milestone 01, quando c'è griglia/camera da provare su telefono. Pagina pubblica (repo pubblico). → milestone 01-il-negozio-esiste.md (Pages attivo dal 2026-11-26, sito online)

## Open questions

- [x] Strumento AI per gli sprite e formato atlas — Gemini (decisione utente 2026-11-26) + atlas PNG/JSON fatto in casa → milestone 07-sprite-dipinti.md
  - Source: gameplan
- [x] Fonte audio — muzak/annunci AI, CC0 o sintesi vocale? → sintetizzato, milestone 16-audio.md
  - Source: gameplan
- [ ] "Online più avanti" — classifiche o condivisione negozi?
  - Source: gameplan
- [ ] Prezzi regolabili dal giocatore o fissi? (default v1: fissi)
  - Source: gameplan
