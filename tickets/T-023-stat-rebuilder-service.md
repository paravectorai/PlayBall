# T-023 — StatRebuilderService: full event-stream recompute

**Epic:** E-03 Stats Engine
**Priority:** P0
**Status:** Done
**Delegation:** Claude-only (data pipeline orchestration, correctness)
**Depends on:** T-020 (Done), T-021 (Done)

## Scope
Implement `StatRebuilderService` — the service that takes a `gameId`, loads its full ordered event
stream, derives batting and pitching stats for every participant, and writes the results to the
`game_stats` cache table. This is the persistence layer that T-020/T-021 left as future work.

The service must be triggered after every event mutation (record, edit, delete, undo) so the
cached stats stay in sync with the event log. Integration points are `LiveScoringScreen` and
`PlayLogScreen`.

Season-level rollup (`rebuildSeasonStats`) is explicitly out of scope for this ticket — that work
belongs to T-025.

## Acceptance criteria
- [x] `StatRebuilderService` class exported from `src/domain/stat-engine/StatRebuilderService.ts`
- [x] `statRebuilderService` singleton exported from the same file
- [x] `rebuildGameStats(gameId)` deletes all existing `game_stats` rows for the game, then
      derives fresh stats for every batter and pitcher found in the event stream
- [x] Batting stats written for every player who appears as `batterPlayerId` in at least one event
- [x] Pitching stats written for every player who appears as `pitcherPlayerId` in at least one event
- [x] Empty event list produces no stat rows (no crash)
- [x] Constructor accepts optional repo overrides so unit tests can inject mocks
- [x] Unit tests cover: empty game, single batter, single pitcher, multiple participants,
      correct stat type labels, deleteByGame called before upserts
- [x] `statRebuilderService` exported from `src/domain/index.ts`
- [x] `LiveScoringScreen` calls `rebuildGameStats` after save, undo, and edit-save
- [x] `PlayLogScreen` calls `rebuildGameStats` after delete and edit-save

## Files to touch
- `src/domain/stat-engine/StatRebuilderService.ts` (new)
- `src/domain/stat-engine/__tests__/StatRebuilderService.test.ts` (new)
- `src/domain/index.ts` (add export)
- `src/features/live-scoring/LiveScoringScreen.tsx` (call rebuild after mutations)
- `src/features/play-log/PlayLogScreen.tsx` (call rebuild after mutations)
- `tickets/T-023-stat-rebuilder-service.md` (this file)
- `TASKS.md` (status update)

## Test plan
- Empty game → `deleteByGame` called, no `upsert` calls
- Single batter, no pitcher events → one batting upsert, zero pitching upserts
- Single pitcher, no batter events → one pitching upsert, zero batting upserts
- Two batters, one pitcher → two batting upserts + one pitching upsert
- `deleteByGame` is called before any `upsert` (order matters — stale rows must be removed first)
- Stat values passed to `upsert` match the output of `deriveBattingStats` / `derivePitchingStats`

## Completion notes
- Completed 2026-06-10.
- `StatRebuilderService` implemented with constructor DI for testability.
- Delete-then-insert approach used (not upsert-in-place) — ensures stale player rows removed when
  a player's events are all deleted.
- 10 unit tests pass covering all acceptance criteria.
- Wired into `LiveScoringScreen` (savePlay, handleUndoLastPlay, handleEditSave) and `PlayLogScreen`
  (handleDelete, handleEditSave) — stat rebuild fires after every event mutation.
- Season rollup deferred to T-025 as planned.
