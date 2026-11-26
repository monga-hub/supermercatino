# Milestone 13: Banco salumi

## Status

implemented — in attesa del playtest dell'utente

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

- [x] Il bancone si piazza solo nel banco salumi — test: `tests/deli.test.ts`
- [x] Chi ha Salumi in lista fa la fila al bancone e il banconiere lo serve; senza banconiere niente salumi — test: `tests/deli.test.ts`
- [x] Gli scaffali non offrono più Salumi — test: `tests/deli.test.ts`
- [x] Frame di bancone e banconiere nel kit — test: `tests/assets.test.ts`
- [x] Bilanciamento: il livello si vince ancora entro 5 giorni — `output/balance.ts` (2 casse, tocchi, addetto pulizie: senza banco si perde, col banco si vince al giorno 5, con anche 2 cestini al giorno 4)
- [ ] Il banco salumi si riconosce ed è bello da guardare — verified by user playtest

## Exit condition

L'utente costruisce il banco salumi, assume il banconiere e vede la fila davanti al bancone con lui che affetta e porge il pacchetto.

## Test plan

- Test rossi: `tests/deli.test.ts`, poi build.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Il bancone usa la stessa fila e lo stesso posto di lavoro della cassa (`SERVED_BY` in `config.ts`; il cliente ha `goal.kind === 'till'` anche al bancone). Ha uno stock come uno scaffale (categoria Salumi): il magazziniere lo rifornisce e compare l'icona 📦.
- Tarature: affettare 1,5 s, Salumi €18 (prima 12), bancone €300.
- Il pavimento del banco salumi è disegnato a colori (cotto e legno), senza foglio Gemini.
- Fix: chi viene assunto prima che ci sia una porta entra appena la porta viene messa (prima restava bloccato fuori).
- Fogli Gemini `art/sheets/bancone.jpg` (bancone pieno, vuoto, pacchetto non ancora usato) e `art/sheets/banconiere.jpg` (4×2; il saluto non è usato). Screenshot: `output/shots-13.mjs`.
