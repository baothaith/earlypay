/**
 * SideNav — Vertical navigation panel (left rail).
 *
 * Structure:
 *  ┌─────────────────────┐
 *  │  Role tab switcher  │   ← primary navigation
 *  │  Post Invoice CTA   │   ← primary action
 *  │  ───────────────    │
 *  │  Overview stats     │   ← live onchain data
 *  │  ───────────────    │
 *  │  How it works       │   ← contextual help (collapsible)
 *  └─────────────────────┘
 *
 * Hidden on <lg. Mobile tab switching handled in main feed header.
 */
import { useState } from 'react'
import {
  Plus, TrendingUp, Wallet, Building2, Users,
  FileText, Info, ChevronDown, BookOpen,
} from 'lucide-react'
import { useReadContract, useAccount, useReadContracts } from 'wagmi'
import { erc20Abi } from 'viem'
import { DISCOUNT_VAULT_ABI, DISCOUNT_VAULT_ADDRESS } from '@/lib/discountVault'
import { ARC_TESTNET_CHAIN_ID, ARC_USDC, formatUsdc6 } from '@/lib/constants'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

type Tab = 'buyer' | 'supplier'

interface Props {
  buyerCount:    number
  supplierCount: number
  activeTab:     Tab
  onTabChange:   (t: Tab) => void
  onPost:        () => void
  onOpenDocs:    () => void
  docsActive:    boolean
}

