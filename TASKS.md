# TASKS.md

## Status legend
- Planned
- Ready
- In Progress
- Blocked
- In Review
- Done

## Priority legend
- P0 = critical path / release blocker
- P1 = important but not blocking the next milestone
- P2 = useful but deferrable

## WIP rule
- Maximum 3 tickets may be `In Progress` at once.
- Only 1 `In Progress` ticket may own the same file or module domain at a time.
- Prefer clearing `In Review` or `Blocked` tickets before starting new ones.

## Current priority
E-01 (Foundation) is the active phase. All E-01 tickets must be Done before any E-02 feature screens begin. The scaffold, design tokens, Dexie schema, and TypeScript interfaces are foundational — every later ticket depends on them.

## Active work
| Ticket | Owner | Files/domain | Expected handoff |
|--------|-------|--------------|-----------------|
| T-001 | Claude | vite.config.ts, package.json, tsconfig, tailwind.config.ts, index.html, src/main.tsx, src/App.tsx, src/index.css | Done 2026-06-10 |
| T-002 | Claude | src/shared/ui/ | Done 2026-06-10 |
| T-003 | Claude | src/data/ (schema, db, repositories) | Done 2026-06-10 |
| T-004 | Claude | src/domain/ (stat-engine/types, game-state/types, ruleset, index) | Done 2026-06-10 |
| T-011 | Claude | src/features/roster/, src/router.tsx, src/App.tsx, src/features/team/TeamDetailScreen.tsx | Done 2026-06-10 |
| T-012 | Claude | src/features/game-setup/, src/router.tsx, src/App.tsx, src/features/team/TeamDetailScreen.tsx | Done 2026-06-10 |
| T-013 | Claude | src/features/game-setup/ (LineupBuilderScreen, useLineup), src/router.tsx, src/App.tsx | Done 2026-06-10 |
| T-014 | Claude | src/features/live-scoring/ (LiveScoringScreen, useGameState), src/router.tsx, src/App.tsx, src/features/game-setup/ | Done 2026-06-10 |
| T-015 | Claude | src/features/live-scoring/ (OutcomeGrid, RunnerPanel, recordPlay, LiveScoringScreen, useGameState) | Done 2026-06-10 |
| T-016 | Claude | src/features/live-scoring/ (EditPlayPanel, LiveScoringScreen) | Done 2026-06-10 |
| T-017 | Claude | src/features/play-log/ (PlayLogScreen), src/router.tsx, src/App.tsx, src/features/live-scoring/LiveScoringScreen.tsx | Done 2026-06-10 |
| T-020 | Claude | src/domain/stat-engine/battingStats.ts, vitest.config.ts, package.json | Done 2026-06-10 |
| T-021 | Claude | src/domain/stat-engine/pitchingStats.ts | Done 2026-06-10 |
| T-023 | Claude | src/domain/stat-engine/StatRebuilderService.ts, src/features/live-scoring/LiveScoringScreen.tsx, src/features/play-log/PlayLogScreen.tsx | Done 2026-06-10 |
| T-024 | Claude | src/features/game-summary/, src/router.tsx, src/App.tsx, src/features/play-log/PlayLogScreen.tsx, src/features/game-setup/SeasonDetailScreen.tsx | Done 2026-06-10 |
| T-025 | Claude | src/domain/stat-engine/StatRebuilderService.ts, src/features/live-scoring/LiveScoringScreen.tsx, src/features/play-log/PlayLogScreen.tsx | Done 2026-06-10 |
| T-030 | Claude | src/features/season-dashboard/, src/router.tsx, src/App.tsx, src/features/game-setup/SeasonDetailScreen.tsx | Done 2026-06-10 |
| T-031 | Claude | src/domain/trends/, src/domain/stat-engine/types.ts, src/domain/stat-engine/battingStats.ts | Done 2026-06-10 |
| T-032 | Claude | src/shared/ui/Sparkline.tsx, src/features/season-dashboard/useSeasonStats.ts, src/features/season-dashboard/SeasonDashboardScreen.tsx | Done 2026-06-10 |
| T-040 | Claude | public/ (PNG icons + splash PNGs), vite.config.ts, index.html, src/main.tsx | Done 2026-06-11 |
| T-022 | Claude | src/domain/stat-engine/fieldingStats.ts, src/domain/index.ts | Done 2026-06-11 |
| T-034 | Claude | src/features/season-dashboard/printSeasonReport.ts, src/features/season-dashboard/SeasonDashboardScreen.tsx | Done 2026-06-11 |
| T-041 | Claude | vite.config.ts (workbox runtimeCaching, cleanupOutdatedCaches, navigateFallbackDenylist) | Done 2026-06-11 |
| T-042 | Claude | tickets/t-042.md, TASKS.md — automated checks pass; manual device testing pending | In Review 2026-06-11 |
| T-043 | Claude | src/data/db.ts, PlayEventRepository, GameRepository, LineupRepository, LiveScoringScreen | Done 2026-06-11 |
| T-044 | Claude | src/features/storage/useStorageHealth.ts, src/features/season-dashboard/SeasonDashboardScreen.tsx | Done 2026-06-11 |
| T-046 | Claude | src/data/schema.ts, src/data/db.ts, src/features/live-scoring/, src/domain/game-state/types.ts, src/domain/stat-engine/, src/features/game-summary/GameSummaryScreen.tsx | Done 2026-06-11 |

## Blockers
- None recorded

