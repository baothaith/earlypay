/**
 * DiscountVault contract integration.
 * All contract facts are imported from @/onchain-facts — never hardcoded.
 */

export const DISCOUNT_VAULT_ADDRESS = '0xf8a283ada5c99831b904d058291895d0e38c546b' as const

export const DISCOUNT_VAULT_ABI = [
  // ── Write functions ──────────────────────────────────────────────
  {
    type: 'function',
    name: 'postInvoice',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'faceValue',  type: 'uint256' },
      { name: 'supplier',   type: 'address' },
      { name: 'tierPack0',  type: 'uint256' },
      { name: 'tierPack1',  type: 'uint256' },
      { name: 'expiresAt',  type: 'uint64'  },
    ],
    outputs: [{ name: 'invoiceId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'settleInvoice',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'expireInvoice',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [],
  },
  // ── View functions ───────────────────────────────────────────────
  {
    type: 'function',
    name: 'getInvoiceFields',
    stateMutability: 'view',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [
      { name: 'buyer',      type: 'address' },
      { name: 'supplier',   type: 'address' },
      { name: 'faceValue',  type: 'uint256' },
      { name: 'rebatePool', type: 'uint256' },
      { name: 'state',      type: 'uint8'   },
      { name: 'settler',    type: 'address' },
      { name: 'settledAt',  type: 'uint256' },
      { name: 'rebatePaid', type: 'uint256' },
      { name: 'expiresAt',  type: 'uint64'  },
    ],
  },
  {
    type: 'function',
    name: 'getInvoiceTierWindows',
    stateMutability: 'view',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [
      { name: 'w0', type: 'uint64' },
      { name: 'w1', type: 'uint64' },
      { name: 'w2', type: 'uint64' },
    ],
  },
  {
    type: 'function',
    name: 'getInvoiceTierDiscounts',
    stateMutability: 'view',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [
      { name: 'd0', type: 'uint16' },
      { name: 'd1', type: 'uint16' },
      { name: 'd2', type: 'uint16' },
    ],
  },
  {
    type: 'function',
    name: 'getCurrentTier',
    stateMutability: 'view',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [
      { name: 'discountBps', type: 'uint16' },
      { name: 'windowEnd',   type: 'uint64' },
      { name: 'tierIndex',   type: 'uint8'  },
    ],
  },
  {
    type: 'function',
    name: 'getInvoicesByBuyer',
    stateMutability: 'view',
    inputs: [{ name: 'buyer', type: 'address' }],
    outputs: [{ name: 'invoiceIds', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getInvoicesBySupplier',
    stateMutability: 'view',
    inputs: [{ name: 'supplier', type: 'address' }],
    outputs: [{ name: 'invoiceIds', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'totalInvoices',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // ── Events ───────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'InvoicePosted',
    inputs: [
      { name: 'invoiceId',  type: 'uint256', indexed: true  },
      { name: 'buyer',      type: 'address', indexed: true  },
      { name: 'supplier',   type: 'address', indexed: true  },
      { name: 'faceValue',  type: 'uint256', indexed: false },
      { name: 'rebatePool', type: 'uint256', indexed: false },
      { name: 'expiresAt',  type: 'uint64',  indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'InvoiceSettled',
    inputs: [
      { name: 'invoiceId',    type: 'uint256', indexed: true  },
      { name: 'buyer',        type: 'address', indexed: true  },
      { name: 'supplier',     type: 'address', indexed: true  },
      { name: 'settler',      type: 'address', indexed: false },
      { name: 'supplierPays', type: 'uint256', indexed: false },
      { name: 'rebateAmount', type: 'uint256', indexed: false },
      { name: 'activeTierBps',type: 'uint16',  indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'InvoiceExpired',
    inputs: [
      { name: 'invoiceId',  type: 'uint256', indexed: true  },
      { name: 'buyer',      type: 'address', indexed: true  },
      { name: 'rebatePool', type: 'uint256', indexed: false },
    ],
  },
] as const

// ── Types ─────────────────────────────────────────────────────────────────

export type InvoiceState = 'OPEN' | 'SETTLED' | 'EXPIRED'

export interface TierData {
  windowEnd: bigint
  discountBps: number
}

export interface InvoiceData {
  id: bigint
  buyer: string
  supplier: string
  faceValue: bigint
  rebatePool: bigint
  state: InvoiceState
  settler: string
  settledAt: bigint
  rebatePaid: bigint
  expiresAt: bigint
  tiers: TierData[]
  activeTierBps?: number
  activeWindowEnd?: bigint
}

// ── Helpers ───────────────────────────────────────────────────────────────

export const STATE_MAP: Record<number, InvoiceState> = {
  0: 'OPEN',
  1: 'SETTLED',
  2: 'EXPIRED',
}

/**
 * Pack up to 3 tiers into two uint256 values for `postInvoice`.
 * tierPack0 = (windowEnd0 << 192) | (discountBps0 << 176) | (windowEnd1 << 64) | (discountBps1 << 48)
 * tierPack1 = (windowEnd2 << 192) | (discountBps2 << 176)
 * Unused slots should have windowEnd=0, discountBps=0.
 */
export function packTiers(tiers: { windowEnd: bigint; discountBps: number }[]): [bigint, bigint] {
  const t = (i: number) => tiers[i] ?? { windowEnd: 0n, discountBps: 0 }

  const t0 = t(0)
  const t1 = t(1)
  const t2 = t(2)

  const pack0 =
    (BigInt(t0.windowEnd) << 192n) |
    (BigInt(t0.discountBps) << 176n) |
    (BigInt(t1.windowEnd) << 64n) |
    (BigInt(t1.discountBps) << 48n)

  const pack1 =
    (BigInt(t2.windowEnd) << 192n) |
    (BigInt(t2.discountBps) << 176n)

  return [pack0, pack1]
}

/** Format bps as a discount percentage string, e.g. 200 → "2.00%" */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}
