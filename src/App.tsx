import { useState, useEffect, useMemo } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Plus, RefreshCw, AlertTriangle, LayoutDashboard, BookOpen, Sun, Moon, Copy, Check } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

import { useInvoiceList } from '@/hooks/useInvoiceList'
import { InvoiceCard } from '@/components/InvoiceCard'
import { PostInvoiceSheet } from '@/components/PostInvoiceSheet'
import { Sidebar } from '@/components/Sidebar'
import { DashboardSummary } from '@/components/DashboardSummary'
import { EarlyPayLogo, LogoMark } from '@/components/Logo'
import { DocsViewer } from '@/components/DocsViewer'
import { Footer } from '@/components/Footer'
import { ARC_TESTNET_CHAIN_ID } from '@/lib/constants'
import { InvoiceData } from '@/lib/discountVault'

type Tab         = 'buyer' | 'supplier'
type FilterState = 'ALL' | 'OPEN' | 'SETTLED' | 'EXPIRED'

const FILTER_LABELS: { id: FilterState; label: string }[] = [
  { id: 'ALL',     label: 'All' },
  { id: 'OPEN',    label: 'Open' },
  { id: 'SETTLED', label: 'Settled' },
  { id: 'EXPIRED', label: 'Expired' },
]

const _NOW_SECS = BigInt(Math.floor(Date.now() / 1000))

/** Small copy-address button used in navbar/empty state */
function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  function handle() {
    void navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button
      onClick={handle}
      className="btn btn-ghost btn-sm gap-1.5"
      title="Copy wallet address"
      aria-label={copied ? 'Copied!' : 'Copy your wallet address'}
    >
      {copied ? <Check className="size-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="size-3.5" />}
      <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy Address'}</span>
    </button>
  )
}

