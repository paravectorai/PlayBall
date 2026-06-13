# PLAN.md

## Project overview
- **Project name:** BaseballTracker (codename: Stitch)
- **Goal:** A mobile-first Progressive Web App that lets parents keep accurate, auto-saving youth baseball stats during live games, with season rollups, player trend analytics, and end-of-season reporting.
- **Primary users:** Parents and volunteer scorekeepers at youth baseball games (Little League, travel ball, recreational leagues)
- **Success criteria:**
  - A parent can set up a team roster and start recording a live game within 5 minutes of first launch
  - Any plate appearance can be recorded in 4 taps or fewer on a phone during live play
  - Stats are auto-saved immediately after each play — no manual save step required
  - Season totals and trends are visible without any manual aggregation
  - App functions fully offline; no play data is ever lost due to network issues
  - An end-of-season player summary can be generated and exported

## Current priority model
This project uses a rolling priority model. E-01 (Foundation) establishes the scaffold. E-02 (Core Entry Flows) unblocks E-03 (Stats Engine). E-03 unblocks E-04 (Season Intelligence). E-04 unblocks E-05 (Polish & Delivery). Keep `TASKS.md` current with active work, blockers, and shared file ownership.

## Scope
### In scope (MVP)
- PWA scaffold: Preact + TypeScript + Vite, installable on iOS Safari and Android Chrome
- Design system: "Field & Form" (Stadium Green / Clay Orange / Inter)
- Team and roster management (team, season, players, jersey numbers, positions)
- Game setup and lineup entry (batting order, defensive positions, opponent, date)
- Live scoring screen: fast plate-appearance entry, runner advancement, auto-save, undo last play
- Play log screen: edit, delete, and recompute any recorded play
- Game summary: box score, batting/pitching/fielding lines, scoring recap
- Season dashboard: player cards with season totals and rate stats
- Trend charts: last-3, last-5, and season-to-date rolling averages for batting and pitching
- Export: CSV download per player and printable season summary
- Local-first storage: IndexedDB via Dexie.js for browser MVP; SQLite path for packaged build

### Out of scope for MVP (planned for V2)
- Multi-user real-time sync (all parents see the same live game simultaneously)
- Pitch-by-pitch entry and pitcher analytics dashboard
- Spray charts and visual hit location data
- Mid-game lineup substitution tracking (courtesy runners, DH, free substitution)
- Role-based permissions (head coach vs. parent scorekeeper)
- Parent-facing live view (shareable read-only game stream)
- AI-generated post-game coaching insights
- League mode (multiple teams, head-to-head, standings)
- Push notifications for player milestones
- Video clip tagging to play events
- Cloud backup and multi-device handoff

## Constraints
- App must work fully offline — no network required during live game entry
- Mobile-first: primary viewport is 375px–430px phone; secondary is iPad 768px+
- Auto-save must complete in < 300ms so it never interrupts live play entry
- No login or account required for MVP — all data lives on-device
- All record IDs are UUID text strings (not integer PKs) for future sync compatibility
- No PII beyond first name, last name, and jersey number
- Touch targets must be ≥ 44px for all interactive elements (outdoor use requires forgiving tap areas)

## Non-functional requirements

| Area | Target | Notes |
|---|---|---|
| Offline reliability | 100% local operation | IndexedDB/Dexie.js; no required network calls |
| Entry speed | Plate appearance in ≤ 4 taps | Critical for live game use; no confirmation dialogs on common plays |
| Auto-save latency | < 300ms per play event | Must feel instant on mid-range phones |
| App load time | < 2s on LTE, < 4s on 3G | PWA with aggressive Workbox caching |
| Installability | Add-to-home-screen on iOS 16+ and Android 10+ | Service worker + web app manifest required |
| Storage footprint | < 50MB per season | Youth league stats are inherently low-volume data |
| Accessibility | Touch targets ≥ 44px; WCAG AA contrast ratios | High-ambient outdoor light demands high contrast |

## Architecture summary

### Stack
- **Frontend:** Preact + TypeScript + Vite — smaller bundle than React, same hooks-based DX
- **Styling:** Tailwind CSS configured with the "Field & Form" design token set
- **Storage (MVP):** IndexedDB via Dexie.js (typed, promise-based schema with version migrations)
- **Storage (packaged path):** SQLite via sql.js or Tauri + rusqlite for native desktop/mobile install
- **PWA:** Vite PWA plugin (Workbox) for service worker, offline manifest, and asset caching
- **State:** Zustand for global game state; Dexie live queries for reactive data binding

