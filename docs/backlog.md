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

- [ ] Staff e assunzioni — lista candidati (stipendio vs abilità/tratto), 4 ruoli (Cassiere, Magazziniere, Addetto pulizie, Banconiere); il cassiere sostituisce la cassa automatica del milestone 03.
  - Source: gameplan v1, milestone planning 2026-11-26
  - Rough size: L · Rough value: L
  - Notes: candidato naturale per il milestone 04; probabilmente da spezzare (cassiere+magazziniere prima, pulizie+banconiere dopo).
- [ ] Rifornimento — ordini merce per categoria, consegna in magazzino, il magazziniere la porta agli scaffali; sostituisce lo stock fisso del 03.
  - Source: gameplan v1, milestone planning 2026-11-26
  - Rough size: M · Rough value: L
  - Notes: dipende da staff (magazziniere).
- [ ] Economia giornaliera — affitto, stipendi, costo merce; riepilogo a fine giornata.
  - Source: gameplan v1
  - Rough size: M · Rough value: L
- [ ] Reputazione → afflusso — 0–100%, sale con clienti soddisfatti, scende con arrabbiati, determina il tasso di arrivo.
  - Source: gameplan v1
  - Rough size: S · Rough value: L
- [ ] Tipi cliente — Nonna con la lista, Studente fuori sede, Mamma di fretta, Furbetto (salta fila/taccheggia).
  - Source: gameplan v1
  - Rough size: M · Rough value: L
  - Notes: il Furbetto richiede staff vicino alle casse.
- [ ] Stanze e oggetti restanti — banco salumi, forno, spogliatoio staff; frigo, bancone, affettatrice, forno, cestino.
  - Source: gameplan v1
  - Rough size: M · Rough value: M
- [ ] Sporco e imprevisti — yogurt rovesciato, carrello incastrato, ispezione sanitaria.
  - Source: gameplan v1
  - Rough size: M · Rough value: M
  - Notes: dipende da addetto pulizie.
- [ ] Obiettivi livello, vittoria e sconfitta — soglie cassa/reputazione/clienti entro N giornate; bancarotta o reputazione minima.
  - Source: gameplan v1
  - Rough size: M · Rough value: L
- [ ] Salvataggio locale — stato sim serializzato in localStorage.
  - Source: gameplan v1
  - Rough size: S · Rough value: M
- [ ] Menu e schermate — menu iniziale, briefing livello, fine livello.
  - Source: gameplan v1
  - Rough size: S · Rough value: M

## Polish & juice

- [ ] Sprite dipinti AI — sostituire i placeholder con sprite iso dipinti, foglio di stile/prompt unico.
  - Source: milestone planning 2026-11-26 (utente: placeholder ora, sprite AI dopo il 03)
  - Rough size: L · Rough value: L
  - Notes: richiede di chiudere l'open question su strumento AI e formato atlas; riferimento moodboard `spesa-nonna`.
- [ ] Audio — muzak in loop, annunci comici all'altoparlante, SFX (bip cassa, carrello, rovescio).
  - Source: gameplan v1
  - Rough size: M · Rough value: M

## Tech & refactors

- [ ] Upgrade dipendenze del template — `npm audit` segnala vulnerabilità high (nanoid, picomatch via Vite 6.3); valutare Vite/Phaser più recenti (Phaser 4.2.1 disponibile).
  - Source: scaffold 2026-11-26
  - Rough size: S · Rough value: S

## Tooling & QA

- [x] Deploy su GitHub Pages — workflow `.github/workflows/deploy.yml` che a ogni push su main fa `npm run build-nolog` e pubblica `dist/` su https://monga-hub.github.io/supermercatino/ per testare da qualsiasi dispositivo.
  - Source: utente 2026-11-26 ("aspettiamo che ci sia qualcosa di vero da provare")
  - Rough size: S · Rough value: M
  - Notes: da fare a fine milestone 01, quando c'è griglia/camera da provare su telefono. Pagina pubblica (repo pubblico). → milestone 01-il-negozio-esiste.md (workflow pronto; attivazione Pages e push in attesa di conferma utente)

## Open questions

- [ ] Strumento AI per gli sprite e formato atlas — da decidere prima del milestone sprite.
  - Source: gameplan
- [ ] Fonte audio — muzak/annunci AI, CC0 o sintesi vocale?
  - Source: gameplan
- [ ] "Online più avanti" — classifiche o condivisione negozi?
  - Source: gameplan
- [ ] Prezzi regolabili dal giocatore o fissi? (default v1: fissi)
  - Source: gameplan
