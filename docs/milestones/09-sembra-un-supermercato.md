# Milestone 09: Sembra un supermercato

## Status

in progress

## Objective

Tre richieste dell'utente dopo il playtest del 07b (2026-11-26), chieste insieme e consegnate una per volta:
mobili che si girano, pareti con la porta nel muro, icone di tocco dipinte al posto delle emoji.

## Scope

- **Ruota:** strumento "Ruota" nella barra; tocco su scaffale o cassa → due orientamenti (`ShopObject.rot`, comando `rotate`, gratis). Lo sprite girato è lo specchio; la cassiera segue la cassa. La porta si orienta da sola.
- **Pareti:** muri dipinti sui due lati in fondo dell'edificio (bordi in alto a sinistra e in alto a destra delle celle costruite che danno sul lotto), come in Theme Hospital; davanti niente muro per vedere dentro. Texture frontali Gemini (`art/sheets/pareti.jpg`: muro, muro con manifesto, porta scorrevole) inclinate sul bordo iso da `tools/kit.py`.
- **Porta sul lato:** la porta si disegna sul bordo della sua cella che dà fuori dalla sala (nel muro se il bordo è in fondo), non al centro.
- **Icone:** 📦 ⏳ 💰 sostituite da badge dipinti Gemini (`art/sheets/icone.jpg`).

## Out of scope

- Quattro orientamenti veri (servirebbero sprite visti da dietro): due bastano per girare le corsie.
- Muri interni tra stanze, muri davanti, finestre apribili.

## Dependencies

- **Depends on:** 07b
- **Blocks:** nessuno

## Acceptance criteria

- [x] `rotate` gira scaffali e casse, gratis; porta e celle vuote rifiutate — test: `tests/build.test.ts::rotate*`
- [ ] Pareti sui bordi in fondo dell'edificio, non sui bordi interni né davanti; niente muro dove c'è la porta — test: `tests/walls.test.ts`
- [ ] La porta sta sul bordo esterno della sua cella — test: `tests/walls.test.ts`
- [ ] Ogni frame di muri, porta e icone esiste in `kit.json` — test: `tests/assets.test.ts`
- [ ] Sembra un supermercato su telefono — verified by user playtest

## Exit condition

L'utente costruisce il negozio dal telefono, gira le corsie, vede i muri con la porta nel muro e tocca icone dipinte per rifornire e incassare.

## Test plan

- Test rossi per ogni parte; screenshot ravvicinati.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Il test browser "build with mouse" ora sceglie lo strumento dal hook: con "Ruota" la barra va su due righe e il clic fisso mancava il bottone.
