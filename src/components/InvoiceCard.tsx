import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { erc20Abi } from 'viem'
import {
  ExternalLink, Clock, CheckCircle2, XCircle, Loader2,
  ChevronDown, ChevronUp, Timer, Coins, User, Building2, Copy, Check,
} from 'lucide-react'
import { DISCOUNT_VAULT_ABI, DISCOUNT_VAULT_ADDRESS, InvoiceData, formatBps } from '@/lib/discountVault'
import { ARC_TESTNET_CHAIN_ID, ARC_USDC, shortAddr, formatUsdc6, formatRelativeTime, formatDateTime } from '@/lib/constants'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

/** Approximate current unix timestamp in seconds, computed once at module load. */
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

/** Small copy-to-clipboard button */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy ${text}`}
      className="btn btn-ghost btn-sm p-0 size-5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ border: 'none', minWidth: 0 }}
      aria-label={copied ? 'Copied' : 'Copy address'}
    >
      {copied
        ? <Check className="size-3" style={{ color: 'var(--success)' }} />
        : <Copy className="size-3" style={{ color: 'var(--ghost)' }} />
      }
    </button>
  )
}

export function InvoiceCard({ invoice, role, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { chainId } = useAccount()
  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  // ── Settle flow ──────────────────────────────────────────────────────────
  const { writeContract: approve, data: approveHash, isPending: approvePending, reset: resetApprove } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: settle, data: settleHash, isPending: settlePending, reset: resetSettle } = useWriteContract()
  const { isLoading: settleConfirming, isSuccess: settleSuccess } = useWaitForTransactionReceipt({ hash: settleHash })

  // ── Expire flow ──────────────────────────────────────────────────────────
  const { writeContract: expire, data: expireHash, isPending: expirePending } = useWriteContract()
  const { isLoading: expireConfirming, isSuccess: expireSuccess } = useWaitForTransactionReceipt({ hash: expireHash })

  // ── Computed ─────────────────────────────────────────────────────────────
  const isExpired    = invoice.expiresAt < _NOW_SECS
  const canSettle    = role === 'supplier' && invoice.state === 'OPEN' && !isExpired
  const canExpire    = invoice.state === 'OPEN' && isExpired
  const activeBps    = invoice.activeTierBps ?? 0
  const rebateAmt    = (invoice.faceValue * BigInt(activeBps)) / 10000n
  const capped       = rebateAmt > invoice.rebatePool ? invoice.rebatePool : rebateAmt
  const supplierPays = invoice.faceValue - capped

  // Urgency: < 24h left
  const secsLeft         = Number(invoice.expiresAt) - Number(_NOW_SECS)
  const urgentExpiry     = invoice.state === 'OPEN' && !isExpired && secsLeft < 86400
  const expiryColor      = isExpired ? 'var(--danger)' : urgentExpiry ? 'var(--warning)' : 'var(--muted)'
  const expiryLabel      = isExpired
    ? 'Overdue'
    : urgentExpiry
      ? `Expires in ${Math.max(0, Math.floor(secsLeft / 3600))}h`
      : formatRelativeTime(invoice.expiresAt)

  const { color: stateColor, icon: StateIcon } = STATE_META[invoice.state]

  const settleLoading = approvePending || approveConfirming || settlePending || settleConfirming
  const expireLoading = expirePending || expireConfirming

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

  const handleApproveAndSettle = (e?: React.MouseEvent) => {
    e?.stopPropagation()
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
          ? { borderColor: 'var(--success-border)' }
          : undefined
      }
    >
      {/* ── Summary row (always visible) ── */}
      <div
        className="group w-full grid items-center px-4 py-3.5"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto',
          gap: '10px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v) } }}
      >
        {/* State icon */}
        <div
          className="size-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${stateColor}18`, border: `1px solid ${stateColor}30` }}
        >
          <StateIcon className="size-4" style={{ color: stateColor }} />
        </div>

        {/* Primary info */}
        <div className="min-w-0">
          {/* Row 1: amount + ID + badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="display font-bold text-[15px] tabular-nums leading-tight" style={{ color: 'var(--ink)' }}>
              {formatUsdc6(invoice.faceValue)}
            </span>
            <span className="mono text-xs" style={{ color: 'var(--ghost)' }}>
              #{invoice.id.toString()}
            </span>

            {/* State badge — always visible */}
            {invoice.state === 'OPEN' && activeBps > 0 && (
              <span className="badge badge-success hidden sm:inline-flex">{formatBps(activeBps)} rebate</span>
            )}
            {invoice.state === 'OPEN' && activeBps === 0 && !isExpired && (
              <span className="badge badge-muted hidden sm:inline-flex">No active tier</span>
            )}
            {invoice.state === 'SETTLED' && (
              <span className="badge badge-success hidden sm:inline-flex">Settled</span>
            )}
            {invoice.state === 'EXPIRED' && (
              <span className="badge badge-muted hidden sm:inline-flex">Expired</span>
            )}
            {invoice.state === 'OPEN' && isExpired && (
              <span className="badge badge-danger hidden sm:inline-flex">Overdue</span>
            )}
            {urgentExpiry && (
              <span className="badge badge-warning hidden sm:inline-flex">⚠ {expiryLabel}</span>
            )}
          </div>

          {/* Row 2: buyer → supplier addresses */}
          <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--subtle)' }}>
            <span className="flex items-center gap-1">
              <Building2 className="size-3 flex-shrink-0" />
              <span className="font-mono">{shortAddr(invoice.buyer)}</span>
            </span>
            <span style={{ color: 'var(--ghost)' }}>→</span>
            <span className="flex items-center gap-1">
              <User className="size-3 flex-shrink-0" />
              <span className="font-mono">{shortAddr(invoice.supplier)}</span>
            </span>
            {/* Expiry on mobile (where right-col is hidden) */}
            {invoice.state === 'OPEN' && (
              <span className="flex items-center gap-1 sm:hidden" style={{ color: expiryColor, marginLeft: 'auto' }}>
                <Timer className="size-3 flex-shrink-0" />
                {expiryLabel}
              </span>
            )}
          </div>
        </div>

        {/* Right column: expiry + settle button OR just chevron */}
        <div
          className="hidden sm:flex items-center gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {invoice.state === 'OPEN' && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: expiryColor }}>
              <Timer className="size-3.5 flex-shrink-0" />
              <span className="tabular-nums">{expiryLabel}</span>
            </div>
          )}

          {/* Inline Settle Now — only for supplier, OPEN, not expired */}
          {canSettle && (
            <button
              onClick={handleApproveAndSettle}
              disabled={settleLoading}
              className="btn btn-primary btn-sm"
              style={{ minWidth: 0 }}
              title={`Pay ${formatUsdc6(supplierPays)} — Claim ${formatUsdc6(capped)} rebate`}
            >
              {settleLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Coins className="size-3.5" />
                  Settle
                </>
              )}
            </button>
          )}

          {/* Inline Expire button — overdue only */}
          {canExpire && !expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); handleExpire() }}
              disabled={expireLoading}
              className="btn btn-danger btn-sm"
              title="Expire invoice and return collateral to buyer"
            >
              {expireLoading ? <Loader2 className="size-3.5 animate-spin" /> : 'Expire'}
            </button>
          )}
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setExpanded(v => !v)}
            className="btn btn-ghost btn-sm p-0 size-7 rounded-lg"
            style={{ border: 'none' }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded
              ? <ChevronUp  className="size-4" style={{ color: 'var(--subtle)' }} />
              : <ChevronDown className="size-4" style={{ color: 'var(--subtle)' }} />
            }
          </button>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div
          className="px-4 pb-5 space-y-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* Parties + amounts grid */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Buyer',      value: invoice.buyer,    display: shortAddr(invoice.buyer),    mono: true,  accent: false, copyable: true },
              { label: 'Supplier',   value: invoice.supplier, display: shortAddr(invoice.supplier), mono: true,  accent: false, copyable: true },
              { label: 'Face Value', value: '',               display: formatUsdc6(invoice.faceValue), mono: false, accent: false, copyable: false },
              { label: 'Collateral', value: '',               display: formatUsdc6(invoice.rebatePool), mono: false, accent: true, copyable: false },
            ].map(({ label, value, display, mono, accent, copyable }) => (
              <div
                key={label}
                className={`rounded-xl px-3 py-2.5 ${copyable ? 'group' : ''}`}
                style={{ background: 'var(--surface-inset)', border: '1px solid var(--border)' }}
              >
                <div className="label-caps mb-1 flex items-center gap-1.5">
                  {label}
                  {copyable && <CopyButton text={value} />}
                </div>
                <div
                  className={`text-sm font-semibold tabular-nums truncate ${mono ? 'mono' : 'display'}`}
                  style={{ color: accent ? 'var(--accent)' : 'var(--ink)' }}
                >
                  {display}
                </div>
              </div>
            ))}
          </div>

          {/* Discount tiers */}
          {invoice.tiers.length > 0 && (
            <div>
              <div className="label-caps mb-2 flex items-center gap-2">
                <Coins className="size-3.5" />
                Discount Tiers ({invoice.tiers.length})
              </div>
              <div className="space-y-1.5">
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
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            background: active ? 'var(--success-dim)' : 'var(--surface-strong)',
                            color: active ? 'var(--success)' : 'var(--muted)',
                            border: `1px solid ${active ? 'var(--success-border)' : 'var(--border)'}`,
                          }}
                        >
                          T{i + 1}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                          closes {formatDateTime(tier.windowEnd)}
                        </span>
                        {active && (
                          <span className="badge badge-success text-[10px] py-0">active</span>
                        )}
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

          {/* Settlement preview (OPEN + not expired) */}
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
                  { label: 'Active discount',   value: activeBps > 0 ? formatBps(activeBps) : '—', color: activeBps > 0 ? 'var(--success)' : 'var(--muted)' },
                  { label: 'Rebate to supplier', value: formatUsdc6(capped),    color: 'var(--accent)' },
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
              <div className="divide-y" style={{ borderColor: 'var(--success-border)' }}>
                {[
                  { label: 'Rebate paid', value: formatUsdc6(invoice.rebatePaid),  color: 'var(--success)' },
                  { label: 'Settled at',  value: formatDateTime(invoice.settledAt), color: 'var(--muted)' },
                  { label: 'Settler',     value: shortAddr(invoice.settler),        color: 'var(--muted)', mono: true },
                ].map(({ label, value, color, mono }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2.5 text-xs">
                    <span style={{ color: 'var(--subtle)' }}>{label}</span>
                    <span className={mono ? 'mono' : ''} style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiry row */}
          <div className="flex justify-between items-center text-xs px-1">
            <span style={{ color: 'var(--subtle)' }}>Invoice expiry</span>
            <span className="tabular-nums" style={{ color: expiryColor }}>
              {formatDateTime(invoice.expiresAt)}
              {urgentExpiry && <span className="ml-1.5 font-semibold">({expiryLabel})</span>}
            </span>
          </div>

          {/* Action buttons (expanded, full size) */}
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
                <><Loader2 className="size-4 animate-spin" /> Expiring…</>
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
