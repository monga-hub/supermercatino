# AGENTS.md

> Lean enforcement file for any AI agent working in this repository. Read this file **first**, every session, before any other action. Cross-tool standard (Cursor, Aider, Codex, Claude, etc.). Claude users: `CLAUDE.md` points here.

This project follows the [`make-game`](https://github.com/OpusGameLabs/game-creator) pipeline. Do not improvise process — follow the rules below.

## Project overview

- **Title:** Il Supermercatino
- **Pitch:** Gestisci un supermercato di quartiere italiano anni '80-'90: costruisci reparti, assumi commessi e tieni a bada nonne con la lista, studenti squattrinati e furbetti che saltano la fila. Theme Hospital, ma tra il banco salumi e la cassa 3.
- **Genre / type:** Gestionale tempo reale (pausa + 3 velocità), vista isometrica 2D con sprite dipinti
- **Engine:** Phaser 4.0.0 + Vite 6 (template ufficiale `template-vite-ts`, Minimal)
- **Language:** TypeScript
- **Target platform:** Browser desktop (mouse + tastiera) e mobile/tablet (touch); build statica per itch.io

## Hard gate: no code before plan

If `docs/gameplan.md` does not exist in this repo, you are in the **idea phase** — do **not** create source files, run engine scaffolders, or install dependencies. Your only job is to walk the user through the idea-phase clarifying-questions checklist (gameplay loop, art style, controls/scope, engine/stack — see `make-game` skill `phase-pipelines/idea.md`) and produce `docs/gameplan.md`, `docs/tech.md`, and `docs/architectural-decisions/0001-engine-and-stack.md`. A detailed-sounding initial prompt is **not** a substitute for the checklist; ask every item even if the user "seems clear."

## Mandatory: run the make-game skill

Every session in this directory **must** run the `make-game` skill's session-start sub-pipeline before any other work. The skill enforces phase awareness, doc continuity, milestone discipline, and the live-iterate verification loop.

If the skill is not installed in your environment:

```
npx skills add opusgamelabs/game-creator --skill make-game -p -y
```

If the skill cannot be installed (e.g. unsupported agent tool), apply the rules in this file manually and tell the user the skill is missing.

## Source-of-truth files

These docs are the agreed state of the project. Read them at session start; do **not** unilaterally edit them — propose changes and get user confirmation first.

- `docs/STATE.md` — last session handoff. Read first, every session.
- `docs/gameplan.md` — game definition (loop, rules, art, audio, anti-goals).
- `docs/tech.md` — stack, tooling, conventions.
- `docs/milestones/` — feature work breakdown with acceptance criteria.
- `docs/architectural-decisions/` — locked top-level decisions (engine, language, art-style, state-machine pattern, etc.).
- `docs/backlog.md` — deferred ideas (created on first deferral).

## Architecture rules

All of these live in `docs/tech.md` / ADR-0001; this is a reflection, not the source.

- **Sim/render separation (ADR-0001, binding)** — `src/sim/` is pure TypeScript and never imports Phaser. Game state is one JSON-serializable object advanced by `tick(state, dt)` at a fixed step. Phaser scenes only read state, draw it, and turn input into commands. No game logic in scenes.
- **Single state object** — the sim state is the only source of truth (it is also the save file and the future online payload). No parallel state in scenes.
- **Balance numbers in `src/sim/config.ts`** — prices, wages, speeds, thresholds. Zero magic numbers in logic.
- **Customers and staff are small state machines** — a string `state` field on each entity in the sim state.
- **Isometric conversion is a formula** in `src/render/` — no iso plugins, no ECS, no UI framework (HUD in Phaser).
- **`window.render_game_to_text()`** — returns the sim state as JSON for agent inspection without screenshots.
- **`window.advanceTime(ms)`** — steps the sim deterministically for verification.
- **Naming** — code in English; domain data in Italian (categorie, ruoli, tipi cliente). Assets `<tipo>-<nome>[-<direzione>].png` in `public/assets/`.

## Stack-specific commands

- **Dev server:** `npm run dev` (http://localhost:8080; `npm run dev-nolog` skips the template's anonymous Phaser ping)
- **Tests:** `npm test` (node --test, pure sim) · `npm run test:browser` (Playwright; dev server must be running)
- **Build:** `npm run build` (or `npm run build-nolog`) → `dist/`
- **Lint / format:** n/a — type-check with `npx tsc --noEmit`

## Live iterate (after every code change)

After any meaningful code change in the development phase:

1. Confirm dev server is live; check console — must be error-free.
2. Call `render_game_to_text()` and verify state matches the change.
3. For time-dependent changes, step with `advanceTime(ms)` and re-read.
4. If visual, take a screenshot; save under `output/iterate/`.
5. Smoke-check adjacent state for regressions.
6. Hand back to the user with a one-line verdict and one focused question.

A change is **not done** until this loop has run.

## Tests first

Every checkable acceptance criterion gets a failing test before implementation: `node --test` for sim logic, Playwright for in-browser behavior. Feel/visual AC are marked "verified by user playtest" in the milestone. Never loosen a failing test to make it pass.

## Append vs spawn a new milestone

When new work surfaces:

- **Append** an AC to the current milestone if the work is in-scope refinement.
- **Spawn** a new milestone if the work is out of scope but related; use `Depends on:` to capture ordering.
- **Inline** trivial fixes (typos, one-liners) on the current milestone.

When in doubt, prefer spawning. Do not bloat milestones. Anything deferred goes to `docs/backlog.md`.

## Minimum-viable doc mode

If the user pushes back on documentation overhead, downgrade — do **not** skip:

- One-line milestone entry (title + AC) is acceptable.
- `docs/STATE.md` updates remain mandatory.
- `docs/gameplan.md` and `docs/tech.md` must exist.
- Engine / language / stack ADRs cannot be skipped.

## What to do if `make-game` isn't loaded

If the skill is missing or didn't trigger this session:

1. Stop. Do not start coding.
2. Read this file in full.
3. Read `docs/STATE.md`, then `docs/gameplan.md`, then `docs/tech.md`.
4. Identify the current phase and the open milestone.
5. Tell the user the skill isn't loaded and recommend they install it.
6. If proceeding without the skill, apply the rules above manually and update `docs/STATE.md` at the end of the session.

## Last regenerated

2026-11-26 by Claude / make-game scaffold. Regenerate when the engine, primary commands, or architecture rules change. The doc-drift audit will flag staleness.
