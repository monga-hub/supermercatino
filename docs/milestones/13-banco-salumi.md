# Milestone 13: Banco salumi

## Status

planned

## Objective

Il cuore del supermercato italiano: una stanza banco salumi col bancone e l'affettatrice, dove il banconiere (quarto ruolo) serve un cliente alla volta. I salumi si comprano solo lì, con la loro fila.

## Scope

- **Stanza** `banco_salumi` (pavimento suo) e **oggetto** `bancone` (con affettatrice), piazzabile solo lì.
- **Banconiere:** ruolo `banconiere`; si mette dietro il bancone come il cassiere alla cassa.
- **Clienti:** la voce Salumi della lista si compra al bancone: fila davanti al bancone (stessa logica della fila alla cassa), il banconiere affetta per qualche secondo, poi il salume va nel cestino. Senza banconiere o senza bancone la voce manca (pazienza giù).
- Lo scaffale Salumi sparisce dal menu delle categorie degli scaffali.
- **Sprite Gemini:** bancone con affettatrice e vetrina, foglio banconiere (camminata ×3, affetta ×2, porge il pacchetto), pavimento della stanza.

## Out of scope

- Forno e spogliatoio staff (backlog), numeretti "elimina code".

## Dependencies

- **Depends on:** 08 (fila), 10
- **Blocks:** nessuno

## Acceptance criteria

- [ ] Il bancone si piazza solo nel banco salumi — test: `tests/build.test.ts`
- [ ] Chi ha Salumi in lista fa la fila al bancone e il banconiere lo serve; senza banconiere niente salumi — test: `tests/deli.test.ts`
- [ ] Gli scaffali non offrono più Salumi — test: `tests/build.test.ts`
- [ ] Frame di bancone e banconiere nel kit — test: `tests/assets.test.ts`
- [ ] Bilanciamento: il livello si vince ancora entro 5 giorni — `output/balance.ts`
- [ ] Il banco salumi si riconosce ed è bello da guardare — verified by user playtest

## Exit condition

L'utente costruisce il banco salumi, assume il banconiere e vede la fila davanti al bancone con lui che affetta e porge il pacchetto.

## Test plan

- Test rossi: `tests/deli.test.ts`, poi build.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes
