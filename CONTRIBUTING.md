# CONTRIBUTING.md

## Branch naming
Use ticket-based branch names:
- `feature/T-010-core-data-model`
- `feature/T-020-user-workflow-a`
- `fix/T-031-auth-token-expiry`

## Commit messages
Use conventional commits with ticket IDs:
- `feat(T-020): add primary user workflow`
- `fix(T-031): correct token expiry handling`
- `chore(T-003): configure lint rules`

## Merge strategy
- Prefer squash merge for ticket-based work
- One pull request per ticket whenever possible
- Do not merge unresolved review comments on security or auth changes

## Unresolved security review comments
If a review comment on auth, input validation, or sensitive data handling cannot be resolved within the current PR:
1. Do not merge the PR.
2. Open a follow-up ticket capturing the unresolved issue.
3. Record the decision and tradeoff in `DECISIONS.md`.
4. Obtain explicit human approval before merging if the risk is accepted.
