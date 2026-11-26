# ADR-0002: Tocchi ibridi (tocca per accelerare)

- Status: accepted
- Date: 2026-11-26
- Deciders: utente, Claude

## Context

Il gioco si prova solo da telefono. Il loop alla Theme Hospital (costruisci e guarda girare) lascia il giocatore passivo tra una costruzione e l'altra. L'utente ha proposto un modello "alla Hay Day": scaffale vuoto → tocchi → il magazziniere lo riempie; cliente alla cassa → tocchi l'icona dei soldi → incassi.

## Decision

Modello **ibrido**: i tocchi accelerano e premiano, l'automatismo resta ma è più lento.

- Scaffali: tocco = mette in coda con priorità; senza tocco il magazziniere rifornisce solo scaffali quasi vuoti.
- Casse: tocco = incasso immediato + mancia; senza tocco il cassiere chiude da solo dopo qualche secondo (la cassa resta occupata nel frattempo).
- In futuro dipendenti/potenziamenti (es. capo reparto) tolgono il bisogno di toccare: la curva va da "tocco tutto" a "automatizzo".

## Alternatives

- **Tutto a tocchi** (senza tocco non succede niente): più attivo, ma noioso con negozi grandi e svuota il senso dello staff.
- **Tutto automatico** (com'era): meno adatto al telefono, giocatore passivo.

## Consequences

- Nuovi comandi `restock` e `collect`; nuovo stato cliente `ready`; coda `restockQueue`.
- Le velocità 2x/3x restano ma con i tocchi diventano più frenetiche: da osservare in playtest.
- Il milestone 06 (obiettivi) tiene conto delle mance.
- Milestone: [05b](../milestones/05b-tocca-per-accelerare.md).
