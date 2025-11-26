# Repository Guidelines

## Project Structure & Module Organization
- `src/main.ts`: entry point; sets up simulation loop and rendering.
- `src/core/**`: ECS, world, events, AI, logging, clock, math, and simulation state.
- `src/adapters/terminal/**`: view model + ASCII renderer and input.
- `docs/**`: world-generation notes, changelog, and brainstorming.
- Note: TS uses `module: nodenext`; keep explicit `.js` extensions in imports (even in `.ts`).

## Build, Test, and Development Commands
- `npm install`: install dependencies (Node 18+).
- `npm run dev`: run with hot-reload via `tsx --watch src/main.ts`.
- `npx tsc --noEmit`: type-check the project.
- Optional: `node --test` if adding Node’s built-in tests.

## Coding Style & Naming Conventions
- TypeScript, ES2023, 2-space indentation, semicolons required.
- Naming: `camelCase` for functions/vars, `PascalCase` for types/classes.
- Files: follow existing patterns (e.g., `simulationClock.ts`, `eventBus.ts`).
- Events: snake_case past-tense (e.g., `entity_died`, `entity_attacked`).
- Keep modules cohesive by domain (`core/world`, `core/ecs/systems`, `core/log`).

## Spatial Index & Occupancy
- Movement must call `canEntityWalkTo` and update via `chunkManager.moveEntity` (never change `ecs.positions` without syncing the index).
- Blocking kinds: only `creature` and `structure`; `corpse` is non‑blocking by design.
- Spawns must use `chunkManager.addEntity` and a walkability check (see `spawn*` helpers).
- World is chunked with simulation levels (`full/macro/summary`); keep logic cheap outside `full`.

## Testing Guidelines
- No framework configured yet. Prefer lightweight tests first.
- Suggested layout: `src/**/__tests__/*.spec.ts` or `tests/*.spec.ts`.
- Recommended tools: built-in `node:test` (zero-deps) or `vitest` if you add a `test` script.
- Aim for coverage on systems (perception, AI decision, combat, movement) and deterministic world functions.
  - Include occupancy cases (entity collision, vegetation/terrain blocks, corpse walk‑through).

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits where possible.
  - Examples: `feat(core/ecs): add flee behavior`, `fix(world): correct seaLevel in painter`.
- PRs: include a concise description, linked issues, and before/after notes.
  - For behavior/UI changes, paste terminal output snippets or screenshots.
  - Update `README.md`/`docs/**` when APIs, events, or world-gen parameters change.

## Security & Configuration Tips
- Node 18+ required. No secrets or external services.
- Respect deterministic flows: prefer project PRNG utilities over `Math.random` in core logic.
- Keep imports extension-explicit (`.js`) to match NodeNext resolution and current code.
- Tuning: if changing world size/chunk size or noise scales, see `docs/world-generation/tuning-guide.md` and calibrate walkable ratio.
