# Coding Style

## TypeScript / React

### General
- TypeScript strict mode. No `any`. Use `unknown` when type is genuinely unknown.
- Prefer `interface` for object shapes passed as props or returned from hooks.
- Prefer `type` for unions, aliases, and mapped types.
- Use named exports for all components and hooks. No default exports except `App.tsx`.
- No barrel (`index.ts`) files — import directly from the source file.

### Components
- Functional components only. No class components.
- Props interface defined above the component, named `Props` or `<Component>Props`.
- Destructure props at the function signature.
- Keep components focused: one responsibility per file.
- Extract repeated logic to a custom hook in `src/hooks/`.
- Extract business constants and helpers to `src/lib/`.

### State & Effects
- Use `useState` for local UI state.
- Use `useCallback` for stable handler references passed to children (when needed).
- Never derive state from other state with `useEffect` — compute it inline.
- No `useEffect` for data fetching — use `wagmi` hooks / `@tanstack/react-query`.

### BigInt & Money
- All USDC amounts are `bigint` internally.
- Use `parseAmount` / `formatUsdc6` / `Amount` from `@/onchain-money` — never `parseUnits`/`formatUnits` directly on USDC paths.
- Never sum native balance and ERC-20 balance (they are the same pool on Arc).

### Async & Transactions
- Two-step tx pattern: approve → action. Always auto-chain on `approveSuccess`.
- Use `useWriteContract` + `useWaitForTransactionReceipt` for every write.
- Reset write hooks after success or error to allow retry.
- All feedback via `sonner` toasts.

### Imports
- Path aliases: use `@/` for `src/`. Never use relative `../../` beyond one level.
- Group imports: (1) React, (2) third-party, (3) internal `@/` imports.
- No unused imports — lint enforces this.

---

## Solidity

### Layout (per file)
1. SPDX license + pragma
2. Imports (OZ first, then local)
3. Contract NatSpec (`@title`, `@notice`)
4. Constants
5. Types (enums, structs)
6. Errors
7. Events
8. Storage
9. Constructor
10. External (buyer, supplier, anyone — in that order)
11. Views
12. Admin
13. Internal

### Style rules
- Use custom errors (not `require` with strings).
- One `revert` per condition.
- `SafeERC20` for all token transfers.
- `nonReentrant` on all write functions that move tokens.
- No inline assembly.
- Storage variables `private` unless an explicit getter is needed.
- Never expose `Tier[3]` through auto-generated public getters (SCP ABI limitation).
- Pack struct data into `uint256` for cross-boundary encoding when needed.

### NatSpec
- `@notice` on every external/public function.
- `@param` for all non-obvious parameters.
- `@return` for all return values.
- `@dev` for implementation notes.

---

## CSS

- Tailwind utility classes for layout, spacing, and responsive breakpoints.
- CSS custom properties (`var(--token)`) for all colors, radii, and shadows.
- Never hardcode `#hex` or `rgba(...)` in component files — reference a token.
- Custom component classes (`.btn`, `.badge`, `.invoice-row`) defined in `index.css`.
- Inline `style` prop is acceptable for dynamic token references (e.g. `style={{ color: 'var(--accent)' }}`).
- No new CSS files. Extend `index.css` for new utility classes only if a Tailwind class doesn't exist.
