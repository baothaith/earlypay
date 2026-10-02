# Quality Standards

## Frontend

| Standard | Requirement | Tool |
|---|---|---|
| Lint | 0 errors | oxlint (`bun run lint`) |
| TypeScript | 0 errors | `tsc --noEmit` (`bun run typecheck`) |
| Both together | `bun run check` | `scripts/check.sh` |
| Build | Must succeed without errors | `bunx vite build` |
| Bundle size warning threshold | 500 kB (Vite default) | Note: current main bundle exceeds this due to wagmi/viem/connectkit — acceptable for v1 |

### Running checks

```bash
# Lint + typecheck in one command
bun run check

# Lint only (with auto-fix)
bun run lint

# Typecheck only
bun run typecheck

# Production build
bunx vite build
```

---

## Smart Contract

| Standard | Requirement | Tool |
|---|---|---|
| Compilation | 0 errors | `forge build` |
| Unit tests | TBD (no tests written yet) | `forge test` |
| Static analysis | TBD (Slither not yet configured) | Slither |
| Audit findings | All critical/high findings must be resolved before deploy | Manual |

### Running contract checks

```bash
# Build contracts
bun run contracts:build   # alias: forge build

# Run tests
bun run contracts:test    # alias: forge test
```

---

## Database

| Standard | Requirement | Tool |
|---|---|---|
| Schema consistency | All tables present in `earlypay` schema | `bun run db:verify` |
| Migration idempotency | Re-running `db:migrate` must not fail or corrupt data | Manual test |

### Running database checks

```bash
# Apply migration (idempotent)
bun run db:migrate

# Verify schema
bun run db:verify
```

---

## Definition of Done

A feature is considered done when:

1. Code is committed to `main` with a conventional commit message.
2. `bun run check` passes cleanly.
3. If contract changed: `forge build` passes.
4. If new UI: visually verified on desktop (1440px) and mobile (375px).
5. If new transaction flow: manually tested on Arc Testnet with a real wallet.
6. Feature spec in `docs/03-feature-specs.md` is updated if the behaviour changed.
7. `AGENTS.md` is updated if a new contract was deployed.

---

## Known Technical Debt

| Item | Impact | Priority |
|---|---|---|
| No Foundry unit tests for DiscountVault | Contract bugs won't be caught automatically | High |
| Slither static analysis not configured | May miss new issues on contract changes | Medium |
| No onchain event indexer (Postgres sync) | Database tables exist but are empty | Medium |
| Bundle size > 500 kB | Slower initial load | Low (acceptable for B2B) |
| No CI/CD pipeline | Manual deploy required | Low |
| No branch protection on GitHub | Direct pushes to `main` possible | Low |
| ARIA/accessibility not systematically implemented | Screen reader experience untested | Medium |
