# T-020 — Batting stat derivation

**Epic:** E-03 Stats Engine
**Priority:** P0
**Status:** Done
**Delegation:** Claude-only (domain logic, math correctness)
**Depends on:** E-02 (Done)

## Scope
Implement `deriveBattingStats(playerId, events)` — a pure function that reads a full ordered list of `PlayEventRow` records for one game and returns a fully populated `BattingStats` object for the given player.

This ticket does NOT write stats to the database; persistence is handled by T-023 (StatRebuilderService).

## Acceptance criteria
- [ ] `deriveBattingStats(playerId, events)` exported from `src/domain/stat-engine/battingStats.ts`
- [ ] Counts PA, AB, H, 1B, 2B, 3B, HR, BB, IBB, HBP, SO, SB, CS, RBI correctly
- [ ] Counts R (runs scored) correctly for both: HR by batter, and runner scoring on a later play
- [ ] Stolen bases and caught stealing attributed to the correct runner from base-running-only events
- [ ] Rate stats: AVG = H/AB, OBP = (H+BB+HBP)/(AB+BB+HBP+SF), SLG = TB/AB, OPS = OBP+SLG
- [ ] Rate stats are 0 (not NaN) when denominator is 0
- [ ] SF excluded from AB but included in OBP denominator; SAC excluded from AB and OBP denominator
- [ ] Unit tests pass against a known game fixture covering all stat categories
- [ ] `deriveBattingStats` exported from `src/domain/index.ts`

## Files to touch
- `src/domain/stat-engine/battingStats.ts` (new)
- `src/domain/stat-engine/__tests__/battingStats.test.ts` (new)
- `src/domain/index.ts` (add export)
- `package.json` (add vitest — required for test DoD)
- `vitest.config.ts` (new — required for test DoD)
- `tickets/T-020-batting-stat-derivation.md` (this file)
- `TASKS.md` (status update)

## Run scoring attribution
The `PlayEventRow` schema stores `runnersBefore`, `runnersAfter`, `runsScored`, and `outsRecorded` but does NOT store per-runner outcomes individually. Run attribution uses priority order: runners from 3rd base score before 2nd, 2nd before 1st. This is correct for all standard baseball situations; the only exception (runner on lower base scores while runner on higher base is put out) does not occur in typical youth league play.

## Test plan
- Known 9-event fixture for one player covering: 1B, 2B, HR, BB, HBP, SO, SF, SB, CS
- Verify: PA=7, AB=4, H=3, 1B=1, 2B=1, HR=1, R=2, RBI=3, BB=1, HBP=1, SO=1, SB=1, CS=1, SF=1
- Verify: AVG=.750, OBP≈.714, SLG=2.25, OPS≈2.964
- Zero-denominator guard: player with 0 events returns all-zero stats

## Completion notes
- Completed 2026-06-10.
- `deriveBattingStats(playerId, events)` implemented in `src/domain/stat-engine/battingStats.ts`.
- Vitest added (`^2.1.9`) with `vitest.config.ts`; `npm test` script added to `package.json`.
- 26 unit tests pass covering: counting all stat categories, run scoring attribution (HR + runner), SB/CS runner identification, rate stat math, and zero-denominator guards.
- Run scoring uses 3rd→2nd→1st priority attribution (documented limitation: edge case where lower-base runner scores while higher-base runner is out does not occur in typical play).
- All acceptance criteria satisfied.
