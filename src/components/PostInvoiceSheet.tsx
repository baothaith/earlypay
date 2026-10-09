/**
 * Post Invoice modal — centered dialog on desktop, bottom sheet on mobile.
 * Two-step flow: approve USDC collateral → postInvoice.
 * UX improvements:
 *   - Discount input accepts % (not bps) with live bps display as secondary
 *   - Realtime financial summary panel (collateral, per-tier savings)
 *   - Supplier empty-state guidance
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { erc20Abi } from 'viem'
import { X, Plus, Loader2, ExternalLink, Trash2, Info, ChevronRight } from 'lucide-react'
import { DISCOUNT_VAULT_ABI, DISCOUNT_VAULT_ADDRESS, packTiers } from '@/lib/discountVault'
import { ARC_TESTNET_CHAIN_ID, ARC_USDC, formatUsdc6 } from '@/lib/constants'
import { parseAmount } from '@/onchain-money'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

interface TierInput {
  windowEnd: string
  /** Stored as percent string e.g. "2.00" */
  discountPct: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const springs = {
  overlay: { type: 'tween' as const, duration: 0.18, ease: 'easeOut' },
  modal:   { type: 'spring' as const, stiffness: 420, damping: 40, mass: 0.75 },
}

const PRESET_EXPIRIES = [
  { label: '7d',  days: 7  },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '60d', days: 60 },
]

function daysFromNow(days: number): string {
  const d = new Date(Date.now() + days * 86400_000)
  return d.toISOString().slice(0, 16)
}

function toUnixTimestamp(localStr: string): bigint {
  return BigInt(Math.floor(new Date(localStr).getTime() / 1000))
}

/** Convert % string → bps integer */
function pctToBps(pct: string): number {
  const n = parseFloat(pct)
  if (isNaN(n) || n <= 0) return 0
  return Math.round(n * 100)
}

