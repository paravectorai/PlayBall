# T-025 — Season aggregate rollup (player-season stat cache build & rebuild)

## Status: Done
## Priority: P0
## Epic: E-03 Stats Engine
## Owner: Claude

## Summary
Add `rebuildSeasonStats(seasonId)` to `StatRebuilderService` and wire it into every
code path that already calls `rebuildGameStats`.  After each game-level recompute the
season cache is refreshed so `SeasonStatRow` records always reflect the full up-to-date
season totals.

## Acceptance criteria
- `StatRebuilderService.rebuildSeasonStats(seasonId)` loads all play events across all
  games in the season, derives batting and pitching stats per unique player, deletes any
  stale season stat rows, and upserts fresh `SeasonStatRow` records.
- Rate stats (AVG, OBP, SLG, OPS, ERA, WHIP) are recomputed from raw events — not by
  summing game-level rate values — so denominators are always correct.
- Calling the method with a season that has no completed games writes no rows (and does
  not error).
- `LiveScoringScreen` and `PlayLogScreen` call `rebuildSeasonStats(seasonId)` immediately
  after each `rebuildGameStats(gameId)` call.
- Unit tests cover: empty season, single game/single player, two games/same player
  accumulates counts, rate stats are recomputed correctly, delete runs before upserts.

## Dependencies
- T-020 (batting stat derivation) — Done
- T-021 (pitching stat derivation) — Done
- T-023 (StatRebuilderService game stats) — Done
- SeasonStatRepository + SeasonStatRow — already exist

## Files touched
- `src/domain/stat-engine/StatRebuilderService.ts`
- `src/domain/stat-engine/__tests__/StatRebuilderService.test.ts`
- `src/features/live-scoring/LiveScoringScreen.tsx`
- `src/features/play-log/PlayLogScreen.tsx`

## Test plan
Run `npm test` — all existing tests must continue to pass; new
`rebuildSeasonStats` suite must pass.

## Completion notes
Implemented 2026-06-10.

- Added `GamesRepo` and `SeasonStatsRepo` repo interfaces to `StatRebuilderService` with constructor injection; defaults to real Dexie repos so existing game-stats behaviour is unchanged.
- `rebuildSeasonStats` loads all play events across all games in the season and feeds them to the existing `deriveBattingStats` / `derivePitchingStats` functions per unique player — same approach as game-level rebuild, ensuring rate stats (OBP, ERA, WHIP) use correct season-aggregate denominators.
- `rebuildSeasonStats(seasonId)` called immediately after every `rebuildGameStats(gameId)` in `LiveScoringScreen` (3 call sites: save play, undo, edit) and `PlayLogScreen` (2 call sites: delete, edit).
- 9 new unit tests added to `StatRebuilderService.test.ts`; all 72 tests pass.