export function SideNav({
  buyerCount, supplierCount, activeTab, onTabChange, onPost, onOpenDocs, docsActive,
}: Props) {
  const { address } = useAccount()
  const [howOpen, setHowOpen] = useState(false)

  /* ── Onchain data ── */
  const { data: totalData } = useReadContract({
    address: DISCOUNT_VAULT_ADDRESS,
    abi: DISCOUNT_VAULT_ABI,
    functionName: 'totalInvoices',
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { data: balanceData } = useReadContracts({
    contracts: [
      {
        address: ARC_USDC.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: ARC_TESTNET_CHAIN_ID,
      },
      {
        address: ARC_USDC.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [DISCOUNT_VAULT_ADDRESS],
        chainId: ARC_TESTNET_CHAIN_ID,
      },
    ],
    query: { enabled: !!address },
  })

  const walletBalance = balanceData?.[0]?.result
  const vaultTvl      = balanceData?.[1]?.result

  const fmtBalance = walletBalance != null
    ? `$${Amount.fromRaw(walletBalance, usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)).toFixed(2)}`
    : '—'
  const fmtTvl = vaultTvl != null ? formatUsdc6(vaultTvl) : '—'

  /* ── Role tab items ── */
  const tabs: { id: Tab; label: string; count: number; icon: typeof Building2 }[] = [
    { id: 'buyer',    label: 'Buyer',    count: buyerCount,    icon: Building2 },
    { id: 'supplier', label: 'Supplier', count: supplierCount, icon: Users },
  ]

  /* ── Stats ── */
  const stats = [
    { label: 'Wallet USDC', value: fmtBalance,                                             icon: Wallet,   accent: 'var(--accent)',  dim: 'var(--accent-dim)' },
    { label: 'Vault TVL',   value: fmtTvl,                                                  icon: TrendingUp, accent: 'var(--success)', dim: 'var(--success-dim)' },
    { label: 'All Invoices',value: totalData != null ? String(totalData) : '—',             icon: FileText, accent: 'var(--muted)',   dim: 'var(--surface-muted)' },
  ]

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 overflow-y-auto"
      style={{
        width: 'var(--sidenav-w)',
        background: 'var(--sidenav-bg)',
        borderRight: '1px solid var(--border)',
        height: 'calc(100dvh - var(--navbar-h))',
        position: 'sticky',
        top: 'var(--navbar-h)',
      }}
      aria-label="Dashboard navigation"
    >
      {/* Inner padding */}
      <div className="flex flex-col gap-0 flex-1">

        {/* ── Section: Role switcher ── */}
        <div style={{ padding: '16px 12px 8px' }}>
          <div className="label-caps px-2 mb-2">View as</div>
          <div className="flex flex-col gap-0.5">
            {tabs.map(({ id, label, count, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className="sidenav-item"
                  aria-current={active ? 'page' : undefined}
                  style={{
                    background: active ? 'var(--surface-active)' : 'transparent',
                    color:      active ? 'var(--ink)' : 'var(--muted)',
                    borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  <div
                    className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: active ? 'var(--accent-dim)' : 'var(--surface-muted)',
                    }}
                  >
                    <Icon className="size-3.5" style={{ color: active ? 'var(--accent)' : 'var(--subtle)' }} />
                  </div>
                  <span className="flex-1 text-left text-sm font-semibold">{label}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums"
                    style={{
                      background: active ? 'var(--accent-dim)' : 'var(--surface-muted)',
                      color:      active ? 'var(--accent)' : 'var(--ghost)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Section: Primary CTA ── */}
        <div style={{ padding: '4px 12px 8px' }}>
          <button
            onClick={onPost}
            className="btn btn-primary w-full"
            style={{ height: '40px', borderRadius: 'var(--radius-lg)', fontSize: '13px' }}
          >
            <Plus className="size-4" />
            Post Invoice
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={{ margin: '4px 12px', borderTop: '1px solid var(--border)' }} />

        {/* ── Section: Overview stats ── */}
        <div style={{ padding: '8px 12px' }}>
          <div className="label-caps px-2 mb-2">Overview</div>
          <div className="flex flex-col gap-0.5">
            {stats.map(({ label, value, icon: Icon, accent, dim }) => (
              <div key={label} className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl">
                <div
                  className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: dim }}
                >
                  <Icon className="size-3.5" style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px]" style={{ color: 'var(--subtle)' }}>{label}</div>
                  <div className="display text-sm font-bold tabular-nums leading-tight" style={{ color: 'var(--ink)' }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
            {/* Per-role counts */}
            <div
              className="flex items-center justify-between px-2 py-2 rounded-xl mt-0.5"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>As Buyer</span>
              <span className="display text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{buyerCount}</span>
            </div>
            <div
              className="flex items-center justify-between px-2 py-2 rounded-xl"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>As Supplier</span>
              <span className="display text-sm font-bold tabular-nums" style={{ color: 'var(--success)' }}>{supplierCount}</span>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ margin: '4px 12px', borderTop: '1px solid var(--border)' }} />

        {/* ── Section: Docs link ── */}
        <div style={{ padding: '8px 12px' }}>
          <button
            onClick={onOpenDocs}
            className="sidenav-item w-full"
            style={{
              background: docsActive ? 'var(--surface-active)' : 'transparent',
              color: docsActive ? 'var(--ink)' : 'var(--muted)',
              borderLeft: docsActive ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            <div
              className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: docsActive ? 'var(--accent-dim)' : 'var(--surface-muted)' }}
            >
              <BookOpen className="size-3.5" style={{ color: docsActive ? 'var(--accent)' : 'var(--subtle)' }} />
            </div>
            <span className="flex-1 text-left text-sm font-semibold">Documentation</span>
          </button>
        </div>

        {/* ── Section: How it works (collapsible) ── */}
        <div style={{ padding: '4px 12px', marginTop: 'auto' }}>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <button
              onClick={() => setHowOpen(!howOpen)}
              className="flex items-center gap-2 w-full px-2 py-2 rounded-xl transition-all text-left"
              style={{ color: 'var(--subtle)' }}
            >
              <Info className="size-3.5 flex-shrink-0" />
              <span className="label-caps flex-1">How it works</span>
              <ChevronDown
                className="size-3.5 transition-transform"
                style={{ transform: howOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {howOpen && (
              <div className="space-y-3 px-2 pb-3 pt-1">
                {[
                  { n: '1', title: 'Buyer posts invoice', desc: 'Locks max rebate as USDC collateral. Sets up to 3 time-decaying discount tiers.' },
                  { n: '2', title: 'Supplier settles early', desc: 'Pays face value minus active discount. Earlier = more savings.' },
                  { n: '3', title: 'Auto-expire', desc: 'Deadline passes → anyone triggers expiry → collateral returns to buyer.' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-2.5">
                    <div
                      className="size-5 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-bold display mt-0.5"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                    >
                      {n}
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--ink-2)' }}>{title}</p>
                      <p className="text-[11px] text-pretty" style={{ color: 'var(--subtle)', lineHeight: 1.55 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  )
}
