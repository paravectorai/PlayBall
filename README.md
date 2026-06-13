# BaseballTracker (Stitch)

A mobile-first Progressive Web App for parents to keep youth baseball stats during live games, with season rollups, player trend analytics, and end-of-season reporting.

## What this is
Parents keeping stats at youth baseball games need a fast, forgiving, offline-capable app. This project is a PWA built with Preact + TypeScript + Vite, using an event-sourced data model (play events as source of truth, stats as derived projections) and the "Field & Form" design system (Stadium Green + Clay Orange palette, Inter typography, high-contrast outdoor-legible UI).

## Planning documents

### Core planning
- [CLAUDE.md](CLAUDE.md) — workflow and behavior rules for Claude Code
- [AGENTS.md](AGENTS.md) — shared handoff and execution rules for coding agents
- [PLAN.md](PLAN.md) — project overview, architecture, design system, NFRs, phases, V2 ideas
- [TASKS.md](TASKS.md) — master task log with WIP rules, shared file ownership, and epic board
- [ONBOARDING.md](ONBOARDING.md) — mid-project pickup checklist and required startup summary

### Decision and risk tracking
- [DECISIONS.md](DECISIONS.md) — ADR log: event-sourced model, PWA, Dexie.js, UUID IDs, feature modules, hybrid schema
- [RISK_REGISTER.md](RISK_REGISTER.md) — iOS storage eviction, live entry speed, stat correctness, schema migration
- [CHANGELOG.md](CHANGELOG.md) — milestone and pivot log

### Process and standards
- [CONTRIBUTING.md](CONTRIBUTING.md) — branch naming, commit conventions, merge strategy
- [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md) — author and reviewer checklists

### Ticket management
- [tickets/README.md](tickets/README.md) — ticket folder conventions and sizing guidance
- [tickets/TEMPLATE.md](tickets/TEMPLATE.md) — ticket template for individual tasks
- [tickets/T-001-scaffold.md](tickets/T-001-scaffold.md) — E-01 Foundation: project scaffold

## MVP feature set
- Team + roster management (players, jersey numbers, positions)
- Game setup and lineup builder (batting order, opponent, date)
- Live scoring: plate appearance entry in ≤ 4 taps, runner advancement, auto-save, undo
- Play log: edit / delete / recompute any recorded play
- Game summary: box score and per-player stat lines
- Season dashboard: player cards, season totals, rate stats (AVG, OBP, SLG, OPS, ERA, WHIP)
- Trend charts: last-3, last-5, season-to-date rolling averages
- Export: CSV download + printable season summary

## Tech stack
- **Frontend:** Preact + TypeScript + Vite
- **Styling:** Tailwind CSS (Field & Form design tokens)
- **Storage:** IndexedDB via Dexie.js (PWA); SQLite via Tauri for packaged path
- **PWA:** Vite PWA plugin (Workbox)

## Getting started for a new session

```text
Read CLAUDE.md, AGENTS.md, ONBOARDING.md, PLAN.md, and TASKS.md.
Do not write code yet.
Produce a startup summary: current phase, active tickets, blockers, next Ready ticket.
Then wait for approval before selecting work.
```

## Epic overview
| Epic | Goal | Status |
|---|---|---|
| E-01 Foundation | Scaffold + design system + Dexie schema + TypeScript interfaces | Ready to start |
| E-02 Core Entry Flows | Team → roster → game setup → live scoring → play log | Planned |
| E-03 Stats Engine | Batting/pitching/fielding derivation + game summary | Planned |
| E-04 Season Intelligence | Season dashboard + trends + export | Planned |
| E-05 Polish & Delivery | PWA install + cross-device QA + release | Planned |
