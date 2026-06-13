---
id: T-024
title: Game summary screen (box score, batting/pitching lines)
epic: E-03
status: Done
priority: P0
owner: Claude
dependencies: [T-020, T-021, T-023]
---

## Scope

Build a read-only `GameSummaryScreen` reachable from the Play Log screen and from game cards on the Season Detail screen.

Sections:
1. **Header** — opponent, date, home/away badge, game status badge
2. **Line Score** — our team's runs per inning + R and H totals (opponent score not tracked in current schema)
3. **Batting** — per-player table: AB, R, H, 2B, 3B, HR, RBI, BB, SO, AVG; sorted by lineup batting order; totals footer row
4. **Pitching** — per-player table: IP, H, R, ER, BB, SO, ERA
5. **Fielding** — deferred (T-022 Planned; no fielding stat rows in game_stats yet)

## Acceptance criteria

- [ ] Screen renders without error when a game has play events with computed stats
- [ ] Line score shows correct per-inning run totals (respects home/away half)
- [ ] Batting table rows are sorted by lineup batting order (bench/unordered players at bottom)
- [ ] Batting totals row sums all count stats; AVG cell shows `—`
- [ ] IP formatted as "X.Y" (e.g. 8 outs → 2.2)
- [ ] AVG formatted as ".XYZ" (leading zero stripped; 0 → .000)
- [ ] "Summary" button added to PlayLogScreen header
- [ ] "Summary" button added to each game card on SeasonDetailScreen
- [ ] Route `/team/:teamId/season/:seasonId/game/:gameId/summary` navigates correctly
- [ ] Loading skeleton shown while data loads
- [ ] Empty-state copy shown if no batting/pitching stats exist yet

## Files changed

- `src/features/game-summary/GameSummaryScreen.tsx` — new
- `src/router.tsx` — add `game-summary` route
- `src/App.tsx` — add route handler
- `src/features/play-log/PlayLogScreen.tsx` — Summary nav button
- `src/features/game-setup/SeasonDetailScreen.tsx` — Summary button on game cards

## Test plan

- Open a completed game with stats; verify line score sums match total runs in event log
- Verify batting rows sorted by batting order; verify totals row
- Verify pitching IP formatting for 0, 1, 2, 3 outs
- Navigate to summary from PlayLogScreen and from SeasonDetailScreen
- Open a game with zero plays; verify empty state shown

## Completion notes

- All acceptance criteria met. `tsc --noEmit` clean; 63 tests pass.
- Fielding section intentionally omitted (T-022 not yet done; no fielding stat rows exist in game_stats).
- Also removed a pre-existing unused variable (`deleteCalledBeforeAnyUpsert`) from the StatRebuilderService test that was causing a spurious TS6133 error.
- Line score respects home/away: away team bats in `top` half-innings, home in `bottom`.
