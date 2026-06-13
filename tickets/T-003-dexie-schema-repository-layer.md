# T-003: Dexie.js schema (all tables) + typed repository layer

## Status
Done

## Epic
E-01 Foundation

## Priority
P0

## Goal
Install Dexie.js and define the complete IndexedDB schema for the app — all 8 tables, all indexes, version 1 migration — plus a typed repository class per table so feature code never writes raw Dexie queries.

## Why it matters
Every E-02+ feature screen reads and writes data. Without a stable, typed data layer, each feature either embeds raw Dexie queries (fragile, hard to test) or must define its own row types (drift, inconsistency). The repository layer is the single boundary between feature code and IndexedDB.

## Scope
- Install `dexie` as a production dependency
- Define row type interfaces for all 8 tables in `src/data/schema.ts`
- Define domain enums: `PlayOutcome`, `StatType`, `RunnerState`
- Create `src/data/db.ts` — `StitchDatabase` class extending `Dexie`, version 1 schema, exported singleton `db`
- Create typed repository class per table (CRUD + domain-specific queries):
  - `TeamRepository` — findAll, findById, create, update, delete
  - `SeasonRepository` — findAll, findByTeam, findById, create, update, delete
  - `PlayerRepository` — findByTeam, findActive, findById, create, update, setActive, delete
  - `GameRepository` — findBySeason, findById, create, update, delete
  - `LineupRepository` — findByGame, upsert, deleteByGame
  - `PlayEventRepository` — findByGame, findByGameOrdered, create, update, delete, deleteByGame
  - `GameStatRepository` — findByGame, findByGameAndPlayer, upsert, deleteByGame
  - `SeasonStatRepository` — findBySeason, findBySeasonAndPlayer, upsert, deleteBySeason
- Barrel exports from `src/data/repositories/index.ts` and `src/data/index.ts`

## Out of scope
- TypeScript stat interfaces and live game domain types (T-004)
- Any UI code or feature screens (E-02+)
- Seeding or test fixtures (handled in stat derivation tickets T-020–T-022)
- SQLite / Tauri path (future packaging concern)

## Dependencies
- T-001 Done — Vite + TypeScript scaffold with `@/` path alias
- T-002 Done — no direct dependency; listed for awareness

## Files to touch
- `tickets/T-003-dexie-schema-repository-layer.md` (this file)
- `package.json` (add dexie dependency)
- `package-lock.json`
- `src/data/schema.ts` (new)
- `src/data/db.ts` (new)
- `src/data/repositories/TeamRepository.ts` (new)
- `src/data/repositories/SeasonRepository.ts` (new)
- `src/data/repositories/PlayerRepository.ts` (new)
- `src/data/repositories/GameRepository.ts` (new)
- `src/data/repositories/LineupRepository.ts` (new)
- `src/data/repositories/PlayEventRepository.ts` (new)
- `src/data/repositories/GameStatRepository.ts` (new)
- `src/data/repositories/SeasonStatRepository.ts` (new)
- `src/data/repositories/index.ts` (new)
- `src/data/index.ts` (new)
- `TASKS.md` (status update)

## Ticket sizing check
- Expected to fit in one focused agent session: Yes
- Expected new files: 15
- Split required if: a secondary migration (version 2) is needed before T-004 is complete

## Implementation notes
- All record IDs are `crypto.randomUUID()` — UUID text PKs for future sync compatibility
- Schema version 1 only; all future schema changes must use Dexie migration blocks
- `isActive` on `PlayerRow` stored as `0 | 1` — IndexedDB boolean index unreliable for `false` in some engines
- Compound indexes on `gameStats` and `seasonStats` use Dexie `[col1+col2+col3]` syntax
- Repositories are singletons exported from their module file; feature code imports the instance, not the class
- `stats` columns on stat rows use `Record<string, number>` — T-004 will narrow to specific stat interfaces
- `ruleset` on `GameRow` uses `Record<string, unknown>` — T-004 will narrow to `RulesetConfig`
- Runner state on `PlayEventRow` stored as typed objects (structured clone), not JSON strings

