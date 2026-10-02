# Detailed Feature Specifications

## Spec 1 — Post Invoice

### Inputs
| Field | Type | Validation |
|---|---|---|
| `supplier` | `address` | Must be `0x…` 42-char hex, non-zero |
| `faceValue` | USDC decimal string | > 0, ≤ 1,000,000 USDC (contract: `MAX_FACE_VALUE = 1e12`) |
| `tiers[0..2].windowEnd` | `datetime-local` string | Strictly increasing; must be in the future |
| `tiers[0..2].discountBps` | integer 1–5000 | Non-increasing across tiers; contract: `MAX_DISCOUNT_BPS = 5000` |
| `expiresAt` | `datetime-local` string | Must be > `block.timestamp` at tx time |

### Computed on frontend
- `rebatePool = faceValue × tiers[0].discountBps / 10000` (bigint arithmetic via `@/onchain-money`)
- Displayed as "Collateral to lock: $X.XX"

### Tier encoding (frontend → contract)
```
tierPack0 = (t0.windowEnd << 192) | (t0.discountBps << 176)
          | (t1.windowEnd <<  64) | (t1.discountBps <<  48)
tierPack1 = (t2.windowEnd << 192) | (t2.discountBps << 176)
```
Unused tier slots: `windowEnd = 0, discountBps = 0`.
See `packTiers()` in `src/lib/discountVault.ts`.

### Transaction flow
1. `ERC20.approve(DISCOUNT_VAULT_ADDRESS, rebatePool)` — buyer approves collateral.
2. On approval confirmed: `postInvoice(faceValue, supplier, tierPack0, tierPack1, expiresAt)`.
3. Contract emits `InvoicePosted(invoiceId, buyer, supplier, faceValue, rebatePool, expiresAt)`.

### Error states
- Wrong chain → toast error, no tx.
- Invalid supplier / face value / tiers → toast error, no tx.
- User rejects wallet → `approveError` flag → toast "Transaction cancelled".

---

## Spec 2 — Settle Invoice

### Pre-conditions
- `invoice.state === 'OPEN'`
- `block.timestamp <= invoice.expiresAt`
- `msg.sender === invoice.supplier`

### Active tier resolution (contract)
Iterates tiers 0→2, returns first where `discountBps > 0 && block.timestamp <= windowEnd`.
If none match, `activeTierBps = 0` (full face value owed, zero rebate).

### Payment routing
```
rebateAmount = min(faceValue × activeTierBps / 10000, rebatePool)
supplierPays = faceValue − rebateAmount

supplier → buyer:   safeTransferFrom(supplier, buyer, supplierPays)
vault    → supplier: safeTransfer(supplier, rebateAmount)
vault    → buyer:   safeTransfer(buyer, rebatePool − rebateAmount)  // excess collateral
```

### Transaction flow
1. `ERC20.approve(DISCOUNT_VAULT_ADDRESS, supplierPays)`
2. On approval confirmed: `settleInvoice(invoiceId)`
3. Contract emits `InvoiceSettled(invoiceId, buyer, supplier, settler, supplierPays, rebateAmount, activeTierBps)`

---

## Spec 3 — Expire Invoice

### Pre-conditions
- `invoice.state === 'OPEN'`
- `block.timestamp > invoice.expiresAt`
- Caller: any address

### Effect
- `safeTransfer(buyer, rebatePool)` — full collateral returned.
- State → `EXPIRED`.
- Emits `InvoiceExpired(invoiceId, buyer, rebatePool)`.

---

## Spec 4 — Invoice List (frontend)

### Data fetch strategy
Uses wagmi `useReadContracts` to batch all reads in a single RPC call:
- Per invoice: `getInvoiceFields`, `getInvoiceTierWindows`, `getInvoiceTierDiscounts`, `getCurrentTier`
- Total: 4 calls × N invoices, batched.

### Polling
Manual refresh only (no auto-poll). User triggers via Refresh button or after a successful tx.

### Display order
Reverse insertion order (newest invoice ID first).
