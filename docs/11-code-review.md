# Code Review Process

## Process (TBD — no formal PR process defined yet)

A formal pull request review process has not been established. The following is the recommended baseline.

---

## Recommended PR Checklist

### Author (before opening PR)

- [ ] `bun run check` passes — zero lint errors, zero TypeScript errors.
- [ ] `forge build` passes if any `.sol` file was changed.
- [ ] No `.env`, secrets, or `node_modules` in the diff.
- [ ] Commit messages follow the conventions in `docs/10-commit-conventions.md`.
- [ ] New business logic has a corresponding unit test or integration test (TBD).
- [ ] If a new component was added: follows the naming conventions in `docs/07-naming-conventions.md`.
- [ ] If a Solidity function was changed: all relevant audit findings are addressed.
- [ ] PR description summarises *what* changed and *why* (not *how* — the code shows that).

### Reviewer

- [ ] Business logic is correct — does the code match the feature spec in `docs/03-feature-specs.md`?
- [ ] Security rules in `docs/09-coding-rules.md` are not violated.
- [ ] No hardcoded addresses, amounts, or chain IDs in component files.
- [ ] No new `any` types introduced.
- [ ] Toast feedback is present for all user-facing async actions.
- [ ] Responsive behaviour is not broken (check mobile + desktop breakpoints).
- [ ] Design system tokens are used — no raw hex values in components.
- [ ] Solidity changes: no open-settler bypass, reentrancy guards in place, tier validation enforced.

---

## Smart Contract Changes — Extra Steps

Any change to `DiscountVault.sol` requires:

1. `forge build` — must compile cleanly.
2. `forge test` — must pass (TBD: no tests written yet).
3. A re-run of the Slither static analysis (TBD).
4. If the ABI changes: update `src/lib/discountVault.ts` ABI and all callers.
5. If deployed: update `AGENTS.md` with the new contract address.

---

## Merge Policy

- TBD: squash vs merge commit strategy not yet decided.
- TBD: branch protection rules not yet configured on GitHub.