## Shared file ownership
| File/module | Current owner | Notes |
|---|---|---|
| `data/repositories/` + Dexie schema | none | One owner at a time; all features depend on this |
| `domain/stat-engine/` | none | Claude-only; high-complexity math |
| `domain/game-state/` | none | Claude-only; serialize with live-scoring ticket |
| `features/live-scoring/` | none | Highest-complexity feature; one owner at a time |
| `shared/ui/` | none | Serialize changes; all feature screens import from here |
| `tailwind.config.*` | none | Serialize design token changes |
| `vite.config.*` / PWA manifest | none | One owner at a time |

---

## Epic board

### E-01 Foundation
**Status: Done**

Goal: Scaffold + design system + storage layer + TypeScript interfaces. No feature UI yet — everything other epics build on.

- [x] T-001 Vite + Preact + TypeScript + Tailwind + PWA scaffold — Status: Done — Priority: P0
- [x] T-002 Field & Form design tokens + shared UI components — Status: Done — Priority: P0
- [x] T-003 Dexie.js schema (all tables) + typed repository layer — Status: Done — Priority: P0
- [x] T-004 TypeScript interfaces: row types, stat interfaces, live game domain types — Status: Done — Priority: P0

---

### E-02 Core Entry Flows
**Status: Done**

Goal: Full game entry loop — team → roster → game setup → live scoring → play log correction. Highest-risk UX phase; validate entry speed on a physical device before building stats.

- [x] T-010 Team and season management screen — Status: Done — Priority: P0
- [x] T-011 Roster management screen (player CRUD, jersey numbers, positions) — Status: Done — Priority: P0
- [x] T-012 Game creation screen (opponent, date, innings, home/away) — Status: Done — Priority: P0
- [x] T-013 Lineup builder screen (batting order, defensive positions) — Status: Done — Priority: P0
- [x] T-014 Live scoring screen — scoreboard HUD + batter selection — Status: Done — Priority: P0
- [x] T-015 Live scoring — outcome button grid + runner advancement + auto-save — Status: Done — Priority: P0
- [x] T-016 Live scoring — undo last play + edit last play — Status: Done — Priority: P0
- [x] T-017 Play log screen (full event list, edit, delete, recompute) — Status: Done — Priority: P0
- [x] T-046 Dual-team scoring: fix half-inning score attribution + opponent scoring modes (quick-score + full lineup) — Status: Done — Priority: P0

---

### E-03 Stats Engine
**Status: Planned — blocked on E-02**

Goal: Correct, rebuildable stat derivation from raw play events. Game summary screen. Season stat cache. Stats must be provably correct before Season Dashboard is built.

- [x] T-020 Batting stat derivation (PA, AB, H, 1B–HR, R, RBI, BB, HBP, SO, SB, CS, AVG, OBP, SLG, OPS) — Status: Done — Priority: P0
- [x] T-021 Pitching stat derivation (IP, BF, H, R, ER, BB, SO, HBP, pitch count, ERA, WHIP) — Status: Done — Priority: P0
- [x] T-022 Fielding stat derivation (PO, A, E, DP, fielding %) — Status: Done — Priority: P1
- [x] T-023 StatRebuilderService: full event-stream recompute on edit/delete — Status: Done — Priority: P0
- [x] T-024 Game summary screen (box score, batting/pitching/fielding lines) — Status: Done — Priority: P0
- [x] T-025 Season aggregate rollup (player-season stat cache build + rebuild) — Status: Done — Priority: P0

---

### E-04 Season Intelligence
**Status: Planned — blocked on E-03**

Goal: Season dashboard, player cards, rolling trends, export. Turns raw game data into the "payoff" the app was built for.

- [x] T-030 Season dashboard screen (player stat cards, season totals, rate stats) — Status: Done — Priority: P0
- [x] T-031 TrendService: rolling last-3, last-5, season-to-date metric windows — Status: Done — Priority: P0
- [x] T-032 Trend chart components (sparklines, rolling AVG/OBP line charts) — Status: Done — Priority: P1
- [x] T-033 CSV export (per-player season stats download) — Status: Done — Priority: P1
- [x] T-034 Printable season report (print-to-PDF HTML layout) — Status: Done — Priority: P2

---

### E-05 Polish & Delivery
**Status: Planned — blocked on E-04**

Goal: PWA install experience, offline robustness, cross-device QA, performance, release packaging.

- [x] T-040 PWA manifest, splash screens, iOS add-to-home-screen optimization — Status: Done — Priority: P0
- [x] T-041 Workbox offline caching strategy (assets, API-less app shell) — Status: Done — Priority: P0
- [ ] T-042 Cross-device smoke test: iPhone Safari, Android Chrome, iPad — Status: In Review — Priority: P0
- [x] T-043 Performance audit: bundle size, Dexie query plans, render profiling — Status: Done — Priority: P1
- [x] T-044 Storage health indicator + export nudge when usage approaches 40MB — Status: Done — Priority: P1
- [ ] T-045 Release packaging: README, version tag, final QA sign-off — Status: Planned — Priority: P0

---

## Notes
- Update this file at the end of every ticket
- Only move a ticket to `Ready` when all dependencies are Done or explicitly accepted as risks
- Keep ticket IDs stable once assigned
- Update shared file ownership when a ticket claims or releases a module domain
- T-015 (live scoring outcome grid) is the highest-risk ticket in the project — test on a real phone before marking Done
- E-02 tickets T-010 and T-011 may be worked in parallel (roster and team screens do not share modules)
- All E-03 stat derivation tickets (T-020–T-022) should share tests that verify totals against a known game fixture
