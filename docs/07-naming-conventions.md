# Naming Conventions

## TypeScript / React

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase, named export | `export function InvoiceCard(` |
| Hooks | camelCase, `use` prefix | `useInvoiceList`, `useReadContract` |
| Utility functions | camelCase | `formatUsdc6`, `packTiers`, `shortAddr` |
| Constants (module-level) | SCREAMING_SNAKE_CASE | `ARC_TESTNET_CHAIN_ID`, `DISCOUNT_VAULT_ADDRESS` |
| Types / Interfaces | PascalCase | `InvoiceData`, `TierData`, `InvoiceState` |
| Type aliases for unions | PascalCase | `type Tab = 'buyer' \| 'supplier'` |
| Props interfaces | PascalCase, `Props` suffix optional | `interface Props { ... }` |
| State variables | camelCase, descriptive | `sheetOpen`, `faceValueStr`, `tab` |
| Event handlers | `handle` prefix | `handleRefresh`, `handleSubmit`, `handleClose` |
| CSS class names | kebab-case (Tailwind) + BEM-ish for custom | `invoice-row`, `btn-primary`, `label-caps` |
| File names | PascalCase for components | `InvoiceCard.tsx`, `PostInvoiceSheet.tsx` |
| File names (hooks, lib) | camelCase | `useInvoiceList.ts`, `discountVault.ts`, `constants.ts` |

## Solidity

| Thing | Convention | Example |
|---|---|---|
| Contracts | PascalCase | `DiscountVault` |
| State variables | camelCase | `nextInvoiceId`, `buyerInvoices` |
| Mappings | camelCase, plural | `invoices`, `buyerInvoices` |
| Structs | PascalCase | `Invoice`, `Tier` |
| Enums | PascalCase, values all-caps | `enum State { OPEN, SETTLED, EXPIRED }` |
| Functions (external) | camelCase | `postInvoice`, `settleInvoice`, `expireInvoice` |
| Functions (internal) | `_` prefix, camelCase | `_validateTiers` |
| Errors | PascalCase | `InvalidFaceValue`, `UnauthorizedSettler` |
| Events | PascalCase | `InvoicePosted`, `InvoiceSettled` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FACE_VALUE`, `BPS_DENOMINATOR` |
| Immutables | lowercase | `usdc` |
| Parameters | camelCase, brief | `faceValue`, `supplier`, `tierPack0` |

## Database

| Thing | Convention | Example |
|---|---|---|
| Schema | lowercase, project-name | `earlypay` |
| Tables | snake_case, plural | `invoices`, `invoice_tiers`, `sync_cursors` |
| Columns | snake_case | `face_value`, `rebate_pool`, `expires_at` |
| Indexes | `idx_<table>_<column(s)>` | `idx_invoices_buyer`, `idx_events_invoice_id` |
| Triggers | `trg_<table>_<action>` | `trg_invoices_updated_at` |
| Constraints (unique) | `<table>_<col1>_<col2>_key` | `transaction_events_tx_hash_log_index_key` |

## File & Folder Structure

```
src/
  App.tsx                  # Thin composition root
  main.tsx                 # Entry point (do not modify)
  config.ts                # wagmi config (do not modify unless adding chains)
  index.css                # Design tokens + utility classes
  onchain-facts.ts         # Generated — do not edit
  onchain-money.ts         # Generated — do not edit
  onchain-wait.ts          # Generated — do not edit
  components/
    InvoiceCard.tsx
    PostInvoiceSheet.tsx
    Sidebar.tsx
    Logo.tsx
    DocsViewer.tsx          # In-app documentation viewer
  hooks/
    useInvoiceList.ts
  lib/
    constants.ts            # Chain ID, USDC ref, formatting helpers
    discountVault.ts        # ABI, address, types, pack/format helpers
contracts/
  DiscountVault.sol
  contract-metadata/
    DiscountVault.json      # Deployment metadata
docs/                       # Project documentation (this folder)
scripts/
  migrate.sql               # PostgreSQL schema DDL
  migrate.ts                # Migration runner
  verify-schema.ts          # Schema verification
public/
  favicon.svg
  logo-*.svg
```
