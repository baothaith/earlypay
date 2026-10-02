# Commit Conventions

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

- **Subject**: imperative mood, lowercase, no period. Max 72 characters.
- **Body**: explain *what* and *why*, not *how*. Wrap at 72 characters.
- **Footer**: reference issues (`Closes #12`), breaking changes (`BREAKING CHANGE: ...`).

---

## Types

| Type | When to use |
|---|---|
| `feat` | New feature or behaviour |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | CSS/visual-only changes (no logic change) |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build scripts, tooling, dependency bumps |
| `contract` | Solidity contract changes |
| `db` | Database schema or migration changes |
| `deploy` | Deployment configuration changes |

---

## Scopes (optional but recommended)

| Scope | Area |
|---|---|
| `vault` | DiscountVault.sol |
| `frontend` | React app (broad) |
| `invoice-card` | InvoiceCard component |
| `post-sheet` | PostInvoiceSheet component |
| `sidebar` | Sidebar component |
| `hooks` | Custom hooks |
| `lib` | `src/lib/` utilities |
| `db` | Database scripts |
| `docs` | `docs/` folder |
| `logo` | Logo assets and component |

---

## Examples

```
feat(vault): add tier decay monotonicity enforcement in _validateTiers

contract(vault): remove tuple[3] ABI type; use packed uint256 encoding

fix(invoice-card): use module-level timestamp to satisfy react/purity lint

style(sidebar): increase stat icon contrast in dark mode

docs: add initial project documentation suite

db: add sync_cursors table and seed DiscountVault address

chore: add db:migrate and db:verify npm scripts
```

---

## Rules

- One logical change per commit. Do not batch unrelated changes.
- Never commit `.env`, `node_modules/`, `dist/`, `lib/` (forge-std), or `console.jsonl`.
- Always run `bun run check` (lint + typecheck) before committing frontend changes.
- Always run `forge build` before committing Solidity changes.
- Commit messages are written in English.
