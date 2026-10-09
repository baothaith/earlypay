/**
 * DashboardSummary — contextual orientation bar shown above the invoice feed.
 * Buyer tab: locked collateral · open count · settling-soon count.
 * Supplier tab: invoices to settle · best available rebate · nearest deadline.
 * All values derived from the already-fetched invoice list — no extra RPC calls.
 */
import { useMemo } from 'react'
import { TrendingDown, Clock, Coins, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { InvoiceData } from '@/lib/discountVault'
import { formatUsdc6, formatRelativeTime } from '@/lib/constants'

const _NOW_SECS = BigInt(Math.floor(Date.now() / 1000))
const SOON_SECS = BigInt(72 * 3600) // 72 h window = "settling soon"

interface Props {
  tab: 'buyer' | 'supplier'
  invoices: InvoiceData[]
}

interface StatTile {
  label: string
  value: string
  sub?: string
  accent: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  highlight?: boolean
}

export function DashboardSummary({ tab, invoices }: Props) {
  const tiles = useMemo<StatTile[]>(() => {
    const open     = invoices.filter((i) => i.state === 'OPEN')
    const settled  = invoices.filter((i) => i.state === 'SETTLED')
    const overdue  = open.filter((i) => i.expiresAt < _NOW_SECS)
    const active   = open.filter((i) => i.expiresAt >= _NOW_SECS)
    const soon     = active.filter((i) => (i.expiresAt - _NOW_SECS) < SOON_SECS)

    if (tab === 'buyer') {
      // Collateral locked = sum of rebatePool on all OPEN invoices
      const locked = open.reduce((acc, i) => acc + i.rebatePool, 0n)

      return [
        {
          label: 'Open Invoices',
          value: String(active.length),
          sub: overdue.length > 0 ? `${overdue.length} overdue` : settled.length > 0 ? `${settled.length} settled` : undefined,
          accent: active.length > 0 ? 'var(--accent)' : 'var(--subtle)',
          icon: Clock,
          highlight: overdue.length > 0,
        },
        {
          label: 'Collateral Locked',
          value: locked > 0n ? formatUsdc6(locked) : '$0.00',
          sub: 'in vault',
          accent: locked > 0n ? 'var(--warning)' : 'var(--subtle)',
          icon: Coins,
        },
        {
          label: 'Settling Soon',
          value: String(soon.length),
          sub: soon.length > 0 ? 'within 72h' : 'none due soon',
          accent: soon.length > 0 ? 'var(--warning)' : 'var(--subtle)',
          icon: AlertTriangle,
          highlight: soon.length > 0,
        },
        {
          label: 'Settled',
          value: String(settled.length),
          sub: invoices.length > 0 ? `of ${invoices.length} total` : undefined,
          accent: settled.length > 0 ? 'var(--success)' : 'var(--subtle)',
          icon: CheckCircle2,
        },
      ]
    }

    // Supplier tab
    const settleable = active.filter((i) => (i.activeTierBps ?? 0) > 0)
    const bestBps    = settleable.reduce((max, i) => {
      const bps = i.activeTierBps ?? 0
      return bps > max ? bps : max
    }, 0)
    const bestRebate = settleable.reduce((max, i) => {
      const bps = i.activeTierBps ?? 0
      const r   = (i.faceValue * BigInt(bps)) / 10000n
      return r > max ? r : max
    }, 0n)
    const nearest    = active.length > 0
      ? active.reduce((min, i) => (i.expiresAt < min.expiresAt ? i : min), active[0])
      : null

    return [
      {
        label: 'To Settle',
        value: String(active.length),
        sub: overdue.length > 0 ? `${overdue.length} overdue` : undefined,
        accent: active.length > 0 ? 'var(--accent)' : 'var(--subtle)',
        icon: Coins,
        highlight: overdue.length > 0,
      },
      {
        label: 'Best Rebate Available',
        value: bestBps > 0 ? `${(bestBps / 100).toFixed(2)}%` : '—',
        sub: bestRebate > 0n ? `save up to ${formatUsdc6(bestRebate)}` : 'no active tiers',
        accent: bestBps > 0 ? 'var(--success)' : 'var(--subtle)',
        icon: TrendingDown,
        highlight: bestBps > 0,
      },
      {
        label: 'Nearest Deadline',
        value: nearest ? formatRelativeTime(nearest.expiresAt) : '—',
        sub: nearest ? `Invoice #${nearest.id}` : undefined,
        accent: nearest && (nearest.expiresAt - _NOW_SECS) < SOON_SECS ? 'var(--warning)' : 'var(--muted)',
        icon: Clock,
        highlight: nearest ? (nearest.expiresAt - _NOW_SECS) < SOON_SECS : false,
      },
      {
        label: 'Settled',
        value: String(settled.length),
        sub: invoices.length > 0 ? `of ${invoices.length} total` : undefined,
        accent: settled.length > 0 ? 'var(--success)' : 'var(--subtle)',
        icon: CheckCircle2,
      },
    ]
  }, [tab, invoices])

  if (invoices.length === 0) return null

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4"
      aria-label={`${tab} summary`}
    >
      {tiles.map(({ label, value, sub, accent, icon: Icon, highlight }) => (
        <div
          key={label}
          className="rounded-xl px-3.5 py-3 flex items-center gap-3"
          style={{
            background: highlight ? `${accent}10` : 'var(--surface)',
            border: `1px solid ${highlight ? `${accent}35` : 'var(--border)'}`,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <div
            className="size-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}18` }}
          >
            <Icon className="size-3.5" style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <div className="label-caps truncate">{label}</div>
            <div
              className="display text-sm font-bold tabular-nums leading-tight"
              style={{ color: highlight ? accent : 'var(--ink)' }}
            >
              {value}
            </div>
            {sub && (
              <div className="text-[11px] truncate mt-0.5" style={{ color: highlight ? accent : 'var(--subtle)' }}>
                {sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
