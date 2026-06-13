# T-013: Lineup builder screen

## Status
Done

## Epic
E-02 Core Entry Flows

## Priority
P0

## Goal
Provide a screen where a parent can assign each active roster player a batting order slot (1–9 or bench) and a defensive position before the game begins. The lineup is stored as `LineupRow` records in Dexie and is read by the live scoring screen (T-014).

## Why it matters
The live scoring screen needs to know the batting order to auto-advance the batter. Without a lineup, T-014 has no player sequence to rotate through.

## Scope
- `LineupBuilderScreen` in `src/features/game-setup/`
  - Loads all active players for the team
  - Merges players with any existing `LineupRow` records for the game
  - Two sections: "Batting Order" (battingOrder 1–9, sorted) and "Bench" (battingOrder = 0)
  - Each player card shows a ±1 stepper for batting slot and single-select position chips
  - Swap logic: incrementing into an occupied slot swaps the current occupant to the player's previous slot
  - Auto-saves to `lineupRepo.upsert` on every change — no explicit submit
  - Empty-roster state with navigation back to roster
- `useLineup(gameId)` hook — `liveQuery` subscription on `lineupRepo.findByGame`
- New `lineup` route: `#/team/:teamId/season/:seasonId/game/:gameId/lineup`
- `SeasonDetailScreen` — game card body is tappable, navigates to lineup builder

## Out of scope
- Mid-game substitution tracking (V2)
- DH / batting-order lock rules
- Lineup reuse from prior games
- Editing lineup during a game in progress

## Dependencies
- T-001 (scaffold) — Done
- T-002 (shared UI) — Done
- T-003 (Dexie schema + `LineupRepository`) — Done
- T-004 (TypeScript interfaces) — Done
- T-011 (roster + `usePlayers`) — Done
- T-012 (game creation + `SeasonDetailScreen`) — Done

## Files likely touched
- `tickets/T-013-lineup-builder.md` (this file)
- `src/features/game-setup/useLineup.ts` (new)
- `src/features/game-setup/LineupBuilderScreen.tsx` (new)
- `src/router.tsx` (add `lineup` route)
- `src/App.tsx` (wire `lineup` route)
- `src/features/game-setup/SeasonDetailScreen.tsx` (game card navigates to lineup)
- `TASKS.md` (status update)

## Ticket sizing check
- Expected to fit in one focused agent session: Yes
- Expected files touched: 7
- Split required if: live scoring logic is needed (it is not)

## Implementation notes
- Follow the `useGames` → `liveQuery` pattern for `useLineup`
- `lineupRepo.upsert` handles create-or-update by (gameId, playerId)
- Batting order 0 = bench (`BN`); 1–9 = active slots
- Swap on conflict: if the user increments a player into an occupied slot, move the occupant to the vacated slot
- Position default for unassigned players: `'BN'`
- Auto-save uses a `Set<playerId>` saving state to show per-player save indicators without blocking
- Touch targets ≥ 44px on all interactive elements
- Positions available: P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH, BN

## Acceptance criteria
- [x] Tapping a game in the season detail screen navigates to the lineup builder
- [x] All active players for the team are listed
- [x] Players with battingOrder > 0 appear in "Batting Order" section sorted by slot
- [x] Players with battingOrder = 0 appear in "Bench" section sorted by jersey number
- [x] Stepper increments/decrements batting order; conflict causes a slot swap
- [x] Position chips are single-select; selecting a new position auto-saves
- [x] Empty-roster state shown if no active players exist, with link to roster
- [x] Back navigation returns to season detail screen
- [x] App typechecks with `tsc --noEmit`

## Test plan
- Manual: create a game, tap it from season detail → lineup builder opens
- Manual: all active players listed; inactive players absent
- Manual: tap + on a bench player → moves to next open slot; position defaults to first non-BN position if was BN
- Manual: tap − on slot-1 player → moves to bench
- Manual: tap + on player-A in slot 2, player-B already in slot 3 → A moves to 3, B moves to 2 (swap)
- Manual: select a position chip → saves immediately; chip becomes highlighted
- Manual: navigate away and back → lineup persists
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

## Handoff notes
`LineupRow.battingOrder = 0` means bench. `lineupRepo.upsert` is safe to call on every interaction — it does a get-then-create-or-update in a single Dexie transaction-equivalent. The `usePlayers` hook in `src/features/roster/usePlayers.ts` returns ALL players; filter for `isActive === 1` in the screen.

## Risks
- Dexie liveQuery re-renders on every lineup write — with 12+ players this is fine but will be noticeable if auto-save fires for every keystroke. Mitigate: save on discrete events (button tap, chip tap), not on input changes.

## Completion notes
Implemented 2026-06-10. Created `useLineup.ts` (liveQuery on lineupRepo.findByGame), `LineupBuilderScreen.tsx` (batting order stepper with swap logic, single-select position chips, bench section, auto-save). Added `lineup` route to `router.tsx`. Wired in `App.tsx`. Updated `SeasonDetailScreen` so tapping a game card body navigates to the lineup builder. `tsc --noEmit` passes clean.
