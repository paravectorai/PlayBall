# RISK_REGISTER.md

This file tracks material project risks so they can be monitored and mitigated across the build lifecycle.

## When to add a risk
Add an entry when a ticket, decision, dependency, or open question introduces uncertainty that could:
- Block a milestone or release
- Cause data loss or significant user impact
- Require significant rework or timeline change

## Status values
- Open — identified, not yet mitigated
- Monitoring — mitigation in place, being watched
- Mitigated — controls implemented and verified
- Accepted — risk accepted with documented rationale
- Closed — no longer relevant

## Scoring guidance
- Likelihood: Low / Medium / High
- Impact: Low / Medium / High

## Risk entries

| Risk ID | Description | Likelihood | Impact | Owner | Mitigation | Status |
|---------|-------------|------------|--------|-------|------------|--------|
| R-001 | iOS Safari can evict IndexedDB storage under memory pressure, destroying season data mid-season | Medium | High | E-01 | Request `storage.persist()` at app install; show storage usage indicator; prompt user to export before storage nears limit | Open |
| R-002 | Live scoring screen too slow for real game use — parents miss plays because the tap flow requires too many steps or confirmation dialogs | Medium | High | E-02 | Enforce 44px touch targets; no confirmation dialogs on common plays; require physical device test on iPhone before T-015 is marked Done | Open |
| R-003 | Stat derivation bug produces incorrect totals (e.g., RBI miscounted when runners are manually adjusted) | Medium | High | E-03 | Build StatRebuilderService with a fixture-based test suite against a known manually-scored game; require stat correctness sign-off before E-04 begins | Open |
| R-004 | Youth-league rule variations (courtesy runners, re-entry, pitch-count limits, EH/DH) cause incorrect game state or stats | Medium | Medium | E-02/E-03 | Store league ruleset in `ruleset_json`; document supported rule variants; explicitly test common Little League and travel ball configurations | Open |
| R-005 | Dexie schema migration breaks existing local data during an app update | Low | High | E-01 | Use Dexie version migration blocks for every schema change; never drop data; write a migration test that runs against a seeded v1 database before each version bump | Open |
| R-006 | IndexedDB storage quota exceeded mid-season on a device with low available storage | Low | High | E-05 | Monitor storage usage via `navigator.storage.estimate()`; warn at 40MB; block new game creation above 48MB with an export prompt | Open |
| R-007 | Play log recompute is too slow on a full season's worth of events (200+ games, 3000+ events) | Low | Medium | E-03 | Benchmark StatRebuilderService against a 500-event dataset during T-023; add incremental recompute path if needed | Open |
| R-008 | PWA "Add to Home Screen" prompt does not appear on iOS (Apple defers the prompt; user must navigate to Share → Add to Home Screen) | High | Medium | E-05 | Show an in-app install instruction banner on first load for iOS users; document the iOS install flow in onboarding | Open |
| R-009 | TypeScript interfaces diverge from Dexie schema over time (schema updated, interfaces not) | Medium | Medium | Ongoing | Keep row interfaces in the same file as the Dexie schema definition (T-003); add a schema sync check to the PR checklist in CONTRIBUTING.md | Open |
| R-010 | End-of-season export produces incorrect or incomplete report due to partial season data | Low | Medium | E-04 | ExportService must read from the stat cache (not re-derive inline); validate export output against the season dashboard totals before shipping T-033 | Open |
