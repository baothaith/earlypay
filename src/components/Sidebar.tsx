/**
 * Sidebar — sticky left panel for desktop.
 * Displays: stats, tab navigation, "How it works" reference.
 * On mobile/tablet (<lg), the stats become a horizontal scrollable strip
 * and the nav moves to the main feed header. The sidebar itself is hidden
 * below lg breakpoint (hidden lg:block via utility classes).
 */
import React from 'react'
import { Plus, TrendingUp, Wallet, Building2, Users, FileText, Info } from 'lucide-react'
import { useReadContract, useAccount, useReadContracts } from 'wagmi'
import { erc20Abi } from 'viem'
import { DISCOUNT_VAULT_ABI, DISCOUNT_VAULT_ADDRESS } from '@/lib/discountVault'
import { ARC_TESTNET_CHAIN_ID, ARC_USDC, formatUsdc6 } from '@/lib/constants'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

type Tab = 'buyer' | 'supplier'

interface Props {
  buyerCount: number
  supplierCount: number
  activeTab: Tab
  onTabChange: (t: Tab) => void
  onPost: () => void
}

export function Sidebar({ buyerCount, supplierCount, activeTab, onTabChange, onPost }: Props) {
  const { address } = useAccount()

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

  type StatItem = {
    label: string
    value: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    accent: string
    accentDim: string
  }

  const stats: StatItem[] = [
    {
      label: 'Wallet Balance',
      value: fmtBalance,
      icon: Wallet,
      accent: 'var(--accent)',
      accentDim: 'var(--accent-dim)',
    },
    {
      label: 'Vault TVL',
      value: fmtTvl,
      icon: TrendingUp,
      accent: 'var(--success)',
      accentDim: 'var(--success-dim)',
    },
    {
      label: 'Total Invoices',
      value: totalData != null ? String(totalData) : '—',
      icon: FileText,
      accent: 'var(--muted)',
      accentDim: 'var(--surface-muted)',
    },
    {
      label: 'As Buyer',
      value: String(buyerCount),
      icon: Building2,
      accent: 'var(--accent)',
      accentDim: 'var(--accent-dim)',
    },
    {
      label: 'As Supplier',
      value: String(supplierCount),
      icon: Users,
      accent: 'var(--success)',
      accentDim: 'var(--success-dim)',
    },
  ]

  return (
    <div className="space-y-3">

      {/* ── Post Invoice CTA ── */}
      <button
        onClick={onPost}
        className="btn btn-primary btn-lg w-full"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <Plus className="size-5" />
        Post Invoice
      </button>

      {/* ── Tab navigation ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="p-1 flex flex-col gap-0.5">
          {([
            { id: 'buyer',    label: 'Buyer View',    sub: `${buyerCount} invoices`, icon: Building2 },
            { id: 'supplier', label: 'Supplier View', sub: `${supplierCount} invoices`, icon: Users },
          ] as { id: Tab; label: string; sub: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[]).map(({ id, label, sub, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: activeTab === id ? 'var(--surface-strong)' : 'transparent',
                border: activeTab === id ? '1px solid var(--border-strong)' : '1px solid transparent',
              }}
            >
              <div
                className="size-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: activeTab === id ? 'var(--accent-dim)' : 'var(--surface-muted)',
                  border: activeTab === id ? '1px solid rgba(172,198,233,0.2)' : '1px solid transparent',
                }}
              >
                <Icon className="size-4" style={{ color: activeTab === id ? 'var(--accent)' : 'var(--subtle)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: activeTab === id ? 'var(--ink)' : 'var(--muted)' }}>
                  {label}
                </div>
                <div className="text-xs" style={{ color: 'var(--subtle)' }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats panel ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <TrendingUp className="size-3.5" style={{ color: 'var(--subtle)' }} />
          <span className="label-caps">Overview</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {stats.map(({ label, value, icon: Icon, accent, accentDim }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <div
                className="size-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: accentDim }}
              >
                <Icon className="size-3.5" style={{ color: accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs" style={{ color: 'var(--subtle)' }}>{label}</div>
                <div className="display text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <Info className="size-3.5" style={{ color: 'var(--subtle)' }} />
          <span className="label-caps">How it works</span>
        </div>
        <div className="p-4 space-y-4">
          {[
            { n: '1', title: 'Buyer posts invoice', desc: 'Locks max rebate as USDC collateral. Sets up to 3 time-decaying discount tiers.' },
            { n: '2', title: 'Supplier settles early', desc: 'Pays face value minus active discount. Receives rebate from vault. Earlier = more savings.' },
            { n: '3', title: 'Auto-expire', desc: 'If deadline passes, anyone triggers expiry and collateral returns to buyer.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-3">
              <div
                className="size-5 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-bold display mt-0.5"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
              >
                {n}
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--ink-2)' }}>{title}</p>
                <p className="text-xs text-pretty" style={{ color: 'var(--subtle)', lineHeight: 1.55 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