export function PostInvoiceSheet({ open, onClose, onSuccess }: Props) {
  const { chainId } = useAccount()
  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  const [supplier, setSupplier]       = useState('')
  const [faceValueStr, setFaceValueStr] = useState('')
  const [expiresAt, setExpiresAt]     = useState(daysFromNow(30))
  const [tiers, setTiers]             = useState<TierInput[]>([
    { windowEnd: daysFromNow(7),  discountPct: '2.00' },
    { windowEnd: daysFromNow(14), discountPct: '1.00' },
  ])

  // ── Derived financial values ─────────────────────────────────────────────
  const { faceValueRaw, rebatePool, tierSummaries } = useMemo(() => {
    let fv = 0n
    try { fv = parseAmount(ARC_TESTNET_CHAIN_ID, faceValueStr).raw } catch { /* */ }

    const summaries = tiers.map((t) => {
      const bps     = pctToBps(t.discountPct)
      const savings = fv > 0n ? (fv * BigInt(bps)) / 10000n : 0n
      return { bps, savings, windowEnd: t.windowEnd }
    })

    const tier0Bps  = summaries[0]?.bps ?? 0
    const pool      = fv > 0n ? (fv * BigInt(tier0Bps)) / 10000n : 0n

    return { faceValueRaw: fv, rebatePool: pool, tierSummaries: summaries }
  }, [faceValueStr, tiers])

  // ── Approve ──────────────────────────────────────────────────────────────
  const { writeContract: approve, data: approveHash, isPending: approvePending, reset: resetApprove, isError: approveError } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  // ── Post Invoice ─────────────────────────────────────────────────────────
  const { writeContract: post, data: postHash, isPending: postPending, reset: resetPost, isError: postError } = useWriteContract()
  const { isLoading: postConfirming, isSuccess: postSuccess } = useWaitForTransactionReceipt({ hash: postHash })

  // Auto-post once approve confirms
  if (approveSuccess && !postHash && !postPending) {
    try {
      const fv = parseAmount(ARC_TESTNET_CHAIN_ID, faceValueStr)
      const activeTiers = tiers
        .filter((t) => t.windowEnd && pctToBps(t.discountPct) > 0)
        .map((t) => ({ windowEnd: toUnixTimestamp(t.windowEnd), discountBps: pctToBps(t.discountPct) }))
      const [pack0, pack1] = packTiers(activeTiers)
      const expiry = toUnixTimestamp(expiresAt)
      post({
        address: DISCOUNT_VAULT_ADDRESS,
        abi: DISCOUNT_VAULT_ABI,
        functionName: 'postInvoice',
        args: [fv.raw, supplier as `0x${string}`, pack0, pack1, expiry],
        chainId: ARC_TESTNET_CHAIN_ID,
      })
      toast.info('Step 2/2: posting invoice…')
      resetApprove()
    } catch {
      toast.error('Failed to post invoice')
      resetApprove()
    }
  }

  if (postSuccess) {
    toast.success('Invoice posted successfully!')
    onSuccess?.()
    handleClose()
  }

  if (approveError || postError) {
    toast.error('Transaction cancelled or failed')
    resetApprove()
    resetPost()
  }

  function handleSubmit() {
    if (wrongChain) { toast.error('Switch to Arc Testnet first'); return }
    if (!supplier.startsWith('0x') || supplier.length !== 42) { toast.error('Enter a valid supplier address (0x...)'); return }
    if (!faceValueStr || isNaN(parseFloat(faceValueStr)) || parseFloat(faceValueStr) <= 0) { toast.error('Enter a valid face value'); return }
    const activeTiers = tiers.filter((t) => t.windowEnd && pctToBps(t.discountPct) > 0)
    if (activeTiers.length === 0) { toast.error('Add at least one discount tier'); return }
    if (rebatePool === 0n) { toast.error('Rebate pool is zero — check tier 1 discount and face value'); return }
    approve({
      address: ARC_USDC.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [DISCOUNT_VAULT_ADDRESS, rebatePool],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
    toast.info('Step 1/2: approve USDC collateral…')
  }

  function handleClose() {
    onClose()
    setSupplier('')
    setFaceValueStr('')
    setExpiresAt(daysFromNow(30))
    setTiers([
      { windowEnd: daysFromNow(7),  discountPct: '2.00' },
      { windowEnd: daysFromNow(14), discountPct: '1.00' },
    ])
    resetApprove()
    resetPost()
  }

  const isLoading = approvePending || approveConfirming || postPending || postConfirming
  const step      = approvePending || approveConfirming ? 1 : postPending || postConfirming ? 2 : 0

  const hasSummary = faceValueRaw > 0n && tierSummaries.some((t) => t.bps > 0)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springs.overlay}
          onClick={handleClose}
        >
          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(6px)' }} />

          {/* Modal panel */}
          <motion.section
            className="relative w-full overflow-hidden rounded-t-3xl sm:rounded-3xl flex flex-col"
            style={{
              background: 'var(--surface-panel)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-sheet)',
              maxHeight: '92dvh',
              maxWidth: hasSummary ? '880px' : '560px',
            }}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={springs.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div
              className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>Post Invoice</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>
                  Lock USDC collateral · set discount tiers · supplier settles early for rebate
                </p>
              </div>
              <button onClick={handleClose} className="btn btn-ghost btn-sm size-8 p-0 rounded-full ml-3 flex-shrink-0">
                <X className="size-4" />
              </button>
            </div>

            {/* Step progress */}
            {isLoading && (
              <div
                className="flex items-center gap-3 px-6 py-2.5 text-xs flex-shrink-0"
                style={{ background: 'var(--accent-dim)', borderBottom: '1px solid var(--border)' }}
              >
                <Loader2 className="size-3.5 animate-spin flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--accent)' }}>
                  {step === 1 ? 'Step 1/2 — Approving USDC collateral in your wallet…' : 'Step 2/2 — Posting invoice onchain…'}
                </span>
                <div
                  className="ml-auto flex gap-1"
                >
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: step >= s ? '20px' : '8px',
                        background: step >= s ? 'var(--accent)' : 'var(--border-strong)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Two-column body (form left, summary right on desktop) ── */}
            <div className={`flex flex-col ${hasSummary ? 'lg:flex-row' : ''} flex-1 min-h-0`}>

              {/* ── Form column ── */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                {/* Supplier address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    Supplier Address
                    <span className="ml-1 font-normal" style={{ color: 'var(--subtle)' }}>(0x… wallet)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0x…"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm mono"
                    style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                  />
                  {supplier && (!supplier.startsWith('0x') || supplier.length !== 42) && (
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                      <Info className="size-3" /> Must be a valid 42-character 0x address
                    </p>
                  )}
                </div>

                {/* Face value */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    Invoice Face Value
                  </label>
                  <div
                    className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                  >
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={faceValueStr}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, '')
                        if (v === '' || /^\d*\.?\d*$/.test(v)) setFaceValueStr(v)
                      }}
                      className="display flex-1 bg-transparent text-3xl font-bold tabular-nums outline-none"
                      style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
                    />
                    <span
                      className="text-sm font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ background: 'var(--surface-strong)', color: 'var(--accent)' }}
                    >
                      USDC
                    </span>
                  </div>
                </div>

                {/* Discount tiers */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      Discount Tiers
                      <span className="ml-1.5 font-normal" style={{ color: 'var(--subtle)' }}>
                        (up to 3 · earlier = more discount)
                      </span>
                    </label>
                    {tiers.length < 3 && (
                      <button
                        onClick={() => setTiers((t) => [
                          ...t,
                          { windowEnd: daysFromNow(t.length * 7 + 7), discountPct: '0.50' },
                        ])}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: 'var(--accent)' }}
                      >
                        <Plus className="size-3" /> Add tier
                      </button>
                    )}
                  </div>

                  {tiers.map((tier, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-4"
                      style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-md"
                            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                          >
                            Tier {i + 1}
                          </span>
                          {tierSummaries[i]?.savings > 0n && faceValueRaw > 0n && (
                            <span className="text-xs" style={{ color: 'var(--success)' }}>
                              supplier saves {formatUsdc6(tierSummaries[i].savings)}
                            </span>
                          )}
                        </div>
                        {tiers.length > 1 && (
                          <button
                            onClick={() => setTiers((ts) => ts.filter((_, j) => j !== i))}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)', borderColor: 'transparent' }}
                          >
                            <Trash2 className="size-3" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs" style={{ color: 'var(--subtle)' }}>Window closes</div>
                          <input
                            type="datetime-local"
                            value={tier.windowEnd}
                            onChange={(e) => setTiers((ts) => ts.map((t, j) => j === i ? { ...t, windowEnd: e.target.value } : t))}
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs" style={{ color: 'var(--subtle)' }}>Discount (%)</div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0.01"
                              max="50"
                              step="0.01"
                              placeholder="2.00"
                              value={tier.discountPct}
                              onChange={(e) => setTiers((ts) => ts.map((t, j) => j === i ? { ...t, discountPct: e.target.value } : t))}
                              className="w-full rounded-lg px-3 py-2 text-sm tabular-nums pr-9"
                              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                              style={{ color: 'var(--subtle)' }}
                            >
                              %
                            </span>
                          </div>
                          {pctToBps(tier.discountPct) > 0 && (
                            <div className="text-[11px] tabular-nums" style={{ color: 'var(--ghost)' }}>
                              = {pctToBps(tier.discountPct)} bps
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Live tier monotonicity warning */}
                  {tiers.length > 1 && (() => {
                    const bpsArr = tiers.map(t => pctToBps(t.discountPct))
                    const nonDecreasing = bpsArr.some((b, i) => i > 0 && b >= bpsArr[i - 1])
                    const windowArr = tiers.map(t => t.windowEnd)
                    const nonIncreasing = windowArr.some((w, i) => i > 0 && w && windowArr[i-1] && w <= windowArr[i-1])
                    if (nonDecreasing || nonIncreasing) {
                      return (
                        <p className="flex items-start gap-1.5 text-xs rounded-lg px-3 py-2"
                          style={{ background: 'var(--warning-dim)', border: '1px solid var(--warning-border)', color: 'var(--warning)' }}>
                          <Info className="size-3 mt-0.5 flex-shrink-0" />
                          {nonIncreasing
                            ? 'Window-end dates must be in increasing order across tiers.'
                            : 'Discount % must decrease from tier 1 → 2 → 3 (earlier tiers earn more).'}
                        </p>
                      )
                    }
                    return null
                  })()}
                  <p className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--subtle)' }}>
                    <Info className="size-3 mt-0.5 flex-shrink-0" />
                    Tiers must have increasing window-end times and decreasing discount %.
                  </p>
                </div>

                {/* Expiry */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    Invoice Expiry
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_EXPIRIES.map(({ label, days }) => (
                      <button
                        key={days}
                        onClick={() => setExpiresAt(daysFromNow(days))}
                        className="btn btn-sm"
                        style={
                          expiresAt === daysFromNow(days)
                            ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                            : { background: 'var(--surface-muted)', color: 'var(--muted)', border: '1px solid var(--border)' }
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                  />
                </div>
              </div>

              {/* ── Live financial summary panel (desktop sidebar) ── */}
              {hasSummary && (
                <div
                  className="hidden lg:flex flex-col flex-shrink-0 overflow-y-auto"
                  style={{
                    width: '280px',
                    borderLeft: '1px solid var(--border)',
                    background: 'var(--surface-muted)',
                  }}
                >
                  <div
                    className="px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="label-caps mb-0.5">Invoice Summary</div>
                    <p className="text-xs" style={{ color: 'var(--subtle)' }}>Updates as you type</p>
                  </div>

                  <div className="px-5 py-4 space-y-4 flex-1">
                    {/* Face value */}
                    <div>
                      <div className="label-caps mb-1">Face Value</div>
                      <div className="display text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                        {faceValueStr ? formatUsdc6(faceValueRaw) : '—'}
                      </div>
                    </div>

                    {/* Collateral to lock */}
                    <div
                      className="rounded-xl px-3.5 py-3"
                      style={{ background: 'var(--warning-dim)', border: '1px solid var(--warning-border)' }}
                    >
                      <div className="label-caps mb-1" style={{ color: 'var(--warning)' }}>Collateral You Lock</div>
                      <div className="display text-lg font-bold tabular-nums" style={{ color: 'var(--warning)' }}>
                        {rebatePool > 0n ? formatUsdc6(rebatePool) : '—'}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>
                        tier-1 max rebate ({tiers[0]?.discountPct || '0'}%)
                      </div>
                    </div>

                    {/* Per-tier breakdown */}
                    <div>
                      <div className="label-caps mb-2">Supplier Savings per Tier</div>
                      <div className="space-y-2">
                        {tierSummaries.map((t, i) => (
                          t.bps > 0 && (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg px-3 py-2.5"
                              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                            >
                              <div>
                                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Tier {i + 1}</span>
                                <div className="text-[11px]" style={{ color: 'var(--subtle)' }}>
                                  {t.windowEnd ? new Date(t.windowEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--success)' }}>
                                  {faceValueRaw > 0n ? formatUsdc6(t.savings) : '—'}
                                </div>
                                <div className="text-[11px]" style={{ color: 'var(--subtle)' }}>
                                  {(t.bps / 100).toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    {/* Flow summary */}
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <div
                        className="px-3.5 py-2 flex items-center gap-1.5"
                        style={{ background: 'var(--surface-strong)', borderBottom: '1px solid var(--border)' }}
                      >
                        <ChevronRight className="size-3.5" style={{ color: 'var(--subtle)' }} />
                        <span className="label-caps">What Happens</span>
                      </div>
                      <div className="px-3.5 py-3 space-y-2 text-xs" style={{ color: 'var(--muted)' }}>
                        <p>
                          You lock <strong style={{ color: 'var(--warning)' }}>{rebatePool > 0n ? formatUsdc6(rebatePool) : '…'}</strong> as collateral now.
                        </p>
                        <p>
                          Supplier pays <strong style={{ color: 'var(--ink)' }}>
                            {faceValueRaw > 0n && tierSummaries[0]?.savings > 0n
                              ? formatUsdc6(faceValueRaw - tierSummaries[0].savings)
                              : '…'}
                          </strong> to settle at tier 1.
                        </p>
                        <p>
                          If unsettled by expiry, your <strong style={{ color: 'var(--warning)' }}>
                            {rebatePool > 0n ? formatUsdc6(rebatePool) : '…'}
                          </strong> returns automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky footer ── */}
            <div
              className="px-6 py-4 space-y-3 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-panel)' }}
            >
              {/* Mobile collateral hint */}
              {rebatePool > 0n && (
                <p className="flex items-center gap-1.5 text-xs lg:hidden" style={{ color: 'var(--muted)' }}>
                  <Info className="size-3" style={{ color: 'var(--accent)' }} />
                  Collateral to lock:{' '}
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>
                    {formatUsdc6(rebatePool)}
                  </span>
                  <span style={{ color: 'var(--subtle)' }}>(tier-1 max rebate)</span>
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-primary btn-xl w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {approvePending || approveConfirming ? 'Approving collateral…' : 'Posting invoice…'}
                  </>
                ) : rebatePool > 0n ? (
                  `Lock ${formatUsdc6(rebatePool)} & Post Invoice`
                ) : (
                  'Post Invoice'
                )}
              </button>

              {postHash && (
                <a
                  href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, postHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs"
                  style={{ color: 'var(--accent)' }}
                >
                  <ExternalLink className="size-3" />
                  View transaction on explorer
                </a>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