### Feature modules
```
features/team           — team and season management
features/roster         — player CRUD, jersey numbers, active/inactive
features/game-setup     — game creation, opponent, date, innings, lineup builder
features/live-scoring   — scoreboard HUD, batter tap flow, runner advancement, auto-save, undo
features/play-log       — event history, edit/delete, stat recompute trigger
features/stats          — game stats, season rollups, stat engine interface
features/trends         — rolling metric calculation, trend chart components
features/export         — CSV download and printable season summary
data/repositories       — typed data access layer over IndexedDB (Dexie.js)
domain/baseball-rules   — play outcome validation, runner advancement logic, out tracking
domain/stat-engine      — deterministic batting/pitching/fielding derivation from events
domain/game-state       — live inning / outs / bases / batter-rotation state machine
shared/ui               — Field & Form design system components
```

### Key design principles
- **Event-sourced core:** Every plate appearance is stored as an immutable `play_event` record. Stats are derived projections — never hand-edited aggregates. This enables corrections, deletions, and future analytics without redesigning the schema.
- **Hybrid relational + JSON:** Core game/player/event data is normalized; `stats_json` and `ruleset_json` stay flexible to handle youth-league rule variations (pitch counts, free substitution, courtesy runners) without premature over-normalization.
- **Progressive disclosure:** The live scorer shows one batter's outcome options full-screen. Advanced stats are one tap deeper. Cognitive load during a live game must be minimal.

### Primary screens
1. **Team Home** — Season overview, recent game results, player trend tiles, "Start Game" CTA
2. **Roster & Lineup** — Player list, jersey numbers, batting order, defensive positions
3. **Live Game Scorer** — Inning/outs/bases HUD, batter outcome button grid, runner controls, undo toast
4. **Play Log** — Scrollable play history with edit, delete, and recompute per entry
5. **Game Summary** — Box score, batting/pitching/fielding lines, scoring recap by inning
6. **Season Dashboard** — Player stat cards, season totals, rate stats, rolling trend charts

### Key domain services
- `GameStateService` — tracks live inning, outs, bases occupied, current batter rotation
- `PlayRecorderService` — validates and writes a play event + associated runner movements
- `StatRebuilderService` — recomputes game and season stats deterministically from the event stream
- `TrendService` — calculates rolling last-3, last-5, and season-to-date metric windows per player
- `ExportService` — CSV download and print-ready HTML season summary

## Design system: Field & Form

The UI is engineered for outdoor stadium use — high-ambient light, one-handed operation on a phone, and glanceability under time pressure.

| Token | Value | Usage |
|---|---|---|
| Primary — Stadium Green | `#1B4332` | Headers, primary buttons, branding |
| Tertiary — Clay Orange | `#D9480F` | Live indicators, record highlights, critical alerts |
| Background | `#F7F9FF` | App background for maximum contrast |
| Surface | `#FFFFFF` | Data cards |
| Text | `#181C20` | Primary text |
| Border | `#E9ECEF` | Card borders (1px solid; no shadows) |

- **Typography:** Inter exclusively; tabular figures (`tnum`) for stat columns; bold uppercase for stat category labels (AVG, ERA, OBP)
- **Shapes:** 4px card radius; 8px button radius; pill-shaped status badges
- **Elevation:** 1px border instead of shadows — legible outdoors
- **Mobile grid:** 4-column, 16px side margins, 16px gutters
- **Touch targets:** ≥ 44px for all interactive elements

## Observability and monitoring

This is a local-only client-side app for MVP; no server infrastructure to monitor. Quality gates:

- Unit tests: stat derivation math, game state transitions, runner advancement logic
- Integration tests: `RecordPlay → StatRebuilder → verify game stat cache` pipeline
- Manual device testing: iPhone (iOS Safari), Android Chrome, iPad before each release
- Storage health: warn user if IndexedDB storage usage exceeds 40MB or if `persist()` was denied
- Error boundary: catch render errors per feature module; display graceful fallback with retry

## Parallel work and ownership map

| Area | Shared files/modules | Notes |
|---|---|---|
| Schema / data layer | `data/repositories/`, Dexie schema version | One owner at a time; all features depend on this |
| Domain logic | `domain/stat-engine/`, `domain/game-state/` | Claude-only; serialize changes |
| Live scoring | `features/live-scoring/` | One owner at a time; core user flow |
| Design system | `shared/ui/` | Serialize changes; all feature screens import from here |
| Export | `features/export/` | Low-dependency; can be worked in parallel with trends |

## Phases

### Phase 1: Foundation (E-01)
- Vite + Preact + TypeScript + Tailwind + PWA config scaffold
- Field & Form design tokens + shared UI components (Button, Card, Badge, Input)
- Dexie.js schema (all tables) + typed repository layer
- TypeScript interfaces: all row types, stat interfaces, domain types, live game state

### Phase 2: Core Entry Flows (E-02)
- Team and roster screens
- Game creation and lineup builder
- Live scoring screen: scoreboard HUD, batter outcome buttons, auto-save
- Runner advancement controls + undo last play
- Play log: edit, delete, recompute

