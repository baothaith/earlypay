# EarlyPay

> Built with Arc Studio - money-powered apps in minutes

EarlyPay is an onchain Dynamic Early Payment Discount vault. Buyers post invoices with time-decaying USDC rebate tiers; suppliers settle early to claim the rebate; expired invoices auto-refund collateral to the buyer. Money-state machine: OPEN → SETTLED | EXPIRED.

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

## Deployed Contracts

| Contract | Network | Address | Explorer |
|---|---|---|---|
| DiscountVault | Arc Testnet | `0xf8a283ada5c99831b904d058291895d0e38c546b` | [View](https://explorer.testnet.arc.io/address/0xf8a283ada5c99831b904d058291895d0e38c546b) |

### DiscountVault Constructor Args
- `_usdc`: `0x3600000000000000000000000000000000000000` (Arc Testnet USDC)
- `_owner`: `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (SCP deployer wallet)

### Key Contract Functions
- `postInvoice(faceValue, supplier, tierPack0, tierPack1, expiresAt)` — buyer posts invoice, locks rebate collateral
- `settleInvoice(invoiceId)` — supplier settles, receives rebate
- `expireInvoice(invoiceId)` — permissionless, refunds buyer after expiry
- `getInvoiceFields(invoiceId)` — scalar invoice data
- `getInvoiceTierWindows(invoiceId)` / `getInvoiceTierDiscounts(invoiceId)` — tier data
- `getCurrentTier(invoiceId)` — live active tier
- `getInvoicesByBuyer(address)` / `getInvoicesBySupplier(address)` — lists

### Tier Pack Encoding (for `postInvoice`)
`tierPack0`: `(windowEnd0 << 192) | (discountBps0 << 176) | (windowEnd1 << 64) | (discountBps1 << 48)`
`tierPack1`: `(windowEnd2 << 192) | (discountBps2 << 176)`
Use 0 for unused tiers.

---

## What This App Does

[Brief description of what the app does and its primary use case]

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
