# DECISIONS.md

This file records important architectural and design decisions so they remain durable across agent handoffs and future sessions.

## When to add an entry
Add a new ADR-style entry when a decision materially affects:
- System architecture or component boundaries
- Data model, schema, or persistence strategy
- Auth or access control approach
- External service or dependency selection
- Testing or deployment strategy

Do not use this file for implementation details or ticket-level notes. Those belong in the ticket's completion notes.

## How to use
- Append new entries; do not overwrite existing ones.
- Mark prior entries as `Superseded` and link to the replacement if a decision is reversed.
- Link related tickets where possible.

---

## ADR-001: Event-sourced data model — play events as source of truth
- **Date:** 2026-06-09
- **Status:** Accepted
- **Related tickets:** T-003, T-020, T-021, T-023

### Context
The app must support post-game correction, stat editing, season rollups, and future trend analytics. The question was whether to store aggregate stats directly (simpler initial model) or store atomic play events and derive stats from them.

### Options considered
1. **Aggregate-only** — Store final game stats per player; no event log. Fast reads, simple schema. Edit means directly patching stat totals.
2. **Event-sourced** — Store every plate appearance and play as an immutable record. All stats are computed projections. Edits delete or correct events, then recompute.
3. **Hybrid without rebuild** — Store events and a separate manually-editable aggregate, not strictly derived.

### Decision made
Option 2: Event-sourced. Every plate appearance is a `play_event` record. `player_game_stats` and `player_season_stats` are cached projections rebuilt by `StatRebuilderService` whenever events are added, edited, or deleted.

**Reasoning:** Editability is a first-class requirement — parents make scoring mistakes during live play. Editing aggregate stats directly is fragile and loses auditability. An event log also enables future features (trend analytics, replay, AI insights) without schema redesign. The recompute cost is acceptable given the small data volume of youth league stats.

### Consequences
- Positive: Corrections are clean — edit the event, recompute the projection
- Positive: Any new derived stat can be added retroactively across all historical games
- Positive: Full audit trail of what was recorded and when
- Tradeoff: `StatRebuilderService` must be correct; a bug there affects all downstream stats
- Tradeoff: Slightly more complex initial schema than aggregate-only

### Follow-up actions
- Build StatRebuilderService with a comprehensive fixture-based test suite (T-023)
- Validate derivation against a known manually-scored game before shipping stats

---

## ADR-002: PWA-first; Tauri as the packaged path
- **Date:** 2026-06-09
- **Status:** Accepted
- **Related tickets:** T-001, T-040

### Context
The app could be distributed as a native app (React Native, Expo, Swift/Kotlin), a PWA, or a packaged desktop app (Electron, Tauri). The target is phones and iPads used by non-technical parents.

### Options considered
1. **React Native / Expo** — True native app; App Store / Play Store distribution
2. **PWA** — Web app installable via "Add to Home Screen"; no store required
3. **Tauri** — Rust-based packager that wraps a web app as a native binary with bundled SQLite

### Decision made
Option 2 for MVP (PWA), with Option 3 (Tauri) as the growth path if native packaging is needed.

**Reasoning:** A PWA avoids App Store submission, review delays, and the developer account requirement. It works on iOS 16+ and Android 10+ via Safari/Chrome "Add to Home Screen." The full-screen mode and offline capability meet the MVP requirements. Tauri becomes the right path if SQLite is needed for durability beyond IndexedDB or if the app needs to be distributed through enterprise MDM.

### Consequences
- Positive: Immediate distribution via URL; no install friction
- Positive: No App Store account or review process required
- Tradeoff: iOS PWA storage may be evicted by Safari under memory pressure (see R-001 in RISK_REGISTER)
- Tradeoff: iOS PWA has known quirks (no push notifications prior to iOS 17, limited badge support)

### Follow-up actions
- Test `storage.persist()` call on iOS Safari before E-05 release gate
- Document Tauri migration path if IndexedDB storage proves insufficient

---

## ADR-003: IndexedDB via Dexie.js for MVP storage; SQLite reserved for packaged builds
- **Date:** 2026-06-09
- **Status:** Accepted
- **Related tickets:** T-003, T-041

### Context
The app needs reliable local storage. Options include: localStorage (too small), IndexedDB (browser-native), SQLite via sql.js (in-memory, no persistence without OPFS), SQLite via Tauri (native, excellent, requires packaging), or a remote database (requires backend).

### Options considered
1. **Raw IndexedDB** — Full control, verbose API, no abstractions
2. **Dexie.js** — TypeScript-friendly ORM over IndexedDB with version migration support
3. **sql.js (OPFS)** — SQLite compiled to WASM, stored in Origin Private File System
4. **Tauri + rusqlite** — Native SQLite with full disk access; requires packaging

### Decision made
Option 2 (Dexie.js) for the browser PWA MVP. Dexie provides TypeScript-typed schema definitions, a clean migration API (`db.version(N).stores()`), live query support for reactive UI, and excellent browser compatibility. The schema is designed to match the SQLite schema so migration to Option 4 (Tauri + SQLite) is mechanical when that path is needed.

### Consequences
- Positive: Browser-only PWA; no packaging required
- Positive: Schema version migrations are safe and explicit
- Positive: Same logical schema can be ported to SQLite with minimal effort
- Tradeoff: IndexedDB can be evicted by the OS; alert user to use `storage.persist()` and export regularly
- Tradeoff: Complex joins require in-memory filtering rather than SQL; mitigate by keeping queries shallow and caching projections

### Follow-up actions
- Keep `data/repositories/` interface-based so the Tauri SQLite implementation can swap in without touching feature code (T-003)
- Document the schema version migration process in CONTRIBUTING.md

---

