# UI/UX Guidelines

## Layout Principles

### Desktop (≥1024px)
- Two-column grid: `272px` sticky sidebar + fluid main feed.
- Container max-width: `1440px`, centered, `px-8` horizontal padding.
- Sidebar is sticky (`top: navbar-h + 24px`), scrollable independently.
- Never constrain the feed to `max-w-3xl` or narrower on desktop — that's the bug we fixed.

### Tablet (768px–1023px)
- Single column. Sidebar hidden. Tab switcher moves inline into the feed header.
- Container: `px-5`.

### Mobile (<768px)
- Single column, `px-4`.
- PostInvoice modal becomes a bottom sheet (`items-end` on the flex overlay).
- Navbar actions collapse: "Post Invoice" shows icon only below `sm`.

### Navbar
- Height: `56px` (`--navbar-h`), sticky, `z-40`.
- Background: `rgba(8,15,28,0.82)` with `backdropFilter: blur(28px)`.
- Left: EarlyPay logo + "Arc Testnet" network badge.
- Right: Refresh (connected only), Post Invoice CTA (connected only), ConnectKit button.

---

## Information Hierarchy

### Invoice Card (collapsed)
Priority order left → right:
1. State icon tile (color-coded: blue=OPEN, green=SETTLED, grey=EXPIRED)
2. Face value (largest text, `display` font) + invoice ID
3. Buyer → Supplier address line (secondary)
4. Active tier badge (hidden on mobile)
5. Expiry countdown (hidden on small screens)
6. Chevron expand toggle

### Invoice Card (expanded)
- Parties + amounts grid (2×2 on mobile, 4-col on sm+)
- Discount tiers list (active tier highlighted in success-green)
- Settlement preview table (OPEN, not expired)
- Settlement receipt (SETTLED)
- Expiry timestamp row
- Action button (full-width, bottom)

### Sidebar
- Post Invoice CTA (top, always prominent)
- Role switcher (Buyer / Supplier tabs)
- Stats panel (wallet balance, vault TVL, total invoices, per-role counts)
- How it works (collapsible reference)

---

## Interaction Patterns

### Two-step transactions
Always show a step progress indicator for multi-tx flows:
- Toast: "Step 1/2: approve USDC…"
- Toast: "Step 2/2: posting invoice…"
- Inline banner in the modal during loading.
- Button text changes to match the in-flight step.

### Loading states
- Invoice list skeleton: 4 animated pulse blocks, staggered `animationDelay`.
- Button: `Loader2` spinning icon + descriptive text while `isPending || isConfirming`.
- Stats: show `—` until data arrives (never 0, never undefined).

### Empty states
- Centered card with a muted icon, a short heading, and a one-line explanation.
- Buyer empty state includes a "Post Invoice" CTA button.

### Error handling
- All transaction errors route to `sonner` toast.
- Wrong chain → banner (not toast) so it persists until resolved.
- Never swallow errors silently.

### Toasts
- Use `sonner`. Do not build custom toast components.
- `toast.info` for in-progress steps.
- `toast.success` for completed transactions.
- `toast.error` for failures and validation errors.

---

## Accessibility

- All interactive elements have `cursor: pointer` implied via `.btn`.
- Disabled buttons use `opacity: 0.38` and `cursor: not-allowed`.
- Focus states: `border-color: --border-accent` + `box-shadow: 0 0 0 3px rgba(172,198,233,0.10)`.
- Color is never the sole differentiator — state icons and labels accompany color coding.
- ARIA: TBD (not yet implemented systematically).

---

## Do / Don't

| Do | Don't |
|---|---|
| Use CSS custom properties for all colors | Hardcode hex values in component files |
| Use `.btn`, `.badge`, `.invoice-row` classes | Reinvent button/badge styles inline |
| Show live chain data; never mock balances | Display placeholder numbers |
| Use `sonner` toasts for feedback | `alert()` or custom toast implementations |
| Keep App.tsx as a thin composition root | Put feature logic directly in App.tsx |
| Use `@/onchain-money` for all USDC math | Use raw `parseUnits` / `formatUnits` or hand-rolled decimals |
| Use `@/onchain-facts` for addresses and chain IDs | Hardcode contract/USDC addresses in components |
