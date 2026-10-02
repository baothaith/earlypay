import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { erc20Abi } from 'viem'
import {
  ExternalLink, Clock, CheckCircle2, XCircle, Loader2,
  ChevronDown, ChevronUp, Timer, Coins, User, Building2,
} from 'lucide-react'
import { DISCOUNT_VAULT_ABI, DISCOUNT_VAULT_ADDRESS, InvoiceData, formatBps } from '@/lib/discountVault'
import { ARC_TESTNET_CHAIN_ID, ARC_USDC, shortAddr, formatUsdc6, formatRelativeTime, formatDateTime } from '@/lib/constants'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

/** Approximate current unix timestamp in seconds, computed once at module load.
 *  Kept outside the component to satisfy the react/purity lint rule. */
const _NOW_SECS = BigInt(Math.floor(Date.now() / 1000))

interface Props {
  invoice: InvoiceData
  role: 'buyer' | 'supplier' | 'observer'
  onRefresh?: () => void
}

const STATE_META = {
  OPEN:    { color: 'var(--accent)',   icon: Clock,         label: 'Open' },
  SETTLED: { color: 'var(--success)',  icon: CheckCircle2,  label: 'Settled' },
  EXPIRED: { color: 'var(--subtle)',   icon: XCircle,       label: 'Expired' },
}

