# T-011: Roster management screen

## Status
Done

## Epic
E-02 Core Entry Flows

## Priority
P0

## Goal
Provide a screen where a parent can add players to their team roster, assign jersey numbers and positions, and mark players active or inactive. This screen is required before any lineup can be built for a game.

## Why it matters
The roster is the player source-of-truth for lineups, play attribution, and season stats. It must exist before T-012 (game creation) or T-013 (lineup builder) can be used.

## Scope
- Roster screen accessible from the team detail screen
- Player list sorted by jersey number
- Create player: first name, last name, jersey number, positions (multi-select), active (default true)
- Edit player: all fields inline
- Delete player: immediate (no cascade guard needed — no games exist yet)
- Active/inactive toggle as a quick action on the player card
- Inline form expansion (no modals)
- Empty state message when no players exist
- Field & Form design system throughout; all touch targets ≥ 44px

## Out of scope
- Jersey number uniqueness enforcement (deferred)
- Player photo upload
- Batting order assignment (T-013)
- Defensive position assignment per game (T-013)

## Dependencies
- T-001 (scaffold) — Done
- T-002 (shared UI components) — Done
- T-003 (Dexie schema + repositories) — Done
- T-004 (TypeScript interfaces) — Done
- T-010 (routing pattern + team detail screen) — Done

## Files likely touched
- `tickets/T-011-roster-screen.md` (this file)
- `src/router.tsx` (add roster route)
- `src/features/roster/usePlayers.ts` (new)
- `src/features/roster/RosterScreen.tsx` (new)
- `src/features/team/TeamDetailScreen.tsx` (add roster nav link)
- `src/App.tsx` (wire roster route)
- `TASKS.md` (status update)

## Ticket sizing check
- Expected to fit in one focused agent session: Yes
- Expected files touched: 7
- Split required if: stat engine or game state logic is needed (it is not)

## Acceptance criteria
- [ ] Roster nav link visible on the team detail screen
- [ ] Roster screen shows team name in header with back navigation to team detail
- [ ] Empty state displayed when no players exist
- [ ] User can create a player (first name, last name, jersey number, positions, active)
- [ ] Player appears immediately in the list after creation
- [ ] User can edit all player fields inline
- [ ] User can delete a player
- [ ] User can toggle a player active/inactive without opening the edit form
- [ ] All forms validate: first name required, last name required, jersey number required, at least one position required
- [ ] All touch targets ≥ 44px
- [ ] App typechecks with `tsc --noEmit`

## Test plan
- Manual: create player → verify in list → edit → verify → toggle active → verify badge changes
- Manual: delete player → verify removed
- Manual: empty state displayed on first visit
- Manual: back navigation returns to team detail
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
Implemented 2026-06-10. Created `src/features/roster/usePlayers.ts` (Dexie `liveQuery` subscription), and `src/features/roster/RosterScreen.tsx` (player list + inline create/edit/delete + active toggle). Extended `src/router.tsx` with `roster` route (`#/team/{teamId}/roster`). Updated `src/App.tsx` to render `RosterScreen`. Updated `src/features/team/TeamDetailScreen.tsx` to add a "Roster" nav card above seasons. `tsc --noEmit` passes clean.
