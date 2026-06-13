# T-004: TypeScript interfaces — row types, stat interfaces, live game domain types

## Status
Done

## Epic
E-01 Foundation

## Priority
P0

## Goal
Define the full TypeScript interface layer that sits above the raw Dexie row types: stat shape interfaces, a typed ruleset config, and live game state domain types. Feature code and the stat engine will program against these interfaces, never against `Record<string, number>` or `Record<string, unknown>` directly.

## Why it matters
T-003 deliberately left `stats` as `Record<string, number>` and `ruleset` as `Record<string, unknown>` to keep the schema ticket bounded. T-004 narrows those types so that:
- The stat engine (T-020–T-022) has a verifiable contract for every stat key it must produce
- The live scoring screen (T-014–T-016) has a typed state machine to program against
- Any typo in a stat key is caught at compile time, not at runtime during a game

## Scope
- Define `BattingStats`, `PitchingStats`, `FieldingStats` interfaces with all required keys
- Define typed row wrappers: `BattingGameStatRow`, `PitchingGameStatRow`, `FieldingGameStatRow`, and season equivalents
- Define `RulesetConfig` with all youth-league rule knobs; `defaultRuleset` constant
- Define `TypedGameRow` narrowing `GameRow.ruleset` to `RulesetConfig`
- Define live game domain types: `LiveGameState`, `LiveLineupEntry`, `LiveInningState`, `LivePlayContext`
- Barrel export from `src/domain/index.ts`

## Out of scope
- Service implementations (`GameStateService`, `StatRebuilderService`, etc.) — those are E-02/E-03
- Any UI code
- Schema version changes — T-003 schema rows are unchanged; only TypeScript-level narrowing is added

## Dependencies
- T-001 Done — TypeScript scaffold with `@/` path alias
- T-002 Done — no direct dependency
- T-003 Done — row types in `src/data/schema.ts`; stat fields left as `Record<string, number>` for T-004 to narrow

## Files to touch
- `tickets/T-004-typescript-interfaces.md` (this file)
- `src/domain/stat-engine/types.ts` (new)
- `src/domain/game-state/types.ts` (new)
- `src/domain/ruleset.ts` (new)
- `src/domain/index.ts` (new)
- `TASKS.md` (status update)

## Ticket sizing check
- Expected to fit in one focused agent session: Yes
- Expected new files: 4
- Split required if: live game state machine grows into >200 lines of types requiring a dedicated design session

## Implementation notes
- All stat interfaces use `number` for every field — rate stats (AVG, ERA, etc.) are stored as floats; 0 when denominator is zero (never NaN or undefined)
- `outsRecorded` is the canonical IP unit in `PitchingStats` (integer outs; 3 = 1 full inning); display helpers format to "2.1" notation elsewhere
- Typed row wrappers use discriminated union pattern: `Omit<GameStatRow, 'statType' | 'stats'> & { statType: 'batting'; stats: BattingStats }`
- `RulesetConfig` mirrors `GameRow.ruleset` — use `isRulesetConfig` type guard at data read boundaries
- Live game domain types are pure TypeScript (no Dexie dependency); they model in-memory game state, not persisted rows
- Import pattern for consumers: `import type { BattingStats, LiveGameState, RulesetConfig } from '@/domain'`

## Acceptance criteria
- `npm run typecheck` passes with zero errors
- `npm run build` completes without errors
- `BattingStats` has all 14 count stat keys (PA, AB, H, 1B, 2B, 3B, HR, R, RBI, BB, IBB, HBP, SO, SB, CS) and 4 rate stat keys (AVG, OBP, SLG, OPS)
- `PitchingStats` has all 9 count stat keys (outsRecorded, BF, H, R, ER, BB, SO, HBP, pitchCount) and 2 rate keys (ERA, WHIP)
- `FieldingStats` has 4 count keys (PO, A, E, DP) and 1 rate key (fieldingPct)
- `RulesetConfig` captures all youth-league rule variants; `defaultRuleset` constant satisfies the type
- `LiveGameState` holds all state needed to render the scoreboard HUD without additional queries
- `import type { BattingStats, PitchingStats, FieldingStats, RulesetConfig, LiveGameState } from '@/domain'` resolves

## Test plan
- `npm run typecheck` — zero errors
- `npm run build` — clean dist, no missing export warnings
- Manual: import `BattingStats` and `LiveGameState` in `App.tsx` temporarily; confirm TypeScript resolves without errors

## Deployment or observability notes
- No deployment impact — type-only definitions; zero runtime code except `defaultRuleset` constant

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
- E-02 feature screens should import live game types from `@/domain`, not define their own
- T-020–T-022 stat derivation tickets must produce objects that satisfy `BattingStats`, `PitchingStats`, `FieldingStats`
- `isRulesetConfig` guard in `src/domain/ruleset.ts` should be used when reading `GameRow.ruleset` from the database

## Risks
- Stat key naming drift: if the stat engine uses different key names than defined here, derivation will compile but produce wrong output — mitigate by making the stat engine return typed `BattingStats` objects, not `Record<string, number>`
- Over-engineering live game state: keep `LiveGameState` flat and simple; complex state transitions belong in `GameStateService` (T-014), not in the type definition

## Completion notes
Implemented 2026-06-10. All acceptance criteria met.

**Files created:**
- `src/domain/stat-engine/types.ts` — `BattingStats` (15 count + 4 rate keys), `PitchingStats` (9 count + 2 rate keys), `FieldingStats` (4 count + 1 rate key); typed row wrappers (`BattingGameStatRow`, `PitchingGameStatRow`, `FieldingGameStatRow`, season equivalents, `TypedGameStatRow` / `TypedSeasonStatRow` discriminated unions)
- `src/domain/game-state/types.ts` — `LiveLineupEntry`, `LiveInningState`, `LivePlayContext`, `LiveGameState`, `RecordedPlayResult`
- `src/domain/ruleset.ts` — `RulesetConfig` (11 fields), `defaultRuleset` constant, `isRulesetConfig()` type guard, `TypedGameRow` narrowed wrapper
- `src/domain/index.ts` — barrel export for all domain types and the two runtime exports (`defaultRuleset`, `isRulesetConfig`)

**Validation:**
- `npm run typecheck` → zero errors
- `npm run build` → clean; dist 11.72 kB JS (domain types tree-shaken; only `defaultRuleset` constant adds runtime weight)

**Notes for E-02+:**
- Stat engine tickets (T-020–T-022) must return objects satisfying `BattingStats` / `PitchingStats` / `FieldingStats`
- Live scoring (T-014–T-016) should hold `LiveGameState` in the Zustand store
- Call `isRulesetConfig(row.ruleset)` before casting `GameRow` to `TypedGameRow`
- Import pattern: `import type { BattingStats, LiveGameState, RulesetConfig } from '@/domain'`
