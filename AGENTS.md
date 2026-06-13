# AGENTS.md

## Purpose
Shared instructions for any coding agent working in this repository.

## Source of truth
Use repository planning files, not chat history, as the source of truth.

Read in this order before starting any work:
1. `ONBOARDING.md`
2. `PLAN.md`
3. `TASKS.md`
4. Relevant ticket in `tickets/`
5. `DECISIONS.md` if present
6. `REVIEW_CHECKLIST.md`
7. `CONTRIBUTING.md`

## WIP limits
- Maximum 3 tickets may be `In Progress` at the same time unless a human explicitly approves an exception.
- Only 1 `In Progress` ticket may actively modify the same file or module domain at a time.
- Do not start a new ticket if it conflicts with the ownership map in `TASKS.md` or `PLAN.md`.
- Prefer finishing blocked review work before starting additional implementation.

## Parallel work rule
Before starting a ticket, check the shared-file ownership map in `TASKS.md` and `PLAN.md`. If overlap exists on config, schema, auth, or deployment files, serialize work or escalate for human coordination.

## Rules for all agents
- Work only on the assigned ticket.
- Do not expand scope without approval.
- If more files must be touched than listed, explain why first.
- Keep implementation aligned with the project architecture in `PLAN.md`.
- Run the validation steps listed in the ticket when possible.
- Update the ticket notes and proposed status when done.

## Required response format for ticket work
Return:
1. Ticket ID
2. Summary of changes
3. Files changed
4. Tests run
5. Acceptance criteria status
6. Risks or open questions
7. Recommended next status (`In Review` or `Done`)

## Delegation categories
- `Claude-only`: architecture, security, schema changes, complex debugging
- `Delegable`: well-bounded backend or frontend tasks, tests, docs
- `Any-model`: boilerplate, formatting, small refactors

## Guardrails
- No hidden scope changes
- No silent dependency changes
- No deleting unrelated code
- No modifying planning documents except the assigned ticket and `TASKS.md` status notes unless explicitly requested

## Anti-patterns
Never do the following:
- Start implementation without a `Ready` ticket
- Use chat memory or prior session context as a source of truth for architecture decisions
- Merge or resolve security review comments without human approval
- Expand a ticket's file list without explaining why
- Change shared config, schema, or auth files while another ticket owns them

## Handoff rule
If a task is blocked, stop and report:
- what is blocked
- what evidence was found
- what decision is needed
- what the smallest next step should be
