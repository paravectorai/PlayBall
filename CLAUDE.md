# CLAUDE.md

## Purpose
This repository uses a planning-first workflow. Always read the planning files before making changes.

## Required read order
1. `ONBOARDING.md`
2. `PLAN.md`
3. `TASKS.md`
4. Relevant files in `tickets/`
5. `DECISIONS.md` if present
6. `REVIEW_CHECKLIST.md`
7. `CONTRIBUTING.md`

## Working rules
- Do not start implementation until a ticket is marked `Ready`.
- Do not work from chat memory alone; use repository files as source of truth.
- Before coding, restate the ticket scope, files likely touched, dependencies, and test plan.
- Keep changes bounded to the approved ticket.
- If the ticket is underspecified, pause and propose clarifications.
- If implementation reveals a larger architectural issue, update `PLAN.md` and propose a new ticket instead of silently expanding scope.
- After completing work, update `TASKS.md` and the ticket status.
- Record important tradeoffs in `DECISIONS.md`.
- Respect WIP limits defined in `TASKS.md` before starting a new ticket.

## Definition of Ready
A ticket may be moved to `Ready` only when:
- Scope is unambiguous and all acceptance criteria are written
- All dependencies are identified and cleared, or explicitly noted as accepted risks
- No open blocking questions remain
- Ticket sizing check is complete and the ticket does not require splitting

## Output expectations
For every implementation task, provide:
1. Summary of what changed
2. Files changed
3. Tests added or updated
4. Commands run
5. Risks, follow-ups, and anything left incomplete

## Definition of done
A ticket is done only when:
- Acceptance criteria are satisfied
- Relevant tests pass
- No obvious lint or type issues remain
- Status is updated in `TASKS.md`
- The ticket file is updated with completion notes

## Ticket statuses
- Planned
- Ready
- In Progress
- Blocked
- In Review
- Done

## Planning behavior
When asked to plan, produce:
- Epics
- Dependency-aware tasks with sizing checks
- One ticket file per task
- Suggested execution order
- Delegation recommendations for Claude, Codex, or another model

## Delegation guidance
Use these buckets when planning:
- `Claude-only`: architecture, security-sensitive logic, schema design, cross-cutting refactors
- `Delegable`: isolated features, tests, CRUD flows, docs, UI polish
- `Any-model`: boilerplate, small refactors, lint cleanup, simple typed adapters

## Preferred implementation flow
1. Read planning files
2. Confirm WIP limit allows a new ticket
3. Select one `Ready` ticket
4. Restate scope and plan
5. Implement only that ticket
6. Run validation
7. Update task log and ticket
8. Suggest next `Ready` ticket
