---
id: T-030
title: Season dashboard screen (player stat cards, season totals, rate stats)
status: Done
priority: P0
epic: E-04
assignee: Claude
---

## Scope

Build a `SeasonDashboardScreen` that surfaces per-player season stat cards for a given season. Players with batting stats show a compact batting line; players with pitching stats show a pitching line below. The screen is navigable from `SeasonDetailScreen` via a "Season Stats" button.

## Acceptance criteria

- [ ] Screen loads season stats from `seasonStatRepo.findBySeason()` and cross-references player names/jersey numbers
- [ ] Each player card shows batting stats: G (games, derived from game stat rows count), PA, AB, H, 2B, 3B, HR, R, RBI, BB, SO, SB, AVG, OBP, SLG, OPS
- [ ] Players who also have pitching stats show a second row: IP, BF, H, R, ER, BB, SO, ERA, WHIP
- [ ] Players are sorted by jersey number ascending
- [ ] Rate stats formatted consistently: AVG/OBP/SLG as ".xxx", OPS as ".xxx", ERA as "x.xx", WHIP as "x.xx"
- [ ] Loading skeleton while data fetches
- [ ] Empty state when no stats exist yet for the season
- [ ] Back navigation to SeasonDetailScreen
- [ ] All touch targets ≥ 44px
- [ ] "Season Stats" button added to SeasonDetailScreen header area

## Files to create/modify

- `src/features/season-dashboard/useSeasonStats.ts` — data hook
- `src/features/season-dashboard/SeasonDashboardScreen.tsx` — screen component
- `src/router.tsx` — add `season-dashboard` route type, parse, and navigate
- `src/App.tsx` — add route handler
- `src/features/game-setup/SeasonDetailScreen.tsx` — add "Season Stats" nav button

## Dependencies

- T-025 Done (season aggregate rollup writes `player_season_stats`)
- T-003 Done (SeasonStatRepository available)

## Test plan

1. Navigate to a season with completed games → click "Season Stats" → cards render for each player
2. Confirm batting rate stats match the stat engine output from T-020
3. Confirm pitching stats render for players who pitched
4. Navigate to a season with no games → empty state shows
5. Back button returns to season detail

## Risks / follow-ups

- T-031 (TrendService) and T-032 (sparklines) will add trend windows to these cards — no hooks or state needed yet
- G (games played) is derived by counting distinct `gameId` values in `player_game_stats`; this requires an additional repo call

## Completion notes

Implemented 2026-06-10. All acceptance criteria satisfied.

Files changed:
- Created `src/features/season-dashboard/useSeasonStats.ts`
- Created `src/features/season-dashboard/SeasonDashboardScreen.tsx`
- Modified `src/router.tsx`
- Modified `src/App.tsx`
- Modified `src/features/game-setup/SeasonDetailScreen.tsx`
