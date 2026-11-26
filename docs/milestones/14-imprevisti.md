# Milestone 14: Imprevisti

## Status

implemented — in attesa del playtest dell'utente

## Objective

Gli ultimi imprevisti del gameplan: carrelli abbandonati che bloccano i corridoi e l'ispezione sanitaria che premia il negozio pulito e multa quello sporco. Danno al passo "Reagisci" un motivo in più per toccare e per tenere l'addetto pulizie.

## Scope

- **Carrello abbandonato:** quando prende dallo scaffale, un cliente ogni tanto lascia il carrello sulla sua cella (`s.carts`, massimo 2). I clienti non ci passano: girano intorno o, se chiude l'unico passaggio, restano bloccati. Icona 🛒 sul carrello: toccandola il magazziniere va a prenderlo per primo; senza tocco lo porta via quando non ha altro da fare. La notte i carrelli spariscono.
- **Ispezione sanitaria:** al giorno `INSPECTION_DAY` (3) a metà mattina entra l'ispettore (tipo cliente speciale, mai casuale): gira qualche reparto senza comprare ed esce. All'uscita: multa per ogni macchia per terra, o bonus di reputazione se non ce n'è nessuna. Avviso nel riepilogo della sera prima e la mattina stessa; esito a schermo.
- **Sprite Gemini:** carrello, icona carrello, foglio ispettore (3×3 come i clienti).

## Out of scope

- Furbetto (milestone 15), audio (16), ispezioni ripetute o casuali.

## Dependencies

- **Depends on:** 12 (sporco), 05b (tocchi)
- **Blocks:** nessuno

## Acceptance criteria

- [x] I clienti a volte lasciano carrelli (mai più di 2) e i clienti non ci passano — test: `tests/events.test.ts`
- [x] Il magazziniere porta via i carrelli, prima quelli toccati; la notte spariscono — test: `tests/events.test.ts`
- [x] Il giorno dell'ispezione l'ispettore entra, non compra, ed esce; multa con le macchie, bonus senza — test: `tests/events.test.ts`
- [x] Frame di carrello, icona e ispettore nel kit — test: `tests/assets.test.ts`
- [x] Bilanciamento: il livello si vince ancora entro 5 giorni — `output/balance.ts` (obiettivo soldi abbassato a €3500: col banco salumi si vince al giorno 4–5, senza banco o senza tocchi si perde)
- [ ] Gli imprevisti si capiscono e fanno ridere — verified by user playtest

## Exit condition

L'utente vede un carrello in mezzo al corridoio, lo tocca e il magazziniere lo porta via; il giorno 3 vede arrivare l'ispettore e legge l'esito dell'ispezione.

## Test plan

- Test rossi: `tests/events.test.ts`.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Sim: carrelli in `customers.ts` (bloccano solo i clienti, lo staff ci passa) e `staff.ts` (il magazziniere li porta via); ispettore = tipo cliente `ispettore` con peso 0, non compra, non perde pazienza, all'uscita `inspect()`.
- Tarature: carrello 2% per presa dallo scaffale, massimo 2; multa €25 a macchia; bonus +5 reputazione. Obiettivo soldi del livello 1 da €4000 a €3500 (12–14 hanno aggiunto stipendi e costi).
- Gemini si è bloccato tre volte sul foglio del carrello in chat nuove; generato nella chat delle icone, layout irregolare ritagliato a mano in `art/sheets/imprevisti.jpg` (carrello, icona carrello, icona ispezione non ancora usata).
- Screenshot: `output/shots-14.mjs` (prepara un salvataggio al giorno 3 e lo carica con "Continua").
