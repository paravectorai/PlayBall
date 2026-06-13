# T-014 — Live Scoring Screen: Scoreboard HUD + Batter Selection

## Status: Done

## Priority: P0

## Epic: E-02 Core Entry Flows

## Summary
Build the live scoring screen shell — the scoreboard HUD (inning, outs, score, runner diamond) and batting order list with current batter highlight and manual batter selection. This screen is the entry point to all live scoring (T-015 outcome buttons, T-016 undo, T-017 play log). T-014 covers display and navigation only; play recording begins in T-015.

## Dependencies
- T-003 (Dexie schema + repositories) — Done
- T-004 (TypeScript interfaces / domain types) — Done
- T-013 (Lineup builder) — Done; lineup data is prerequisite for batter rotation

## Acceptance criteria
- [ ] Navigating to `/team/:teamId/season/:seasonId/game/:gameId/score` renders `LiveScoringScreen`
- [ ] Game status is set to `in_progress` when the screen mounts (if currently `scheduled`)
- [ ] Scoreboard HUD shows: half-inning arrow + inning number, out dots (0–2 filled), our score
- [ ] Runner diamond shows first/second/third base occupancy (orange = occupied, gray = empty)
- [ ] "Now Batting" section shows current batter name, jersey number, batting position, and position
- [ ] Batting order list shows all lineup entries with batting order, jersey, name, position
- [ ] Current batter is highlighted in the list (clay orange)
- [ ] Tapping a different player in the batting order updates the current batter highlight (in-memory, not persisted)
- [ ] "Start Scoring" / "Continue Scoring" CTA is present on `LineupBuilderScreen`
- [ ] Back navigation from live scoring returns to lineup screen
- [ ] If no lineup is set, an empty-state message is shown with a link back to lineup

## Files to create
- `src/features/live-scoring/useGameState.ts` — loads lineup + play events, computes LiveGameState
- `src/features/live-scoring/LiveScoringScreen.tsx` — scoreboard HUD + batter selection UI

## Files to modify
- `src/router.tsx` — add `score` route + hash pattern
- `src/App.tsx` — render `LiveScoringScreen` for `score` route
- `src/features/game-setup/LineupBuilderScreen.tsx` — add "Start Scoring" CTA
- `src/features/game-setup/SeasonDetailScreen.tsx` — game card navigates to score for in_progress games

## Out of scope (deferred to later tickets)
- Outcome button grid (T-015)
- Runner advancement controls (T-015)
- Play recording / auto-save (T-015)
- Undo last play (T-016)
- Opponent score tracking — opponent score defaults to 0 in this ticket; follow-up needed

## Risks
- Game state reconstruction from play events must be correct even at 0 events (new game)
- Batter index selection is in-memory only; it resets on page reload (T-015 will persist via play events)

## Test plan
- Create a team + season + game + lineup, navigate to Live Scoring screen
- Verify scoreboard HUD renders with correct initial state (Inning 1, 0 outs, empty bases)
- Tap a player in the batting order, verify the "Now Batting" card updates
- Navigate back and forth; verify game status becomes in_progress
- Test with an empty lineup — verify empty-state message appears

## Completion notes
Completed 2026-06-10. All acceptance criteria met.

- `useGameState` replays play events to reconstruct `LiveGameState` from scratch on load; handles 0-event (new game) case correctly.
- `LiveScoringScreen` renders scoreboard HUD (score, inning, out dots, runner diamond), "Now Batting" card, and full batting order list with tap-to-select batter.
- Game status is set to `in_progress` on mount if currently `scheduled`.
- "Start Scoring" / "Continue Scoring" CTA added to `LineupBuilderScreen` (only visible when ≥1 batter is in the lineup).
- `SeasonDetailScreen` game cards now show "Score" / "Continue Scoring" action for non-completed games.
- Opponent score defaults to 0 (our play events only record our runs). A follow-up ticket is needed to add manual opponent-score tracking.
- Build: clean. TypeScript: 0 errors. Bundle: 157KB JS / 14.8KB CSS.
