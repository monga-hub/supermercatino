# Milestone 18: Spogliatoio e stanchezza

## Status

planned

## Objective

Ultima stanza del gameplan v1: lo staff si stanca durante la giornata e va a riposare nello spogliatoio. Chi non riposa rallenta. Il giocatore deve prevedere uno spogliatoio e abbastanza persone per coprire le pause.

## Scope

- Stanza `spogliatoio` con un oggetto (panca/armadietti). Ogni dipendente ha una barra energia che cala lavorando.
- Sotto una soglia va nello spogliatoio (se c'è), si riposa qualche minuto di gioco e torna al suo posto; la cassa o il bancone restano scoperti nel frattempo.
- Senza spogliatoio o con energia a zero: velocità dimezzata e niente bonus del tratto.
- Pannello Staff: barra energia e stato "in pausa".
- Sprite Gemini: spogliatoio (armadietti + panca), un frame "seduto in pausa" generico (o icona caffè sopra la testa).

## Out of scope

- Turni orari, straordinari, scioperi, morale dello staff.

## Dependencies

- **Depends on:** 04/05/12/13 (ruoli staff), 17 (ultima stanza aggiunta prima)
- **Blocks:** 19 (il capo reparto conta le pause)

## Acceptance criteria

- [ ] Lavorando l'energia cala; sotto soglia il dipendente va nello spogliatoio, riposa e torna — test: `tests/breakroom.test.ts`
- [ ] Senza spogliatoio lo staff stanco rallenta — test: `tests/breakroom.test.ts`
- [ ] Mentre il cassiere è in pausa la sua cassa non serve — test: `tests/breakroom.test.ts`
- [ ] I salvataggi vecchi si caricano (energia piena) — test: `tests/save.test.ts`
- [ ] Bilanciamento: con uno spogliatoio e staff sufficiente il livello si vince entro 5 giorni — `output/balance.ts`
- [ ] Le pause sono chiare e non frustranti — verified by user playtest

## Exit condition

L'utente vede un cassiere stanco lasciare la cassa, andare nello spogliatoio e tornare; senza spogliatoio lo vede rallentare.

## Test plan

- Test rossi: `tests/breakroom.test.ts`, poi save.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes
