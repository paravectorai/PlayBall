# T-010: Team and season management screen

## Status
Done

## Epic
E-02 Core Entry Flows

## Priority
P0

## Goal
Provide a screen where a parent can create a team, give it a name and abbreviation, and then create one or more seasons under that team. This is the entry point to the entire app — no game can be recorded until a team and season exist.

## Why it matters
A parent's first session starts here. The success criterion "set up a team roster and start recording a live game within 5 minutes of first launch" depends on this screen being fast, clear, and error-free. It also establishes the app's routing foundation that all subsequent E-02 screens depend on.

## Scope
- A minimal hash-based router that all E-02 screens will share
- Team list screen: view all teams, create a team, edit a team name/abbreviation, delete a team
- Team detail screen: view all seasons for a team, create a season, edit a season name/year, delete a season
- Empty state messages when no teams or no seasons exist
- Inline form expansion (no modal overlays) for create/edit flows
- Field & Form design system throughout; all touch targets ≥ 44px

## Out of scope
- Roster management (T-011)
- Game creation (T-012)
- Delete team cascade logic (teams with seasons/games are not yet deletable — warn and block)
- Ruleset configuration on seasons (left for T-012)

## Dependencies
- T-001 (scaffold) — Done
- T-002 (shared UI components) — Done
- T-003 (Dexie schema + repositories) — Done
- T-004 (TypeScript interfaces) — Done

## Files likely touched
- `tickets/T-010-team-season-screen.md` (this file)
- `src/router.tsx` (new)
- `src/features/team/useTeams.ts` (new)
- `src/features/team/useSeasons.ts` (new)
- `src/features/team/TeamListScreen.tsx` (new)
- `src/features/team/TeamDetailScreen.tsx` (new)
- `src/App.tsx` (updated — wire router)
- `TASKS.md` (status update)

## Ticket sizing check
- Expected to fit in one focused agent session: Yes
- Expected files touched: 8
- Split required if: live scoring or stat engine logic is needed (it is not)

## Implementation notes
- Router: minimal hash-based (`#/` for team list, `#/team/{id}` for detail). No library required.
- Live queries: use `liveQuery` from `dexie` wrapped in Preact `useEffect` — do NOT add `dexie-react-hooks`.
- Inline forms: toggled via component state; no modals; slide/reveal with a border-top.
- Delete team: if the team has any seasons, show an error badge and block delete (do not cascade silently).
- Delete season: if the season has any games (future), block delete; for now, allow since no games exist yet.
- Abbreviation max length: 5 characters, uppercase enforced on input.
- Year field: number input, min 2020, max 2040.

## Acceptance criteria
- [ ] User sees a team list on first load (empty state if no teams)
- [ ] User can create a team with name + abbreviation; team appears immediately in the list
- [ ] User can edit a team's name and abbreviation inline
- [ ] User can delete a team with no seasons (blocked with message if seasons exist)
- [ ] User can tap a team to see its seasons (empty state if none)
- [ ] User can create a season with name + year; season appears immediately
- [ ] User can edit a season's name and year
- [ ] User can delete a season
- [ ] Back navigation returns from team detail to team list
- [ ] All forms validate: name required, abbreviation required, year valid range
- [ ] All touch targets ≥ 44px
- [ ] App typechecks with `tsc --noEmit`

## Test plan
- Manual: create team → verify in list → tap → create season → verify → edit season → verify → back
- Manual: attempt delete team with seasons → verify blocked message
- Manual: delete season → verify removed
- Manual: empty state messages display correctly
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
- Router pattern established in `src/router.tsx`; future E-02 tickets must extend the `Route` union type there rather than creating a second router
- `useTeams` and `useSeasons` hooks use `liveQuery` subscription pattern — follow the same pattern in T-011 and T-012

## Risks
- Preact + Dexie `liveQuery`: if Preact doesn't receive observable updates correctly, fall back to polling with `useEffect` interval
- No routing library means back button works via `hashchange` but programmatic back is `history.back()` — test on iOS Safari

## Completion notes
Implemented 2026-06-10. Created `src/router.tsx` (minimal hash-based router with `useRoute` hook and `navigate` function), `src/features/team/useTeams.ts` and `useSeasons.ts` (Dexie `liveQuery` subscriptions), `TeamListScreen.tsx` (team list + inline create/edit/delete), and `TeamDetailScreen.tsx` (season list + inline create/edit/delete + inline team edit). Updated `src/App.tsx` to route between screens. Also updated `shared/ui/Button.tsx` and `Input.tsx` to use `ComponentProps<'button'>` and `ComponentProps<'input'>` so all native HTML attributes pass through to the underlying element. `tsc --noEmit` passes clean.
