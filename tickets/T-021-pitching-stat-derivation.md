# T-021 — Pitching stat derivation

**Epic:** E-03 Stats Engine
**Priority:** P0
**Status:** Done
**Delegation:** Claude-only (domain logic, math correctness)
**Depends on:** T-020 (Done), E-02 (Done)

## Scope
Implement `derivePitchingStats(pitcherId, events)` — a pure function that reads a full ordered list of `PlayEventRow` records for one game and returns a fully populated `PitchingStats` object for the given pitcher.

This ticket does NOT write stats to the database; persistence is handled by T-023 (StatRebuilderService).

## Acceptance criteria
- [x] `derivePitchingStats(pitcherId, events)` exported from `src/domain/stat-engine/pitchingStats.ts`
- [x] Counts outsRecorded, battersFaced, hitsAllowed, runsAllowed, earnedRuns, walksAllowed, strikeouts, hitBatters correctly
- [x] `pitchCount` is 0 (pitch-by-pitch entry is out of MVP scope; schema has no per-pitch field)
- [x] hitsAllowed includes only: single, double, triple, home_run (not sac_fly, field_error, fielders_choice, etc.)
- [x] earnedRuns = sum of runsScored on events where isEarnedRun === true; unearned runs count toward runsAllowed only
- [x] walksAllowed includes both walk and intentional_walk
- [x] ERA = (earnedRuns * 27) / outsRecorded; 0 when outsRecorded = 0
- [x] WHIP = (walksAllowed + hitsAllowed) / (outsRecorded / 3); 0 when outsRecorded = 0
- [x] base-running-only events (stolen_base, caught_stealing) have empty pitcherPlayerId and are naturally excluded
- [x] Unit tests pass against a known game fixture covering all stat categories
- [x] `derivePitchingStats` exported from `src/domain/index.ts`

## Files to touch
- `src/domain/stat-engine/pitchingStats.ts` (new)
- `src/domain/stat-engine/__tests__/pitchingStats.test.ts` (new)
- `src/domain/index.ts` (add export)
- `tickets/T-021-pitching-stat-derivation.md` (this file)
- `TASKS.md` (status update)

## pitchCount limitation
`PlayEventRow` has no per-pitch count field. Pitch-by-pitch entry is explicitly out of MVP scope (PLAN.md). `pitchCount` is stored as 0 until a future ticket adds a `pitchCount` field to `PlayEventRow`.

## earnedRun attribution
`isEarnedRun` is a boolean flag on each event. If `isEarnedRun === true`, all `runsScored` on that event are earned. Mixed earned/unearned runs on a single event cannot be expressed in the current schema; this edge case does not occur in typical youth league scoring.

## Test plan
- Known 7-event fixture for pitcher-a covering: single, strikeout_swinging, 2-run HR, walk, HBP, sac_fly, strikeout_looking
- Verify: outsRecorded=3, BF=7, H=2, R=3, ER=3, BB=1, SO=2, HBP=1, pitchCount=0
- Verify: ERA=27.0, WHIP=3.0
- Verify: unearned run (isEarnedRun=false) increments runsAllowed but not earnedRuns
- Verify: stolen_base event (empty pitcherPlayerId) not attributed to any pitcher
- Verify: pitcher with 0 events returns all-zero stats including ERA=0 and WHIP=0
- Verify: pitcher B's events do not affect pitcher A's totals

## Completion notes
- Completed 2026-06-10.
- `derivePitchingStats(pitcherId, events)` implemented in `src/domain/stat-engine/pitchingStats.ts`.
- 27 unit tests pass covering: all count stats, earned vs. unearned run distinction, cross-pitcher isolation, stolen_base exclusion, rate stat math, zero-denominator guards, IBB counts toward walksAllowed, ERA scaling for partial innings, field_error/fielders_choice not counted as hits.
- `pitchCount` is always 0 — `PlayEventRow` has no per-pitch count field; pitch-by-pitch entry is out of MVP scope (PLAN.md).
- `earnedRuns` uses event-level `isEarnedRun` flag: all `runsScored` on an event are earned when true. Mixed earned/unearned on one event is not expressible in the current schema and does not occur in typical youth league play.
- All acceptance criteria satisfied.
