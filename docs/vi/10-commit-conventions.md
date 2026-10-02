# Quy Ước Commit

## Format

Dự án tuân theo [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <mô tả ngắn gọn>

[body tùy chọn]

[footer tùy chọn]
```

---

## Types

| Type | Mục đích | Ví dụ |
|---|---|---|
| `feat` | Tính năng mới | `feat(invoice): add tier decay validation` |
| `fix` | Sửa lỗi | `fix(settle): prevent double-spend on expire` |
| `refactor` | Tái cấu trúc không thêm tính năng | `refactor(sidebar): extract stats into component` |
| `style` | Thay đổi CSS/UI thuần túy | `style(theme): add light mode token set` |
| `docs` | Chỉ thay đổi tài liệu | `docs: add Vietnamese translations` |
| `chore` | Build, deps, config | `chore(deps): override undici to 6.21.1` |
| `test` | Thêm/sửa tests | `test(contract): add tier monotonicity test` |
| `perf` | Cải thiện hiệu năng | `perf: memoize invoice list sort` |
| `ci` | CI/CD config | `ci: add forge build step` |
| `security` | Sửa lỗ hổng bảo mật | `security: lock arbitrary settler to supplier` |

---

## Scopes

| Scope | Mô tả |
|---|---|
| `contract` | DiscountVault.sol |
| `invoice` | Luồng postInvoice/settle/expire |
| `ui` | Thay đổi UI chung |
| `sidebar` | Component Sidebar |
| `card` | Component InvoiceCard |
| `modal` | PostInvoiceSheet |
| `footer` | Component Footer |
| `docs` | DocsViewer + nội dung docs |
| `theme` | Light/Dark mode |
| `db` | Schema, migration, DB ops |
| `deps` | Dependencies |
| `config` | Vite, TypeScript, Foundry config |
| `logo` | Logo system |
| `auth` | Wallet connection |

---

## Ví Dụ Thực Tế Từ Dự Án

```
feat(contract): implement DiscountVault with three-tier decay

- postInvoice locks USDC collateral from buyer
- settleInvoice enforces supplier == msg.sender
- expireInvoice is permissionless after deadline
- Custom errors replace revert strings for gas savings

security(contract): fix three audit findings

(1) Rename InvoiceExpired error to InvoiceAlreadyExpired (name collision)
(2) Enforce monotonic bps decay in _validateTiers
(3) Remove open-settler bypass — supplier must always match msg.sender

feat(theme): production-ready light/dark mode system

- CSS-only theming via [data-theme="light"] attribute
- No flash on reload (FOAT-blocking inline script)
- useTheme hook with localStorage persistence
- All component hardcoded colours tokenised

chore(deps): security audit — override 5 vulnerable packages

undici: 6.19.7 → 6.29.0
@grpc/grpc-js: 1.9.x → 1.14.5
toml: 3.x → 5.x
decode-uri-component: 0.2.2 → 0.5.0
uuid: 8/9.x → 11.1.1
Result: 25 → 2 vulnerabilities (2 unresolvable)

docs: add Vietnamese translations for all 13 doc files
```

---

## Quy Tắc

1. **Dòng subject ≤ 72 ký tự**
2. **Dùng imperative mood** — "add", không phải "added" hay "adds"
3. **Không viết hoa ký tự đầu** — `feat(x): add...`, không phải `feat(x): Add...`
4. **Không có dấu chấm ở cuối**
5. **Body giải thích WHY, không phải WHAT** — WHAT đã rõ từ code
6. **Breaking changes**: thêm `!` sau type: `feat(contract)!: rename postInvoice params`

---

## Branch Naming

```
main                    # branch production
feat/invoice-indexer    # tính năng mới
fix/expire-timestamp    # bug fix
chore/upgrade-wagmi     # maintenance
docs/add-api-reference  # tài liệu
security/audit-fixes    # sửa bảo mật
```

---

## Quy Trình PR

1. Tạo branch từ `main`
2. Commit với conventional format
3. Mở PR với tiêu đề là commit subject
4. PR description phải có: What changed, Why, How to test
5. Chờ review (xem tài liệu 11 — Code Review)
6. Squash merge hoặc rebase merge — không merge commit nếu có thể

---

## Tags / Releases (TBD)

```
v1.0.0    # Contract deployment + full frontend
v1.1.0    # Onchain indexer
v1.2.0    # Multi-chain support
```

Semantic versioning: `MAJOR.MINOR.PATCH`
- MAJOR: breaking change trong contract ABI hoặc DB schema
- MINOR: tính năng mới backward-compatible
- PATCH: bug fixes
