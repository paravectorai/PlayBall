# REVIEW_CHECKLIST.md

Reviewers should focus on correctness, tests, maintainability, and operational impact, while automation handles routine checks.

## Author checklist before requesting review
- Ticket scope is respected; no unplanned files were changed
- All acceptance criteria are satisfied
- Tests were run and results are recorded in the ticket
- Config or secret changes are documented
- Observability impact was considered for new endpoints or background jobs
- Branch name and commit messages follow CONTRIBUTING.md

## Reviewer checklist
- Business logic appears correct and matches the ticket scope
- Test coverage is appropriate for the change
- Logging and error handling are sufficient for the changed behavior
- New log statements do not contain passwords, tokens, or PII
- Input validation is present at all external boundaries
- New outbound HTTP calls do not allow user-controlled URLs to reach internal services
- Diff is scoped and maintainable; no unrelated changes are present
- If the ticket changes auth or data access: impact is explicitly understood

## Merge policy
Do not merge when any of the following are unresolved:
- Open review comments on security or auth behavior
- Missing test coverage for the primary changed behavior

If merge is blocked by a security concern, open a follow-up ticket, record the issue in `DECISIONS.md`, and obtain explicit human approval before proceeding.
