# T-022 — Fielding stat derivation

**Epic:** E-03 Stats Engine
**Priority:** P1
**Status:** Done
**Delegation:** Claude-only (domain logic, schema analysis)
**Depends on:** T-020 (Done), T-021 (Done), E-02 (Done)

## Scope
Implement `deriveFieldingStats(playerId, events)` — a pure function that reads a full ordered
list of `PlayEventRow` records for one game and returns a fully populated `FieldingStats` object
for the given player.

This ticket does NOT write stats to the database; persistence is handled by T-023
(StatRebuilderService). `StatRebuilderService` does not call `deriveFieldingStats` in the MVP
because the schema does not provide per-player fielding attribution (see Schema limitation below).

## Acceptance criteria
- [x] `deriveFieldingStats(playerId, events)` exported from `src/domain/stat-engine/fieldingStats.ts`
- [x] Returns a `FieldingStats` with `putouts`, `assists`, `errors`, `doublePlays`, `fieldingPct`
- [x] `fieldingPct` is 0 when PO + A + E = 0 (never NaN or undefined)
- [x] Function signature and zero-return behavior are fully documented in the source
- [x] Unit tests verify zero-return for all inputs and the `fieldingPct` guard
- [x] `deriveFieldingStats` exported from `src/domain/index.ts`
- [x] Schema limitation documented in `DECISIONS.md`

## Files touched
- `src/domain/stat-engine/fieldingStats.ts` (new)
- `src/domain/stat-engine/__tests__/fieldingStats.test.ts` (new)
- `src/domain/index.ts` (add export)
- `tickets/T-022-fielding-stat-derivation.md` (this file)
- `TASKS.md` (status update)
- `DECISIONS.md` (ADR-007)

## Schema limitation
`PlayEventRow` records which OUTCOME occurred (`field_out`, `field_error`, `fielders_choice`)
but does NOT record which fielder was involved. There is no `fielderPlayerId` (or equivalent)
field on the event row. Without that attribution, putouts, assists, errors, and double plays
cannot be derived for individual players from the event log alone.

This mirrors the `pitchCount` limitation in T-021: the field is defined in `FieldingStats`,
`deriveFieldingStats` is correctly typed and returns zeros, and a future ticket can add
`fielderIds` to `PlayEventRow` to unlock real derivation.

## Future path
When per-play fielder attribution is added to the schema, `deriveFieldingStats` should:
- Count events where `fielderIds.putout === playerId` → `putouts`
- Count events where `fielderIds.assist === playerId` → `assists`
- Count events where `fielderIds.error === playerId` → `errors`
- Count events tagged with `isDoublePlay && playerId in fielderIds.*` → `doublePlays`
- Compute `fieldingPct = (PO + A) / (PO + A + E)` where denominator > 0

## Test plan
- Player with no events → all zeros including `fieldingPct`
- Player with events containing `field_error`, `field_out`, `fielders_choice` → still all zeros
  (correct: schema cannot attribute these to a specific player)
- `fieldingPct` is 0 when PO = A = E = 0 (division-by-zero guard)

## Completion notes
- Completed 2026-06-11.
- `deriveFieldingStats(playerId, events)` implemented in `src/domain/stat-engine/fieldingStats.ts`.
- Function always returns zeros because `PlayEventRow` has no per-fielder attribution field.
  This is correct MVP behavior — see ADR-007 in `DECISIONS.md`.
- 7 unit tests pass covering: empty events, events with fielding outcomes, cross-player isolation,
  fieldingPct zero-denominator guard.
- `StatRebuilderService` is NOT updated in this ticket: since all stats would be zeros, writing
  fielding stat rows to the database adds no value. A future schema-extension ticket should update
  both the event model and `StatRebuilderService` together.
- All acceptance criteria satisfied.
