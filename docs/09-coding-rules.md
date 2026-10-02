# Coding Rules

These are hard rules. Violations should be caught in code review and fixed before merge.

## Security

### Smart Contract
1. **No arbitrary settler** — only `invoice.supplier` may call `settleInvoice`. Never add an open-settler bypass.
2. **No human approver** — the contract must never require an admin signature to release funds.
3. **ReentrancyGuard on all token-moving functions** — `settleInvoice` and `expireInvoice` are `nonReentrant`.
4. **Tier decay enforcement** — tiers must have non-increasing `discountBps`. Enforced in `_validateTiers`.
5. **Monotonic windowEnd** — tiers must have strictly increasing `windowEnd`. Enforced in `_validateTiers`.
6. **Rebate pool capped at faceValue** — `rebatePool > faceValue` reverts with `InvalidRebatePool`.
7. **MAX_FACE_VALUE** — inputs > 1,000,000 USDC revert. Prevents overflow-adjacent issues.
8. **MAX_INVOICES_PER_BUYER = 256** — prevents unbounded array growth DoS.

### Frontend
9. **Never commit `.env`** — `.gitignore` must cover `.env` and `.env.*`.
10. **Never hardcode contract addresses in components** — always import from `@/lib/discountVault.ts` or `@/onchain-facts`.
11. **Chain validation before every tx** — check `chainId !== ARC_TESTNET_CHAIN_ID` and toast an error if wrong.
12. **No fake balances** — never display hardcoded or cached amounts as "live" data.

---

## Correctness

13. **BigInt-only for all USDC amounts** — no `Number()` conversions on amounts that could exceed `Number.MAX_SAFE_INTEGER`.
14. **6 decimals for USDC on Arc** — `1 USDC = 1_000_000` raw units. Enforced via `@/onchain-money`.
15. **Two-step tx order** — always approve before the write call. Never invert.
16. **Auto-chain on approval** — `if (approveSuccess && !postHash && !postPending)` pattern. Do not poll.

---

## Architecture

17. **App.tsx is a composition root only** — no business logic, no direct contract calls in App.tsx.
18. **One component per file** — never co-locate two exported components in the same file.
19. **Hooks for contract reads** — never call `viem` client directly from a component; use wagmi hooks.
20. **No barrel files** — import directly from the source file.

---

## Quality

21. **Zero lint errors before merge** — run `bun run check`. Warnings are acceptable; errors are not.
22. **Zero TypeScript errors** — `tsc --noEmit` must pass cleanly.
23. **No `eslint-disable` comments** — fix the root cause instead. Only exception: a third-party type incompatibility that cannot be fixed.
24. **No `@ts-ignore` or `@ts-expect-error`** without a comment explaining why.
25. **No `console.log` in committed code** — use `sonner` toasts for user-facing output.

---

## Database

26. **All migrations are idempotent** — use `IF NOT EXISTS` and `CREATE OR REPLACE`. Safe to re-run.
27. **All writes go through `earlypay` schema** — never write to `public` schema.
28. **Never store private keys or secrets in the database**.
