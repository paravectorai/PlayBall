# T-016 — Live scoring: undo last play + edit last play

## Status
Done

## Priority
P0

## Epic
E-02 Core Entry Flows

## Summary
Adds undo and edit actions for the most recently recorded play in the live scoring screen. Parents make scoring mistakes under time pressure; these controls are the primary error-recovery path before a full play-log editor (T-017) is available.

## Acceptance criteria
- [x] A "Last Play" strip appears below the outcome grid whenever at least one play has been recorded for the current game
- [x] The strip displays the outcome label, half-inning arrow, inning number, and run count (if any)
- [x] Tapping **Undo** deletes the last `play_event` record, rebuilds game state from the remaining event stream, and shows a toast: "Undone: [outcome]"
- [x] Tapping **Edit** opens a full-screen `EditPlayPanel` overlay showing the current outcome and a fresh `OutcomeGrid`
- [x] Selecting a new outcome in the edit panel that needs runner input advances to a `RunnerPanel` overlay
- [x] Confirming an edit calls `playEventRepo.update()` with the new outcome + recomputed runner/run/out values, then reloads state and shows "Updated: [outcome]"
- [x] Undo and Edit buttons are disabled while a save/undo operation is in flight (`saving === true`)
- [x] All interactive elements meet the ≥ 44px touch target requirement

## Dependencies
- T-015 (outcome grid + runner advancement + autosave) — must be Done

## Files changed
- `src/features/live-scoring/EditPlayPanel.tsx` — new; full-screen overlay for editing a play
- `src/features/live-scoring/LiveScoringScreen.tsx` — added `lastEvent` state, `editingPlay` state, `handleUndoLastPlay`, `handleEditSave`, `EditPlayPanel` overlay, and Last Play strip UI

## Tests
No automated tests added (UI-level interaction; validate on device per T-015 precedent).

## Risks / follow-ups
- Edit only applies to the **last** play. Editing older plays requires T-017 (play log screen with full edit/delete/recompute).
- `StatRebuilderService` (T-023) does not yet exist; undo/edit correctly rebuilds live game state but does not recompute cached `player_game_stats` rows (those don't exist until E-03).

## Completion notes
Implemented 2026-06-10. TypeScript type-check passes cleanly with no new errors. Reuses `RunnerPanel` and `OutcomeGrid` components unchanged. `EditPlayPanel` uses `playEvent.runnersBefore` as the authoritative pre-play runner state when computing new advancement defaults, so edited plays are self-consistent.