## Acceptance criteria
- `npm run typecheck` passes with zero errors
- `npm run build` completes without errors
- All 8 tables are declared in `StitchDatabase` with typed `Table<Row, string>` properties
- Each repository exposes the minimum CRUD surface needed by E-02 feature screens
- `import { db } from '@/data'` resolves and provides the Dexie singleton
- `import { teamRepo, playerRepo, gameRepo } from '@/data'` resolves and provides typed repository instances
- No raw Dexie table access leaks outside of repository files

## Test plan
- `npm run typecheck` — zero errors
- `npm run build` — clean dist, no bundle warnings about missing exports
- Manual: import `db` and `teamRepo` in `App.tsx` temporarily; confirm TypeScript resolves without errors

## Deployment or observability notes
- No deployment impact — local IndexedDB only
- Schema version 1 creates the database on first browser open; no migration needed at this stage

## Validation commands
```bash
npm run typecheck
npm run build
```

## Delegation category
Claude-only

## Recommended owner
Claude

## Handoff notes
- T-004 should import row types from `@/data/schema` and extend/narrow them (e.g., `BattingStats` as the type of `GameStatRow['stats']`)
- E-02 feature screens should import only repository singletons from `@/data`; never import `db` directly in feature code

## Risks
- Dexie version mismatch with TypeScript `strict` — install latest stable; verify `Table<T, K>` generics compile cleanly
- Boolean indexing unreliability — mitigated by using `0 | 1` for `isActive`
- Schema migration risk in future tickets — every change to `.stores()` requires a new `.version(N)` block; never modify version 1

## Completion notes
Implemented 2026-06-10. All acceptance criteria met.

**Files created:**
- `src/data/schema.ts` — row type interfaces for all 8 tables; `PlayOutcome` union, `RunnerState`, `StatType`, `GameStatus`, `HalfInning`, `HomeAway`
- `src/data/db.ts` — `StitchDatabase` extends `Dexie`; version 1 schema with compound indexes on `gameStats` and `seasonStats`; exported singleton `db`
- `src/data/repositories/TeamRepository.ts` — findAll (by name), findById, create, update, delete
- `src/data/repositories/SeasonRepository.ts` — findAll, findByTeam, findById, create, update, delete
- `src/data/repositories/PlayerRepository.ts` — findByTeam, findActive (filter by isActive=1), findById, create, update, setActive, delete
- `src/data/repositories/GameRepository.ts` — findBySeason, findByStatus, findById, create, update, delete
- `src/data/repositories/LineupRepository.ts` — findByGame, upsert (create or update by gameId+playerId), deleteByGame, delete
- `src/data/repositories/PlayEventRepository.ts` — findByGame, findByGameOrdered, nextSequenceNumber, create, update, delete, deleteByGame
- `src/data/repositories/GameStatRepository.ts` — findByGame, findByGameAndPlayer, upsert, deleteByGame
- `src/data/repositories/SeasonStatRepository.ts` — findBySeason, findBySeasonAndPlayer, upsert, deleteBySeason
- `src/data/repositories/index.ts` — barrel export for all repository singletons
- `src/data/index.ts` — barrel export: `db`, all row types, all repository singletons

**Validation:**
- `npm run typecheck` → zero errors
- `npm run build` → clean; dist 11.72 kB JS (data modules not yet imported in feature code, tree-shaken)

**Notes for T-004:**
- `stats: Record<string, number>` on `GameStatRow` and `SeasonStatRow` — T-004 should define `BattingStats`, `PitchingStats`, `FieldingStats` interfaces and document the expected keys
- `ruleset: Record<string, unknown>` on `GameRow` — T-004 should define `RulesetConfig` and narrow this field
- `RunnerState` and `PlayOutcome` are defined here; T-004 may extend them with derived domain types for the live game state machine
- Import pattern: `import { db, teamRepo, playerRepo } from '@/data'`