### Phase 3: Stats Engine (E-03)
- Batting stat derivation from play events (PA, AB, H, 1B, 2B, 3B, HR, R, RBI, BB, HBP, SO, SB, CS, AVG, OBP, SLG, OPS)
- Pitching stat derivation (IP, BF, H, R, ER, BB, SO, HBP, pitch count, ERA, WHIP)
- Fielding stat derivation (PO, A, E, DP, fielding %)
- Game summary screen (box score, per-player lines)
- Season aggregate rollup (player-season stat cache rebuild)

### Phase 4: Season Intelligence (E-04)
- Season dashboard with player stat cards
- Trend service: rolling last-3, last-5, season-to-date windows
- Trend chart components (sparklines, rolling AVG line)
- CSV export (player season stats)
- Printable season report

### Phase 5: Polish & Delivery (E-05)
- PWA manifest, splash screens, iOS install quirk handling
- Offline caching strategy (Workbox strategies per asset type)
- Cross-device smoke testing (iPhone, Android, iPad)
- Performance audit (IndexedDB query plan, bundle size, render profiling)
- Storage health indicator + export/backup reminder prompt
- Release preparation (README, version tag, final QA sign-off)

## Epic list

### E-01 Foundation
**Goal:** Scaffold + design system + storage layer + TypeScript interfaces. Nothing the user sees yet; everything the other epics build on.

### E-02 Core Entry Flows
**Goal:** Full game entry loop — team → roster → game setup → live scoring → play log correction. This is the highest-risk UX area; validate entry speed on a real device before proceeding to stats.

### E-03 Stats Engine
**Goal:** Correct, rebuildable stat derivation. Batting, pitching, fielding derived from events. Game summary screen. Season stat cache. Stats must be provably correct before season dashboard is built.

### E-04 Season Intelligence
**Goal:** Season dashboard, player cards, rolling trends, export. Turns raw game data into the "why I built this app" payoff: per-player season summaries and trend lines.

### E-05 Polish & Delivery
**Goal:** PWA installation experience, offline robustness, cross-device QA, final performance pass, release packaging.

## Dependency notes
- E-02 requires E-01 (repository layer must exist before any screen writes data)
- E-03 requires E-02 (stat engine needs real play events to validate derivation correctness)
- E-04 requires E-03 (season rollups depend on game-level stat correctness being proven)
- E-05 requires E-04 (can't do final PWA + cross-device testing until feature set is complete)
- T-012 (live scoring screen) is the highest-complexity ticket in E-02; validate on device before building stats

## Risks
- **Offline data durability:** IndexedDB can be evicted by the OS under storage pressure — mitigate with storage persistence API request at install and user reminder to export if storage is nearing limit
- **Youth rule variations:** Pitch count limits, courtesy runners, free substitution, and re-entry rules differ by league — mitigate with `ruleset_json` flexibility field and documented rule configuration options
- **Live entry speed regression:** If confirmation dialogs or small touch targets creep in, parents miss plays during games — mitigate with mandatory 44px targets, no-confirm auto-save, and physical device testing on every sprint
- **Schema migration breaking local data:** IndexedDB schema version bumps must use Dexie migration blocks — never drop data; always migrate forward
- **iOS PWA storage limits:** iOS Safari caps at ~50MB and can silently clear storage — mitigate with storage.persist() request, visual storage indicator, and export nudge

## Open questions / out-of-the-box V2 ideas

These were surfaced during product research and design. None are in MVP scope, but they are high-value and architecturally compatible with the event-sourced data model:

| Idea | Description | Feasibility |
|---|---|---|
| Multi-parent real-time sync | One parent scores, all parents see it live via Firestore or PocketBase | High — event log maps naturally to a sync stream |
| Live parent view | Shareable read-only game URL showing live box score | High — static export of game state on each play |
| AI post-game insights | Claude API generates coaching observations from trend data | High — trend snapshots are already structured for this |
| Pitch-by-pitch mode | Full pitcher analytics: pitch count, type, result, location | Medium — needs PitchEvent table (stubbed in schema) |
| Spray charts | Visual hit location entry + per-player hit distribution overlay | Medium — add `hit_location_x/y` fields to play_events |
| Lineup optimizer | Suggest batting order based on OBP and recent form | Medium — derive from existing season stats |
| League mode | Multiple teams, head-to-head records, league standings | Medium — multi-team data model already supported |
| Video clip tagging | Link a highlight clip URL to a specific plate appearance | Low complexity — add `media_url` nullable to play_events |
| Milestone push notifications | Alert when player hits first HR, 10th RBI, etc. | Low — requires PWA push permission + milestone trigger logic |
