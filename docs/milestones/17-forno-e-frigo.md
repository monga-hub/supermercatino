# Milestone 17: Forno e frigo

## Status

planned

## Objective

Completare gli oggetti del gameplan v1: il pane si compra caldo al forno e i latticini stanno nel frigo. Il negozio richiede due reparti "speciali" da costruire e gestire.

## Scope

- Stanza `forno` (nuova) con oggetto `forno`: il banconiere (stesso ruolo del banco salumi) sforna il Pane a infornate (es. 6 pezzi ogni ~20 minuti di gioco). Il Pane si vende solo lì: niente scaffale Pane.
- Profumo di pane: per un po' dopo ogni infornata arrivano clienti un po' più spesso.
- Oggetto `frigo` nella sala vendita: unico posto per i Latticini (lo scaffale normale non li accetta più). Il magazziniere lo rifornisce come uno scaffale.
- Migrazione dei salvataggi: scaffali Pane/Latticini già piazzati restano validi fino a demolizione (oppure diventano frigo/vuoti: decidere all'implementazione, con test).
- Sprite Gemini: forno (bocca accesa/spenta), frigo (pieno/vuoto), banconiere che inforna.

## Out of scope

- Fornaio come ruolo separato (il gameplan v1 usa il banconiere per salumi e forno).
- Elettricità, scadenze dei latticini.

## Dependencies

- **Depends on:** 13 (banco salumi e banconiere), 11 (migrazione salvataggi)
- **Blocks:** nessuno

## Acceptance criteria

- [ ] Il forno va solo nella stanza forno e produce Pane a infornate se c'è un banconiere — test: `tests/bakery.test.ts`
- [ ] Il Pane non si mette più sugli scaffali; i clienti col Pane in lista vanno al forno — test: `tests/bakery.test.ts`
- [ ] Dopo un'infornata gli arrivi aumentano per un po' — test: `tests/bakery.test.ts`
- [ ] I Latticini stanno solo nel frigo, il magazziniere lo rifornisce — test: `tests/bakery.test.ts`
- [ ] I salvataggi vecchi si caricano senza errori — test: `tests/save.test.ts`
- [ ] Frame di forno, frigo e banconiere al forno nel kit — test: `tests/assets.test.ts`
- [ ] Bilanciamento: il livello si vince ancora entro 5 giorni — `output/balance.ts`
- [ ] Il forno e il frigo si riconoscono e il pane caldo si "sente" — verified by user playtest

## Exit condition

L'utente costruisce la stanza forno, assume un banconiere, vede sfornare il pane e i clienti arrivare al forno; mette un frigo e vede i latticini sparire dagli scaffali normali.

## Test plan

- Test rossi: `tests/bakery.test.ts`, poi save e assets.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes
