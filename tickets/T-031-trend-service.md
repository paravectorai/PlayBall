---
id: T-031
title: TrendService — rolling last-3, last-5, season-to-date metric windows
status: Done
priority: P0
epic: E-04
assignee: Claude
---

## Scope

Implement a `TrendService` domain service that computes rolling stat windows per player from ordered per-game batting and pitching stat snapshots. Expose `last3`, `last5`, and `seasonToDate` windows. Rate stats inside each window are recomputed from summed count stats — never averaged from per-game rates.

As a prerequisite, add `sacFlies` to `BattingStats` so OBP can be correctly recomputed in trend windows (the OBP denominator requires sac fly count).

## Acceptance criteria

- [x] `TrendService.computeBattingTrends(gameStats: BattingStats[])` returns `PlayerBattingTrends` with `last3`, `last5`, `seasonToDate` windows
- [x] `TrendService.computePitchingTrends(gameStats: PitchingStats[])` returns `PlayerPitchingTrends` with `last3`, `last5`, `seasonToDate` windows
- [x] Window size reflects available games: if player has 2 games, `last3.gamesInWindow === 2`
- [x] Rate stats (AVG, OBP, SLG, OPS, ERA, WHIP) are recomputed from summed count stats — not averaged
- [x] All count stats are correctly summed across window games
- [x] `sacFlies` added to `BattingStats` type; `deriveBattingStats` returns it; OBP recomputation in `TrendService` uses it
- [x] Unit tests verify window slicing, correct rate-stat recomputation, and edge cases (empty input, < N games)

## Files changed

- `src/domain/stat-engine/types.ts` — added `sacFlies: number` to `BattingStats`
- `src/domain/stat-engine/battingStats.ts` — compute and return `sacFlies`
- `src/domain/trends/types.ts` — `BattingTrendWindow`, `PitchingTrendWindow`, `PlayerBattingTrends`, `PlayerPitchingTrends`
- `src/domain/trends/TrendService.ts` — pure computation service
- `src/domain/trends/__tests__/TrendService.test.ts` — unit tests
- `src/domain/index.ts` — export TrendService, trend types

## Dependencies

- T-020 Done (BattingStats type and derivation)
- T-021 Done (PitchingStats type and derivation)
- T-030 Done (season dashboard; T-032 will consume trend data from this service)

## Risks / follow-ups

- `sacFlies` addition is backwards-compatible with Dexie rows (stored as `Record<string, number>`; old rows without the field will return `undefined`, treated as 0 in window summation)
- T-032 (sparklines) will call `TrendService` through a hook; no hook included here — the service is pure computation, hooks live in feature modules

## Completion notes

Implemented 2026-06-10. All acceptance criteria satisfied. Tests pass.