## ADR-004: UUID text IDs for all records
- **Date:** 2026-06-09
- **Status:** Accepted
- **Related tickets:** T-003, T-004

### Context
Records need stable IDs. Integer auto-increment IDs are simpler but break when records are created offline on multiple devices and later synced.

### Options considered
1. **Integer auto-increment** — Simple, fast, but conflicts on merge from multiple clients
2. **UUID v4 text** — Random, collision-resistant, works for offline creation and future sync
3. **ULID** — Sortable UUID-like IDs; useful for time-ordered queries

### Decision made
Option 2: UUID v4 text IDs for all records.

**Reasoning:** The MVP is single-device, but the V2 multi-parent sync roadmap item requires offline-safe IDs from day one. Changing ID types after data is in the wild is extremely painful. UUID v4 adds negligible overhead for this data volume.

### Consequences
- Positive: No merge conflicts when sync is added in V2
- Positive: No coordination between clients for ID assignment
- Tradeoff: Slightly larger storage than integers; irrelevant at youth-league data volumes

---

## ADR-005: Feature module structure organized by domain, not by file type
- **Date:** 2026-06-09
- **Status:** Accepted
- **Related tickets:** T-001

### Context
Frontend projects commonly organize files either by type (`components/`, `hooks/`, `services/`) or by feature domain (`features/live-scoring/`, `features/roster/`).

### Options considered
1. **By file type** — All components together, all hooks together, etc.
2. **By feature domain** — Each feature folder contains its own components, hooks, and local services

### Decision made
Option 2: Feature domain modules.

**Reasoning:** Baseball has clear domain boundaries (roster, live scoring, stats, trends). Co-locating components, hooks, and local logic per feature keeps changes bounded and makes agent handoffs cleaner — an agent working on live scoring cannot accidentally modify roster code if they're in different folders. Shared infrastructure lives in `shared/ui/`, `data/repositories/`, and `domain/`.

### Consequences
- Positive: Changes are naturally scoped to the assigned ticket's feature folder
- Positive: Easier to identify what each agent session should touch
- Tradeoff: Some boilerplate duplication between features; mitigated by `shared/ui` for common components

---

## ADR-006: Hybrid relational + JSON schema; JSON for flexibility, relational for integrity
- **Date:** 2026-06-09
- **Status:** Accepted
- **Related tickets:** T-003, T-004

### Context
Youth baseball rules vary significantly by league (pitch counts, re-entry rules, courtesy runners, batting-order enforcement). The schema must handle this variation without becoming a giant normalization project before the app ships.

### Options considered
1. **Fully normalized** — Every rule variant has its own table or column
2. **Fully JSON** — All game data in document form; no relational constraints
3. **Hybrid** — Core game/play/player data is normalized and constrained; rule sets and supplemental result data use JSON fields

### Decision made
Option 3: Hybrid.

**Reasoning:** `play_events`, `players`, `games`, and `game_lineups` are normalized and constrained — this is where correctness matters. `ruleset_json` on the `seasons` table holds league-specific rule configuration. `result_json` on `play_events` holds supplemental play detail. `stats_json` on the stat cache tables holds derived stat bundles. This gives integrity where it's needed and flexibility where rules vary.

### Consequences
- Positive: Core data integrity is enforced; stats can't be created for non-existent players
- Positive: League rule variants don't require schema migrations
- Tradeoff: JSON fields are opaque to the storage layer; TypeScript must parse and validate them at runtime
- Tradeoff: Querying inside JSON fields is not supported by Dexie; stat calculations must load records into memory

---

## ADR-007: Fielding stat derivation is a zero-returning stub in MVP — no per-play fielder attribution in schema
- **Date:** 2026-06-11
- **Status:** Accepted
- **Related tickets:** T-022

### Context
`FieldingStats` (PO, A, E, DP, fielding %) is defined in the type system and `deriveFieldingStats`
is implemented and exported. However, `PlayEventRow` records the OUTCOME of a fielding play
(`field_out`, `field_error`, `fielders_choice`) but does NOT record which specific fielder was
involved. There is no `fielderPlayerId` or equivalent field on the event row.

### Options considered
1. **Derive from position + play outcome** — Infer the responsible fielder from their listed
   position in the lineup and the batter's spray tendency. This requires heuristics, is not
   reliable without spray-chart data, and adds complexity that is out of MVP scope.
2. **Zero stub with interface intact** — `deriveFieldingStats` returns zeros. The type, function
   signature, and export are all present and correct; the implementation is a safe placeholder.
3. **Skip the function entirely** — Omit `deriveFieldingStats` until the schema can support it.

### Decision made
Option 2: zero stub. The function exists, is typed, is tested, and returns zeros. `StatRebuilderService`
does not call it in MVP (writing rows of all-zeros adds no user value). A future ticket that adds
per-play fielder attribution to `PlayEventRow` updates only `fieldingStats.ts` and
`StatRebuilderService` — no interface changes required.

**Reasoning:** This mirrors how T-021 handled `pitchCount` (always 0, schema has no per-pitch
field). The interface is stable; the implementation is honest about what the data supports.

### Consequences
- Positive: `FieldingStats` type and `deriveFieldingStats` are complete and importable now
- Positive: Future per-fielder attribution work is a single-file change
- Tradeoff: Fielding lines are not shown in the game summary for MVP
- Tradeoff: `StatRebuilderService` must be updated when fielding attribution is added to the schema

### Follow-up actions
- Add a `fielderIds?: { putout?: string; assist?: string; error?: string }` field to `PlayEventRow`
  in a future schema version (Dexie migration required)
- Update `deriveFieldingStats` to filter on those IDs
- Update `StatRebuilderService.rebuildGameStats` to call `deriveFieldingStats` per lineup player
- Add a fielding section to the game summary screen (T-024 follow-up)
