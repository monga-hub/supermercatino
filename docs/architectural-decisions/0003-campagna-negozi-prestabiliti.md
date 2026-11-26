# ADR-0003: Campagna a negozi prestabiliti

- Status: accepted
- Date: 2026-11-27
- Deciders: utente, Claude

## Context

Dopo 19 milestone il gioco ha 6 stanze, 8 oggetti, 6 ruoli, 8 tipi cliente e 4 imprevisti, tutti disponibili dal primo minuto su un lotto vuoto. Un giocatore nuovo non sa da dove cominciare. L'utente vuole che entri nelle meccaniche gradualmente, con livelli su negozi già costruiti dove si mettono arredi e personale.

## Decision

- Il gioco diventa una **campagna di livelli** (`src/sim/levels.ts`). Ogni livello è un negozio inventato ma tipico italiano (niente marchi veri), con stanze e porta già costruite. Le stanze sono fisse: il giocatore piazza e toglie solo gli arredi, assume e ordina.
- Ogni livello ha soldi iniziali, giorni, obiettivi e **sblocchi** (oggetti, ruoli, tipi cliente, imprevisti). La sim rispetta gli sblocchi nelle sue regole (`check`, nascita clienti, imprevisti), non solo l'interfaccia.
- La partita a lotto vuoto resta come **Negozio libero**, sbloccata dopo il livello 3. `createState()` senza livello = Negozio libero, quindi i test esistenti non cambiano.
- Progressi della campagna in localStorage, separati dal salvataggio della partita.

## Alternatives

- **Tutorial sul lotto vuoto** (stessa partita, consigli a comparsa): meno lavoro, ma il giocatore deve comunque costruire stanze prima di capire a cosa servono.
- **Stanze fisse più spazio libero da costruire**: più profondità, ma più regole da spiegare. Rifiutata dall'utente per ora.

## Consequences

- `LEVEL` in `config.ts` diventa gli obiettivi del Negozio libero; `day.ts` e HUD leggono il livello attivo.
- Il bilanciamento si fa per livello (`output/balance.ts` con mappa del livello).
- Il gameplan cambia: un livello = un negozio già costruito, non vuoto.
- Milestone: [20](../milestones/20-campagna-negozi-prestabiliti.md), [21](../milestones/21-interfaccia-facile.md), [22](../milestones/22-livelli-4-7.md).
