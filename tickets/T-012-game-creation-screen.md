# T-012: Game creation screen

## Status
Done

## Epic
E-02 Core Entry Flows

## Priority
P0

## Goal
Provide a screen where a parent can create a new game for a season, specifying the opponent,
date, whether the team is home or away, and the number of innings scheduled. Once created the
game appears in the season's game list and can be opened for lineup building (T-013) and live
scoring (T-014).

## Why it matters
Every live-scoring and stat-tracking flow begins with a game record. This screen is the entry
point for each game in the season.

## Scope
- Season detail screen (`SeasonDetailScreen`) accessible from the team detail screen
  - Shows list of games for the season (most recent first)
  - "New Game" button navigates to game creation form
  - Delete game from the list
  - Empty state when no games exist
- Game creation screen (`GameSetupScreen`)
  - Fields: opponent (text), game date (date, default today), home/away (toggle), innings
    scheduled (number, default 6, range 1–9)
  - Saves a `GameRow` with `status: 'scheduled'` and `defaultRuleset`
  - On save navigates back to season detail

## Out of scope
- Editing a game after creation (deferred)
- Lineup builder (T-013)
- Live scoring (T-014)
- Ruleset configuration (deferred; uses `defaultRuleset`)

## Dependencies
- T-001 (scaffold) — Done
- T-002 (shared UI components) — Done
- T-003 (Dexie schema + repositories) — Done
- T-004 (TypeScript interfaces) — Done
- T-011 (routing pattern + team/roster screens) — Done

## Files likely touched
- `tickets/T-012-game-creation-screen.md` (this file)
- `src/router.tsx` (add season and new-game routes)
- `src/features/game-setup/useGames.ts` (new)
- `src/features/game-setup/SeasonDetailScreen.tsx` (new)
- `src/features/game-setup/GameSetupScreen.tsx` (new)
- `src/App.tsx` (wire new routes)
- `src/features/team/TeamDetailScreen.tsx` (make seasons tappable → season route)
- `TASKS.md` (status update)

## Ticket sizing check
- Expected to fit in one focused agent session: Yes
- Expected files touched: 8
- Split required if: live scoring or lineup logic is needed (it is not)

## Acceptance criteria
- [x] Season nav available from team detail screen (tap a season → season detail)
- [x] Season detail screen shows season name in header with back navigation to team detail
- [x] Season detail shows empty state when no games exist
- [x] "New Game" button opens the game creation screen
- [x] Game creation form: opponent (required), game date (required), home/away, innings (1–9)
- [x] Saved game appears immediately in the season game list
- [x] User can delete a game from the season list
- [x] All touch targets ≥ 44px
- [x] App typechecks with `tsc --noEmit`

## Test plan
- Manual: navigate team → season → verify empty state
- Manual: tap "New Game" → fill form → save → game appears in list
- Manual: validation errors shown when opponent or date missing
- Manual: delete game → removed from list
- Manual: back navigation at each level works correctly
- `npm run typecheck` must pass

## Deployment or observability notes
- No deployment impact — local-only PWA
- No new log events needed

## Validation commands
```bash
npm run typecheck
```

## Delegation category
Delegable

## Recommended owner
Claude

## Completion notes
Implemented 2026-06-10. Created `src/features/game-setup/useGames.ts` (Dexie `liveQuery`
subscription), `src/features/game-setup/SeasonDetailScreen.tsx` (game list + delete + nav to
new game), and `src/features/game-setup/GameSetupScreen.tsx` (creation form: opponent, date,
home/away toggle, innings). Added `season` and `new-game` routes to `src/router.tsx`. Wired
both screens in `src/App.tsx`. Updated `TeamDetailScreen` so tapping a season navigates to
the season detail screen. `tsc --noEmit` passes clean.
