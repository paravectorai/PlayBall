# tickets/

This folder contains one markdown file per task. Each ticket represents a discrete, implementable unit of work that can be completed in a single focused agent session.

## File naming
Use the format: `T-XXX-short-description.md`

Examples:
- `T-001-repo-bootstrap.md`
- `T-020-user-workflow-a.md`
- `T-031-auth-hardening.md`

## Ticket sizing guidance
A well-sized ticket:
- Can be completed in one focused agent session
- Touches no more than 5-7 files
- Has unambiguous, verifiable acceptance criteria
- Does not require in-flight architectural decisions — those go in `DECISIONS.md` first

If a ticket grows beyond these limits during implementation, stop, create a follow-up ticket for the remaining scope, and update `TASKS.md`.

## How to create a new ticket
1. Copy `TEMPLATE.md` and rename it to the next available T-XXX ID.
2. Fill in all sections. Do not leave placeholder text in Scope or Acceptance criteria.
3. Set status to `Planned`.
4. Add the ticket to `TASKS.md` under the correct epic.
5. Move to `Ready` only when all Definition of Ready criteria in `CLAUDE.md` are satisfied.

## Example tickets
The following example tickets show the expected level of detail at each phase of a build. Use them as references, not as starting templates (use `TEMPLATE.md` for that).

| File | Phase | What it demonstrates |
|------|-------|---------------------|
| `T-001-example.md` | E-01 Foundation | Repository bootstrap — Any-model delegation, P0 setup ticket |
| `T-002-additional-example-tickets.md` | E-02 Examples | How to plan a documentation/content ticket |
| `T-010-github-actions-ci-template.md` | E-03 Scaffold | CI/CD workflow template — Any-model, clear REPLACE_ME pattern |
| `T-012-database-migration-bootstrap.md` | E-03 Scaffold | Migration safety — Claude-only delegation, security-sensitive |
| `T-031-security-guidance-audit.md` | E-05 Release | Security audit — Claude-only, review-style ticket |

Full ticket index is maintained in `../TASKS.md`.
