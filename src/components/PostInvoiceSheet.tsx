/**
 * Post Invoice modal — centered dialog on desktop, bottom sheet on mobile.
 * Two-step flow: approve USDC collateral → postInvoice.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { erc20Abi } from 'viem'
import { X, Plus, Loader2, ExternalLink, Trash2, Info } from 'lucide-react'
import { DISCOUNT_VAULT_ABI, DISCOUNT_VAULT_ADDRESS, packTiers } from '@/lib/discountVault'
import { ARC_TESTNET_CHAIN_ID, ARC_USDC, formatUsdc6 } from '@/lib/constants'
import { parseAmount } from '@/onchain-money'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

interface TierInput {
  windowEnd: string
  discountBps: string
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

export function PostInvoiceSheet({ open, onClose, onSuccess }: Props) {
  const { chainId } = useAccount()
  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  const [supplier, setSupplier] = useState('')
  const [faceValueStr, setFaceValueStr] = useState('')
  const [expiresAt, setExpiresAt] = useState(daysFromNow(30))
  const [tiers, setTiers] = useState<TierInput[]>([
    { windowEnd: daysFromNow(7),  discountBps: '200' },
    { windowEnd: daysFromNow(14), discountBps: '100' },
  ])

  let rebatePool = 0n
  try {
    const fv   = parseAmount(ARC_TESTNET_CHAIN_ID, faceValueStr)
    const bps0 = parseInt(tiers[0]?.discountBps ?? '0', 10) || 0
    rebatePool  = (fv.raw * BigInt(bps0)) / 10000n
  } catch { /* invalid input */ }

  // ── Approve ────────────────────────────────────────────────────────────────
  const {
    writeContract: approve, data: approveHash,
    isPending: approvePending, reset: resetApprove, isError: approveError,
  } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  // ── Post Invoice ───────────────────────────────────────────────────────────
  const {
    writeContract: post, data: postHash,
    isPending: postPending, reset: resetPost, isError: postError,
  } = useWriteContract()
  const { isLoading: postConfirming, isSuccess: postSuccess } = useWaitForTransactionReceipt({ hash: postHash })

  // Auto-post once approve confirms
  if (approveSuccess && !postHash && !postPending) {
    try {
      const fv = parseAmount(ARC_TESTNET_CHAIN_ID, faceValueStr)
      const activeTiers = tiers
        .filter((t) => t.windowEnd && parseInt(t.discountBps, 10) > 0)
        .map((t) => ({ windowEnd: toUnixTimestamp(t.windowEnd), discountBps: parseInt(t.discountBps, 10) }))
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
    const activeTiers = tiers.filter((t) => t.windowEnd && parseInt(t.discountBps, 10) > 0)
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
      { windowEnd: daysFromNow(7),  discountBps: '200' },
      { windowEnd: daysFromNow(14), discountBps: '100' },
    ])
    resetApprove()
    resetPost()
  }

  const isLoading = approvePending || approveConfirming || postPending || postConfirming

  // Step indicator
  const step = approvePending || approveConfirming ? 1 : postPending || postConfirming ? 2 : 0

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
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(4,9,18,0.72)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal panel */}
          <motion.section
            className="relative w-full sm:max-w-xl overflow-hidden
                       rounded-t-3xl sm:rounded-3xl flex flex-col"
            style={{
              background: '#0c1724',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-sheet)',
              maxHeight: '92dvh',
            }}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={springs.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div
              className="flex items-start justify-between px-6 pt-6 pb-5 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>
                  Post Invoice
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>
                  Lock USDC collateral · set discount tiers · supplier settles early for rebate
                </p>
              </div>
              <button
                onClick={handleClose}
                className="btn btn-ghost btn-sm size-8 p-0 rounded-full ml-3 flex-shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Step progress */}
            {isLoading && (
              <div
                className="flex items-center gap-3 px-6 py-2.5 text-xs"
                style={{ background: 'rgba(172,198,233,0.06)', borderBottom: '1px solid var(--border)' }}
              >
                <Loader2 className="size-3.5 animate-spin" style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--accent)' }}>
                  {step === 1 ? 'Step 1/2 — Approving USDC collateral…' : 'Step 2/2 — Posting invoice onchain…'}
                </span>
              </div>
            )}

            {/* ── Scrollable body ── */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

              {/* ── Supplier address ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Supplier Address
                </label>
                <input
                  type="text"
                  placeholder="0x…"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm mono"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>

              {/* ── Face value ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  Invoice Face Value
                </label>
                <div
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={faceValueStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setFaceValueStr(v)
                    }}
                    className="display flex-1 bg-transparent text-3xl font-bold tabular-nums outline-none placeholder-slate-600"
                    style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
                  />
                  <span
                    className="text-sm font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'var(--surface-strong)', color: 'var(--accent)' }}
                  >
                    USDC
                  </span>
                </div>
                {rebatePool > 0n && (
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                    <Info className="size-3" style={{ color: 'var(--accent)' }} />
                    Collateral to lock:{' '}
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>
                      {formatUsdc6(rebatePool)}
                    </span>
                    <span style={{ color: 'var(--subtle)' }}>(tier-1 max rebate)</span>
                  </p>
                )}
              </div>

              {/* ── Discount tiers ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    Discount Tiers
                    <span className="ml-1.5 font-normal" style={{ color: 'var(--subtle)' }}>
                      (up to 3 · higher tier = earlier deadline + more discount)
                    </span>
                  </label>
                  {tiers.length < 3 && (
                    <button
                      onClick={() =>
                        setTiers((t) => [
                          ...t,
                          { windowEnd: daysFromNow(t.length * 7 + 7), discountBps: '50' },
                        ])
                      }
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
                    {/* Tier header */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                      >
                        Tier {i + 1}
                      </span>
                      {tiers.length > 1 && (
                        <button
                          onClick={() => setTiers((ts) => ts.filter((_, j) => j !== i))}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)', borderColor: 'transparent' }}
                        >
                          <Trash2 className="size-3" />
                          Remove
                        </button>
                      )}
                    </div>
                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs" style={{ color: 'var(--subtle)' }}>Window closes</div>
                        <input
                          type="datetime-local"
                          value={tier.windowEnd}
                          onChange={(e) =>
                            setTiers((ts) => ts.map((t, j) => (j === i ? { ...t, windowEnd: e.target.value } : t)))
                          }
                          className="w-full rounded-lg px-3 py-2 text-sm"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)', colorScheme: 'dark' }}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs" style={{ color: 'var(--subtle)' }}>Discount (bps)</div>
                        <input
                          type="number"
                          min={1}
                          max={5000}
                          value={tier.discountBps}
                          onChange={(e) =>
                            setTiers((ts) => ts.map((t, j) => (j === i ? { ...t, discountBps: e.target.value } : t)))
                          }
                          className="w-full rounded-lg px-3 py-2 text-sm tabular-nums"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                        />
                        <div className="text-xs tabular-nums" style={{ color: 'var(--subtle)' }}>
                          = {tier.discountBps ? ((parseInt(tier.discountBps, 10) || 0) / 100).toFixed(2) : '0.00'}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <p className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--subtle)' }}>
                  <Info className="size-3 mt-0.5 flex-shrink-0" />
                  Tiers must have strictly increasing window-end times and non-increasing discount %.
                </p>
              </div>

              {/* ── Expiry ── */}
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
                          ? { background: 'var(--accent)', color: '#07111f' }
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
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)', colorScheme: 'dark' }}
                />
              </div>

            </div>

            {/* ── Sticky footer ── */}
            <div
              className="px-6 py-4 space-y-3 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border)', background: '#0c1724' }}
            >
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
