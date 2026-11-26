# Milestone 18: Spogliatoio e stanchezza

## Status

implemented (in attesa di playtest)

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

- [x] Lavorando l'energia cala; sotto soglia il dipendente va nello spogliatoio, riposa e torna — test: `tests/breakroom.test.ts`
- [x] Senza spogliatoio lo staff stanco rallenta — test: `tests/breakroom.test.ts`
- [x] Mentre il cassiere è in pausa la sua cassa non serve — test: `tests/breakroom.test.ts`
- [x] In pausa uno per ruolo alla volta; il cassiere stanco non prende nuovi clienti finché non va — test: `tests/breakroom.test.ts`
- [x] I salvataggi vecchi si caricano (energia piena) — test: `tests/save.test.ts`
- [x] Bilanciamento: con uno spogliatoio e staff sufficiente il livello si vince entro 5 giorni — `output/balance.ts`
- [ ] Le pause sono chiare e non frustranti — verified by user playtest

## Exit condition

L'utente vede un cassiere stanco lasciare la cassa, andare nello spogliatoio e tornare; senza spogliatoio lo vede rallentare.

## Test plan

- Test rossi: `tests/breakroom.test.ts`, poi save.
- Regressione: `npm test && npm run test:browser && npx tsc --noEmit`.

## Notes

- Energia 0–100 (`ENERGY_*` in config): cala 8/ora di gioco al lavoro, sotto 30 il dipendente va agli **Armadietti** (oggetto della stanza Spogliatoio) appena libero, si riposa a 400/ora (~10 minuti) e torna. Ogni notte energia piena.
- Una pausa per ruolo alla volta: assunti insieme si stancavano insieme e lasciavano tutte le casse scoperte. Il cassiere che vuole la pausa non chiama il prossimo cliente.
- Senza armadietti: stanco = metà velocità (`TIRED_SPEED`) e niente bonus del tratto (velocità e chiacchierone).
- I clienti non entrano nello spogliatoio. HUD: energia nel pannello Staff, stato "in pausa", icona caffè sopra chi è in pausa e icona sbadiglio sopra chi è stanco. Foglio Gemini `spogliatoio.jpg` 3×1 (armadietti, icona_pausa, icona_stanco), ritagliato a mano in colonne regolari.
- Bilanciamento: obiettivo soldi del livello 1 da 3500 a **2800** (spogliatoio ~285 € e le pause costano incassi). Con spogliatoio e 2 cestini o solo banco salumi: vince al giorno 5; senza spogliatoio, senza tocchi o con forno+salumi senza cestini: perde. Margine stretto, da rivedere col playtest.
- Barra strumenti in basso ormai lunga (16 tasti): su telefono va su 3–4 righe → backlog.

