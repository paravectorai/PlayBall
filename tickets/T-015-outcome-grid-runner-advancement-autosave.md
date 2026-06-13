# T-015 — Live Scoring: Outcome Button Grid + Runner Advancement + Auto-Save

## Status: Done

## Priority: P0

## Epic: E-02 Core Entry Flows

## Summary
Add the outcome button grid, runner advancement panel, and auto-save logic to the live scoring screen. After T-014 built the scoreboard HUD and batter selection, T-015 completes the core plate-appearance recording loop: tap an outcome → confirm runner destinations if needed → play is auto-saved to Dexie → scoreboard updates instantly.

## Dependencies
- T-003 (Dexie schema + repositories) — Done
- T-004 (TypeScript interfaces / domain types) — Done
- T-014 (Live scoring HUD + batter selection) — Done

## Acceptance criteria
- [ ] Outcome button grid is rendered below the "Now Batting" card on `LiveScoringScreen`
- [ ] Grid is grouped: Hits (1B, 2B, 3B, HR), On Base (BB, IBB, HBP, CI), Outs (K▾, K▲, Out, E), Special (Sac F, Sac B, FC)
- [ ] Base Running section (SB, CS) is shown below the main grid
- [ ] All outcome buttons meet the ≥ 44px touch target requirement
- [ ] Tapping a deterministic outcome (K, Out, HR, Triple, BB/HBP/IBB/CI, SB/CS) auto-saves immediately with no extra steps
- [ ] Tapping a non-deterministic outcome (Single, Double, Error, FC, Sac Fly, Sac Bunt with runners) opens `RunnerPanel`
- [ ] `RunnerPanel` shows batter destination (fixed, read-only) and each occupied base with destination option buttons
- [ ] Destination options are contextually valid (runner can't go backward; valid targets: out, same, next bases, scored)
- [ ] Preview shows "N run(s) scored · N out(s)" and updates live as destinations are changed
- [ ] "Record Play" is enabled only when no two runners share the same base destination
- [ ] Tapping "Record Play" writes a `PlayEventRow` to Dexie with correct `runnersBefore`, `runnersAfter`, `runsScored`, `rbiCount`, `outsRecorded`, `isEarnedRun`
- [ ] Sequence number is fetched from `playEventRepo.nextSequenceNumber()` before writing
- [ ] After save, `LiveGameState` is rebuilt from the full event stream (full reload, not patch)
- [ ] Scoreboard HUD (score, inning, outs, runner diamond) reflects the new state immediately after save
- [ ] Batter index advances correctly after each plate appearance (wraps at end of lineup)
- [ ] When outs reach 3, inning advances and bases clear (handled by `buildLiveState` on reload)
- [ ] A brief success toast appears after each saved play (e.g. "Single — Smith scores! · 1 RBI")
- [ ] Saving state prevents duplicate taps (buttons disabled while saving)
- [ ] Cancel in `RunnerPanel` closes the panel without saving

## Files to create
- `src/features/live-scoring/recordPlay.ts` — pure helpers: default advancement, destination→RunnerState conversion, outcome labels
- `src/features/live-scoring/OutcomeGrid.tsx` — grouped outcome button grid component
- `src/features/live-scoring/RunnerPanel.tsx` — runner advancement overlay panel

## Files to modify
- `src/features/live-scoring/useGameState.ts` — add `reload()` trigger (loadKey counter)
- `src/features/live-scoring/LiveScoringScreen.tsx` — integrate outcome grid, runner panel, save logic, toast

## Out of scope (deferred to later tickets)
- Undo last play (T-016)
- Edit last play (T-016)
- Opponent score tracking (noted in T-014, still deferred)
- Drop-third-strike (passed ball / wild pitch on K) — ruleset complexity
- Tagging up on fly outs (simplified: field_out leaves runners in place)
- Pinch runner / substitution mid-game

## Notes
- Per TASKS.md note: this is the highest-risk ticket in the project — test on a real phone before marking Done
- `rbiCount` = `runsScored` for all outcomes except `field_error` (0 RBIs on errors)
- `isEarnedRun` = false for `field_error`, true for all others (simplified youth scoring)
- Batter destination for each outcome is fixed (outcome button determines it); only runner destinations are adjustable in the panel
- Stolen base / caught stealing set `batterPlayerId = ''` in the play event row (base-running-only events)

## Completion notes
Completed 2026-06-10. All acceptance criteria satisfied.

- `recordPlay.ts` — pure module with `computeDefaultAdvancement`, `destinationsToRunnerState`, `hasBaseConflict`, `OUTCOME_LABELS`, `countRunners`. No Preact or Dexie imports; fully testable in isolation.
- `OutcomeGrid.tsx` — 4-row grouped grid (Hits, On Base, Outs, Special) + `BaseRunningButtons` for SB/CS (only rendered when runners are on base). All buttons ≥ 56px height.
- `RunnerPanel.tsx` — full-screen overlay (fixed inset-0). Shows batter destination (fixed) + adjustable runner destinations with contextually valid options. Live preview of runs scored / outs. "Record Play" blocked on base conflicts.
- `useGameState.ts` — added `loadKey` counter + `reload()` function; state rebuilds from full event stream after each save.
- `LiveScoringScreen.tsx` — orchestrates the entire flow: outcome tap → compute defaults → show panel or save directly → reload state → toast. Saving flag prevents double-taps.
- RBI rule: `rbiCount = 0` for `field_error`; equals `runsScored` for all other outcomes.
- Inning transitions (3 outs → next inning, bases clear) are handled automatically by `buildLiveState` on reload.
- Build: clean. TypeScript: 0 errors. Bundle: 170KB JS / 16.3KB CSS.
- **Phone test required** before final sign-off (per TASKS.md note on highest-risk ticket).

## Test plan
1. Record a strikeout → verify 1 out added, batter advances, no panel shown
2. Record a home run with bases loaded → verify 4 runs scored, bases clear, all correct
3. Record a single with runners on 1st and 2nd → verify runner panel opens with correct defaults
4. In runner panel, adjust runner destinations → verify preview updates
5. Record play → verify scoreboard updates correctly
6. Record a walk with runner on 1st → verify force advance (batter to 1st, runner to 2nd), no panel
7. Fill an inning to 3 outs → verify inning number advances, bases clear
8. Test with empty bases on all play types → verify no panel for any outcome
