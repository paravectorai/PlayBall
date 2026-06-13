# T-017: Play Log Screen

## Status
Done

## Priority
P0

## Epic
E-02 Core Entry Flows

## Summary
A dedicated screen showing the full ordered play event log for a game.
Allows editing or deleting any play (not just the last one), and automatically
recomputes stored `runnersBefore` for all subsequent events after any mutation.

## Acceptance criteria
- [ ] Screen is reachable from the Live Scoring screen header
- [ ] All play events for the game are listed in chronological order (sequenceNumber ascending)
- [ ] Each row shows: inning, half-inning indicator, batter name + jersey number, outcome label, runs scored, outs recorded
- [ ] Edit button on each row opens `EditPlayPanel` full-screen overlay
- [ ] After editing, `runnersAfter`/runner counts are saved and `runnersBefore` is recomputed on all subsequent events
- [ ] Delete button on each row deletes the event after `window.confirm()` guard
- [ ] After deleting, `runnersBefore` is recomputed on all remaining subsequent events
- [ ] Empty state shown when no plays have been recorded
- [ ] Loading skeleton shown while data loads
- [ ] Touch targets ≥ 44px on all buttons

## Dependencies
- T-015 (play events written to DB with sequenceNumber)
- T-016 (EditPlayPanel component exists and is reusable)
- T-003 (playEventRepo CRUD)

## Files changed
- `src/features/play-log/PlayLogScreen.tsx` (new)
- `src/router.tsx` — added `play-log` route
- `src/App.tsx` — render PlayLogScreen
- `src/features/live-scoring/LiveScoringScreen.tsx` — "Log" link in header

## Implementation notes
- `recomputeRunnerStates(gameId)` replays all events in sequenceNumber order and
  writes corrected `runnersBefore` to each event that diverges. Called automatically
  after every edit or delete; transparent to the user.
- `window.confirm()` guards delete since this is an arbitrary historical event,
  not just the last play (unlike undo in T-016).
- Base-running-only events (stolen_base, caught_stealing) show no batter name row.

## Completion notes — 2026-06-10
- Implemented all acceptance criteria
- Auto-recompute is silent (no separate "Recompute" button needed)
- Reuses EditPlayPanel and RunnerPanel unchanged from T-016