export default function App() {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrongChain = isConnected && chainId !== ARC_TESTNET_CHAIN_ID
  const { theme, toggleTheme } = useTheme()

  const [tab,    setTab]    = useState<Tab>('buyer')
  const [filter, setFilter] = useState<FilterState>('ALL')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Reset filter when switching tabs
  function handleTabChange(t: Tab) { setTab(t); setFilter('ALL') }

  // Hash-based docs route
  const [docsOpen, setDocsOpen] = useState(() => window.location.hash === '#/docs')
  useEffect(() => {
    const handler = () => setDocsOpen(window.location.hash === '#/docs')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  function openDocs()  { window.location.hash = '#/docs' }
  function closeDocs() { window.location.hash = '' }

  const buyerData    = useInvoiceList(address, 'buyer')
  const supplierData = useInvoiceList(address, 'supplier')

  const activeData = tab === 'buyer' ? buyerData : supplierData
  const role       = tab === 'buyer' ? 'buyer' : 'supplier'

  function handleRefresh() {
    buyerData.refetch()
    supplierData.refetch()
  }

  // Filtered invoices for the feed
  const filteredInvoices = useMemo<InvoiceData[]>(() => {
    const list = activeData.invoices
    if (filter === 'ALL') return list
    if (filter === 'OPEN') {
      // OPEN = state is OPEN (includes overdue — they are technically OPEN until expired on-chain)
      return list.filter((i) => i.state === 'OPEN')
    }
    return list.filter((i) => i.state === filter)
  }, [activeData.invoices, filter])

  // Count per state for filter pill badges
  const stateCounts = useMemo(() => {
    const list = activeData.invoices
    return {
      ALL:     list.length,
      OPEN:    list.filter((i) => i.state === 'OPEN').length,
      SETTLED: list.filter((i) => i.state === 'SETTLED').length,
      EXPIRED: list.filter((i) => i.state === 'EXPIRED').length,
    }
  }, [activeData.invoices])

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-gradient)' }}>

      {/* ── Navbar ── */}
      <header
        className="flex items-center justify-between px-5 lg:px-8 gap-4 flex-shrink-0"
        style={{
          height: 'var(--navbar-h)',
          background: 'var(--navbar-bg)',
          backdropFilter: 'blur(28px)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <EarlyPayLogo height={24} />
          <span
            className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md font-medium"
            style={{ background: 'var(--surface-muted)', color: 'var(--subtle)', border: '1px solid var(--border)' }}
          >
            <span className="size-1.5 rounded-full inline-block" style={{ background: 'var(--success)' }} />
            Arc Testnet
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm size-8 p-0"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
          </button>

          <button onClick={openDocs} className="btn btn-ghost btn-sm gap-1.5" title="Documentation">
            <BookOpen className="size-3.5" />
            <span className="hidden md:inline">Docs</span>
          </button>

          {isConnected && address && (
            <>
              <CopyAddressButton address={address} />
              <button onClick={handleRefresh} className="btn btn-ghost btn-sm" title="Refresh invoices">
                <RefreshCw className="size-3.5" />
                <span className="hidden md:inline">Refresh</span>
              </button>
              <button onClick={() => setSheetOpen(true)} className="btn btn-primary">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Post Invoice</span>
              </button>
            </>
          )}
          <ConnectKitButton />
        </div>
      </header>

      {/* ── Wrong-chain banner (blocks interaction) ── */}
      {wrongChain && (
        <div
          className="flex items-center gap-3 px-5 lg:px-8 py-2.5 text-sm"
          style={{ background: 'var(--warning-dim)', borderBottom: '1px solid var(--warning-border)' }}
        >
          <AlertTriangle className="size-4 flex-shrink-0" style={{ color: 'var(--warning)' }} />
          <span style={{ color: 'var(--warning)' }}>
            You're on the wrong network. Switch to <strong>Arc Testnet</strong> to interact with invoices.
          </span>
          <button
            onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
            className="btn btn-sm ml-auto flex-shrink-0"
            style={{ background: 'var(--warning)', color: 'var(--on-accent)' }}
          >
            Switch Network
          </button>
        </div>
      )}

      {/* ── Body ── */}
      {!isConnected ? (

        /* ── Landing ── */
        <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
          <div
            className="w-full max-w-lg rounded-3xl p-10 text-center space-y-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div
              className="mx-auto size-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-strong)' }}
            >
              <LogoMark size={46} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <EarlyPayLogo variant="primary" height={36} />
              <p className="text-sm max-w-xs mx-auto text-pretty" style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
                Post invoices with time-decaying USDC rebate tiers. Suppliers settle early
                and claim collateral-backed discounts. Fully automated, no approvers.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['Trustless collateral lock', 'Time-decay tiers', 'Auto-expire refund'].map((label) => (
                <span key={label} className="badge badge-muted">
                  <span className="size-1.5 rounded-full inline-block flex-shrink-0" style={{ background: 'var(--success)' }} />
                  {label}
                </span>
              ))}
            </div>
            <div className="pt-2">
              <ConnectKitButton label="Connect wallet to start" />
            </div>
            <div className="pt-4 text-left space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="label-caps mb-3">How it works</div>
              {[
                { n: '1', title: 'Buyer posts invoice', desc: 'Locks max possible rebate as USDC collateral and sets up to 3 time-decaying discount tiers.' },
                { n: '2', title: 'Supplier settles early', desc: 'Pays face value minus active tier discount. Receives rebate from vault. Earlier = more savings.' },
                { n: '3', title: 'Auto-expire', desc: 'If deadline passes unsettled, anyone triggers expiry and collateral returns to the buyer.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-3">
                  <div
                    className="size-6 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold display"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-strong)' }}
                  >
                    {n}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ink-2)' }}>{title}</p>
                    <p className="text-xs text-pretty" style={{ color: 'var(--subtle)', lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : (

        /* ── Dashboard ── */
        <div
          className="flex-1 w-full mx-auto px-4 sm:px-5 lg:px-8 py-6 lg:py-8"
          style={{ maxWidth: '1440px' }}
        >
          <style>{`
            @media (min-width: 1024px) {
              .dashboard-grid { grid-template-columns: var(--sidebar-w) 1fr !important; }
            }
          `}</style>
          <div
            className="dashboard-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }}
          >
            {/* Sidebar */}
            <aside className="sidebar-sticky">
              <Sidebar
                buyerCount={buyerData.count}
                supplierCount={supplierData.count}
                activeTab={tab}
                onTabChange={handleTabChange}
                onPost={() => setSheetOpen(true)}
              />
            </aside>

            {/* Main feed */}
            <main className="min-w-0">

              {/* Feed header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="size-4 flex-shrink-0" style={{ color: 'var(--subtle)' }} />
                  <h2 className="display font-semibold text-base" style={{ color: 'var(--ink)' }}>
                    {tab === 'buyer' ? 'Invoices Posted' : 'Invoices to Settle'}
                  </h2>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    {activeData.count}
                  </span>
                </div>
                {/* Mobile tab switcher */}
                <div
                  className="flex lg:hidden rounded-xl p-0.5 gap-0.5"
                  style={{ background: 'var(--surface-muted)' }}
                >
                  {(['buyer', 'supplier'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTabChange(t)}
                      className="rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all"
                      style={{
                        background: tab === t ? 'var(--surface-strong)' : 'transparent',
                        color: tab === t ? 'var(--ink)' : 'var(--subtle)',
                        border: tab === t ? '1px solid var(--border-strong)' : '1px solid transparent',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard summary (only when invoices loaded) */}
              {!activeData.isLoading && activeData.invoices.length > 0 && (
                <DashboardSummary tab={tab} invoices={activeData.invoices} />
              )}

              {/* Wrong-network dim overlay on invoice list */}
              <div className="relative">
                {wrongChain && (
                  <div
                    className="absolute inset-0 z-10 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(2px)' }}
                  >
                    <div className="text-center space-y-3 p-6">
                      <AlertTriangle className="size-8 mx-auto" style={{ color: 'var(--warning)' }} />
                      <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>
                        Switch to Arc Testnet to view and interact with invoices
                      </p>
                      <button
                        onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
                        className="btn btn-sm mx-auto"
                        style={{ background: 'var(--warning)', color: 'var(--on-accent)' }}
                      >
                        Switch Network
                      </button>
                    </div>
                  </div>
                )}

                {/* Filter pills */}
                {!activeData.isLoading && activeData.invoices.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {FILTER_LABELS.map(({ id, label }) => {
                      const count = stateCounts[id]
                      const active = filter === id
                      return (
                        <button
                          key={id}
                          onClick={() => setFilter(id)}
                          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                          style={{
                            background: active ? 'var(--surface-strong)' : 'var(--surface)',
                            color: active ? 'var(--ink)' : 'var(--muted)',
                            border: active ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                          }}
                          aria-pressed={active}
                        >
                          {label}
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{
                              background: active ? 'var(--accent-dim)' : 'var(--surface-muted)',
                              color: active ? 'var(--accent)' : 'var(--subtle)',
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Invoice list / states */}
                {activeData.isLoading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-16 rounded-2xl skeleton-shimmer"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>

                ) : activeData.invoices.length === 0 ? (
                  /* Empty state — no invoices at all */
                  <div
                    className="rounded-2xl p-10 text-center space-y-4"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="mx-auto size-12 rounded-2xl flex items-center justify-center"
                      style={{ background: 'var(--surface-muted)' }}
                    >
                      <LayoutDashboard className="size-5" style={{ color: 'var(--ghost)' }} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                        {tab === 'buyer' ? 'No invoices posted yet' : 'No invoices assigned to you'}
                      </p>
                      <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--subtle)', lineHeight: 1.6 }}>
                        {tab === 'buyer'
                          ? 'Post your first invoice to lock collateral and offer early-payment discounts to your supplier.'
                          : 'Invoices where you are the registered supplier will appear here. Share your wallet address with buyers to be assigned.'}
                      </p>
                    </div>
                    {tab === 'buyer' ? (
                      <button onClick={() => setSheetOpen(true)} className="btn btn-primary btn-sm mx-auto">
                        <Plus className="size-3.5" /> Post Invoice
                      </button>
                    ) : (
                      address && (
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <code
                            className="mono text-xs px-3 py-1.5 rounded-lg"
                            style={{ background: 'var(--surface-muted)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                          >
                            {address}
                          </code>
                          <CopyAddressButton address={address} />
                        </div>
                      )
                    )}
                  </div>

                ) : filteredInvoices.length === 0 ? (
                  /* Empty state — filter has no results */
                  <div
                    className="rounded-2xl p-8 text-center"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                      No {filter.toLowerCase()} invoices
                    </p>
                    <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                      {filter !== 'ALL' ? (
                        <button
                          onClick={() => setFilter('ALL')}
                          className="underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          Show all {activeData.count} invoices
                        </button>
                      ) : null}
                    </p>
                  </div>

                ) : (
                  <div className="space-y-2.5">
                    {[...filteredInvoices].reverse().map((inv) => (
                      <InvoiceCard
                        key={inv.id.toString()}
                        invoice={inv}
                        role={role}
                        onRefresh={handleRefresh}
                      />
                    ))}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      <PostInvoiceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={() => { setSheetOpen(false); handleRefresh() }}
      />

      <Footer />

      {docsOpen && <DocsViewer onClose={closeDocs} />}
    </div>
  )
}