export function InvoiceCard({ invoice, role, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { chainId } = useAccount()
  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  // ── Settle flow ───────────────────────────────────────────────────────────
  const { writeContract: approve, data: approveHash, isPending: approvePending, reset: resetApprove } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: settle, data: settleHash, isPending: settlePending, reset: resetSettle } = useWriteContract()
  const { isLoading: settleConfirming, isSuccess: settleSuccess } = useWaitForTransactionReceipt({ hash: settleHash })

  // ── Expire flow ───────────────────────────────────────────────────────────
  const { writeContract: expire, data: expireHash, isPending: expirePending } = useWriteContract()
  const { isLoading: expireConfirming, isSuccess: expireSuccess } = useWaitForTransactionReceipt({ hash: expireHash })

  // ── Computed ──────────────────────────────────────────────────────────────
  const isExpired   = invoice.expiresAt < _NOW_SECS
  const canSettle   = role === 'supplier' && invoice.state === 'OPEN' && !isExpired
  const canExpire   = invoice.state === 'OPEN' && isExpired
  const activeBps   = invoice.activeTierBps ?? 0
  const rebateAmt   = (invoice.faceValue * BigInt(activeBps)) / 10000n
  const capped      = rebateAmt > invoice.rebatePool ? invoice.rebatePool : rebateAmt
  const supplierPays = invoice.faceValue - capped

  const { color: stateColor, icon: StateIcon } = STATE_META[invoice.state]

  const settleLoading = approvePending || approveConfirming || settlePending || settleConfirming
  const expireLoading  = expirePending || expireConfirming

  // Auto-chain: settle after approve confirms
  if (approveSuccess && !settleHash && !settlePending) {
    settle({
      address: DISCOUNT_VAULT_ADDRESS,
      abi: DISCOUNT_VAULT_ABI,
      functionName: 'settleInvoice',
      args: [invoice.id],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
    toast.info('Step 2/2: settling invoice…')
    resetApprove()
  }

  if (settleSuccess) {
    toast.success(`Invoice #${invoice.id} settled!`)
    onRefresh?.()
    resetSettle()
  }

  if (expireSuccess) {
    toast.success(`Invoice #${invoice.id} expired — collateral returned`)
    onRefresh?.()
  }

  const handleApproveAndSettle = () => {
    if (wrongChain) { toast.error('Switch to Arc Testnet first'); return }
    approve({
      address: ARC_USDC.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [DISCOUNT_VAULT_ADDRESS, supplierPays],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
    toast.info('Step 1/2: approve USDC spend')
  }

  const handleExpire = () => {
    if (wrongChain) { toast.error('Switch to Arc Testnet first'); return }
    expire({
      address: DISCOUNT_VAULT_ADDRESS,
      abi: DISCOUNT_VAULT_ABI,
      functionName: 'expireInvoice',
      args: [invoice.id],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  return (
    <div
      className="invoice-row"
      style={
        invoice.state === 'OPEN' && activeBps > 0
          ? { borderColor: 'rgba(110,207,134,0.22)' }
          : undefined
      }
    >
      {/* ── Summary row (always visible) ── */}
      <button
        className="w-full grid items-center px-5 py-4 text-left"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto auto',
          gap: '12px',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* State icon */}
        <div
          className="size-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${stateColor}18`, border: `1px solid ${stateColor}30` }}
        >
          <StateIcon className="size-4" style={{ color: stateColor }} />
        </div>

        {/* Primary info */}
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="display font-bold text-base tabular-nums" style={{ color: 'var(--ink)' }}>
              {formatUsdc6(invoice.faceValue)}
            </span>
            <span className="mono text-xs" style={{ color: 'var(--subtle)' }}>
              #{invoice.id.toString()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--subtle)' }}>
            <span className="flex items-center gap-1">
              <Building2 className="size-3" />
              {shortAddr(invoice.buyer)}
            </span>
            <span>→</span>
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {shortAddr(invoice.supplier)}
            </span>
          </div>
        </div>

        {/* Active tier badge */}
        <div className="hidden sm:flex items-center">
          {invoice.state === 'OPEN' && activeBps > 0 && (
            <span className="badge badge-success">{formatBps(activeBps)} rebate</span>
          )}
          {invoice.state === 'OPEN' && activeBps === 0 && !isExpired && (
            <span className="badge badge-muted">No active tier</span>
          )}
          {invoice.state === 'SETTLED' && (
            <span className="badge badge-success">Settled</span>
          )}
          {invoice.state === 'EXPIRED' && (
            <span className="badge badge-muted">Expired</span>
          )}
          {invoice.state === 'OPEN' && isExpired && (
            <span className="badge badge-danger">Overdue</span>
          )}
        </div>

        {/* Expiry countdown */}
        <div className="hidden md:flex items-center gap-1.5 text-xs" style={{ color: isExpired ? 'var(--danger)' : 'var(--muted)' }}>
          {invoice.state === 'OPEN' && (
            <>
              <Timer className="size-3.5" />
              <span className="tabular-nums">
                {isExpired ? 'Overdue' : formatRelativeTime(invoice.expiresAt)}
              </span>
            </>
          )}
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0">
          {expanded
            ? <ChevronUp  className="size-4" style={{ color: 'var(--subtle)' }} />
            : <ChevronDown className="size-4" style={{ color: 'var(--subtle)' }} />
          }
        </div>
      </button>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div
          className="px-5 pb-5 space-y-5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* Parties + amounts grid */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Buyer',          value: shortAddr(invoice.buyer),    mono: true,  accent: false },
              { label: 'Supplier',       value: shortAddr(invoice.supplier), mono: true,  accent: false },
              { label: 'Face Value',     value: formatUsdc6(invoice.faceValue), mono: false, accent: false },
              { label: 'Collateral',     value: formatUsdc6(invoice.rebatePool), mono: false, accent: true  },
            ].map(({ label, value, mono, accent }) => (
              <div
                key={label}
                className="rounded-xl px-3 py-2.5"
                style={{ background: 'var(--surface-inset)', border: '1px solid var(--border)' }}
              >
                <div className="label-caps mb-1">{label}</div>
                <div
                  className={`text-sm font-semibold tabular-nums ${mono ? 'mono' : 'display'}`}
                  style={{ color: accent ? 'var(--accent)' : 'var(--ink)' }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Discount tiers */}
          {invoice.tiers.length > 0 && (
            <div>
              <div className="label-caps mb-2.5 flex items-center gap-2">
                <Coins className="size-3.5" />
                Discount Tiers ({invoice.tiers.length})
              </div>
              <div className="space-y-2">
                {invoice.tiers.map((tier, i) => {
                  const active = tier.windowEnd >= _NOW_SECS && invoice.state === 'OPEN'
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5"
                      style={{
                        background: active ? 'var(--success-dim)' : 'var(--surface-muted)',
                        border:     active ? '1px solid var(--success-border)' : '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <span
                          className="text-xs font-semibold mr-2"
                          style={{ color: active ? 'var(--success)' : 'var(--muted)' }}
                        >
                          Tier {i + 1}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                          closes {formatDateTime(tier.windowEnd)}
                        </span>
                      </div>
                      <span
                        className="display text-base font-bold tabular-nums"
                        style={{ color: active ? 'var(--success)' : 'var(--subtle)' }}
                      >
                        {formatBps(tier.discountBps)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Settlement summary (OPEN + not expired) */}
          {invoice.state === 'OPEN' && !isExpired && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}
            >
              <div
                className="px-4 py-2 flex items-center gap-2"
                style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}
              >
                <Coins className="size-3.5" style={{ color: 'var(--subtle)' }} />
                <span className="label-caps">Settlement Preview</span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {[
                  { label: 'Active discount', value: activeBps > 0 ? formatBps(activeBps) : '—', color: activeBps > 0 ? 'var(--success)' : 'var(--muted)' },
                  { label: 'Rebate to supplier', value: formatUsdc6(capped), color: 'var(--accent)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2.5 text-xs">
                    <span style={{ color: 'var(--subtle)' }}>{label}</span>
                    <span style={{ color }} className="font-semibold tabular-nums">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Supplier pays</span>
                  <span className="display text-base font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                    {formatUsdc6(supplierPays)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Settlement receipt (SETTLED) */}
          {invoice.state === 'SETTLED' && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--success-dim)', border: '1px solid var(--success-border)' }}
            >
              <div className="divide-y" style={{ borderColor: 'rgba(110,207,134,0.15)' }}>
                {[
                  { label: 'Rebate paid',  value: formatUsdc6(invoice.rebatePaid),   color: 'var(--success)' },
                  { label: 'Settled at',   value: formatDateTime(invoice.settledAt),  color: 'var(--muted)' },
                  { label: 'Settler',      value: shortAddr(invoice.settler),         color: 'var(--muted)', mono: true },
                ].map(({ label, value, color, mono }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2.5 text-xs">
                    <span style={{ color: 'var(--subtle)' }}>{label}</span>
                    <span className={mono ? 'mono' : ''} style={{ color }} >{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiry timestamp row */}
          <div className="flex justify-between items-center text-xs px-1">
            <span style={{ color: 'var(--subtle)' }}>Invoice expiry</span>
            <span
              className="tabular-nums"
              style={{ color: isExpired ? 'var(--danger)' : 'var(--muted)' }}
            >
              {formatDateTime(invoice.expiresAt)}
            </span>
          </div>

          {/* Action buttons */}
          {canSettle && (
            <button
              onClick={handleApproveAndSettle}
              disabled={settleLoading}
              className="btn btn-primary btn-xl w-full"
            >
              {settleLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {approvePending || approveConfirming ? 'Approving…' : 'Settling…'}
                </>
              ) : (
                <>
                  <Coins className="size-4" />
                  Pay {formatUsdc6(supplierPays)} — Claim {formatUsdc6(capped)} rebate
                </>
              )}
            </button>
          )}

          {canExpire && (
            <button
              onClick={handleExpire}
              disabled={expireLoading}
              className="btn btn-danger btn-lg w-full"
            >
              {expireLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Expiring…
                </>
              ) : (
                'Expire Invoice — Return Collateral to Buyer'
              )}
            </button>
          )}

          {/* Explorer links */}
          {(settleHash || expireHash) && (
            <a
              href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, (settleHash ?? expireHash)!)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--accent)' }}
            >
              <ExternalLink className="size-3" />
              View transaction on explorer
            </a>
          )}
        </div>
      )}
    </div>
  )
}
