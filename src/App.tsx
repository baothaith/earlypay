import { useState, useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Plus, RefreshCw, AlertTriangle, LayoutDashboard, BookOpen } from 'lucide-react'

import { useInvoiceList } from '@/hooks/useInvoiceList'
import { InvoiceCard } from '@/components/InvoiceCard'
import { PostInvoiceSheet } from '@/components/PostInvoiceSheet'
import { Sidebar } from '@/components/Sidebar'
import { EarlyPayLogo, LogoMark } from '@/components/Logo'
import { DocsViewer } from '@/components/DocsViewer'
import { ARC_TESTNET_CHAIN_ID } from '@/lib/constants'

type Tab = 'buyer' | 'supplier'

export default function App() {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrongChain = isConnected && chainId !== ARC_TESTNET_CHAIN_ID

  const [tab, setTab] = useState<Tab>('buyer')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Hash-based docs route: #/docs opens the viewer
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

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-gradient)' }}>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 lg:px-8 gap-4 flex-shrink-0"
        style={{
          height: 'var(--navbar-h)',
          background: 'rgba(8,15,28,0.82)',
          backdropFilter: 'blur(28px)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: logo + badge */}
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

        {/* Right: actions */}
        <div className="flex items-center gap-2.5">
          {/* Docs button — always visible */}
          <button
            onClick={openDocs}
            className="btn btn-ghost btn-sm gap-1.5"
            title="Documentation"
          >
            <BookOpen className="size-3.5" />
            <span className="hidden md:inline">Docs</span>
          </button>

          {isConnected && (
            <>
              <button
                onClick={handleRefresh}
                className="btn btn-ghost btn-sm"
                title="Refresh invoices"
              >
                <RefreshCw className="size-3.5" />
                <span className="hidden md:inline">Refresh</span>
              </button>
              <button
                onClick={() => setSheetOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Post Invoice</span>
              </button>
            </>
          )}
          <ConnectKitButton />
        </div>
      </header>

      {/* ── Wrong-chain banner ────────────────────────────────────────────── */}
      {wrongChain && (
        <div
          className="flex items-center gap-3 px-5 lg:px-8 py-2.5 text-sm"
          style={{
            background: 'var(--warning-dim)',
            borderBottom: '1px solid var(--warning-border)',
          }}
        >
          <AlertTriangle className="size-4 flex-shrink-0" style={{ color: 'var(--warning)' }} />
          <span style={{ color: 'var(--warning)' }}>
            Switch to Arc Testnet to interact with invoices.
          </span>
          <button
            onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
            className="btn btn-sm ml-auto"
            style={{ background: 'var(--warning)', color: '#07111f' }}
          >
            Switch Network
          </button>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {!isConnected ? (
        /* ── Landing / connect state ──────────────────────────────────── */
        <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
          <div
            className="w-full max-w-lg rounded-3xl p-10 text-center space-y-6"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Icon */}
            <div
              className="mx-auto size-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(172,198,233,0.07)', border: '1px solid rgba(172,198,233,0.18)' }}
            >
              <LogoMark size={46} />
            </div>

            {/* Logo lockup */}
            <div className="flex flex-col items-center gap-2">
              <EarlyPayLogo variant="primary" height={36} />
              <p className="text-sm max-w-xs mx-auto text-pretty" style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
                Post invoices with time-decaying USDC rebate tiers. Suppliers settle early
                and claim collateral-backed discounts. Fully automated, no approvers.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { icon: '⬡', label: 'Trustless collateral lock' },
                { icon: '↘', label: 'Time-decay tiers' },
                { icon: '↺', label: 'Auto-expire refund' },
              ].map(({ label }) => (
                <span key={label} className="badge badge-muted">
                  <span className="size-1.5 rounded-full inline-block flex-shrink-0" style={{ background: 'var(--success)' }} />
                  {label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-2">
              <ConnectKitButton label="Connect wallet to start" />
            </div>

            {/* How it works */}
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
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(172,198,233,0.2)' }}
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
        /* ── Dashboard: sidebar + main feed ────────────────────────────── */
        <div
          className="flex-1 w-full mx-auto px-4 sm:px-5 lg:px-8 py-6 lg:py-8 gap-6 lg:gap-8"
          style={{
            maxWidth: '1440px',
            display: 'grid',
            gridTemplateColumns: '1fr',
            alignItems: 'start',
          }}
        >
          {/* Apply two-column on lg+ via inline style for server-less SSR compat */}
          <style>{`
            @media (min-width: 1024px) {
              .dashboard-grid { grid-template-columns: var(--sidebar-w) 1fr !important; }
            }
          `}</style>
          <div
            className="dashboard-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px',
              alignItems: 'start',
              width: '100%',
            }}
          >
            {/* ── Sidebar ── */}
            <aside className="sidebar-sticky">
              <Sidebar
                buyerCount={buyerData.count}
                supplierCount={supplierData.count}
                activeTab={tab}
                onTabChange={setTab}
                onPost={() => setSheetOpen(true)}
              />
            </aside>

            {/* ── Main feed ── */}
            <main className="min-w-0 space-y-4">
              {/* Feed header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="size-4" style={{ color: 'var(--subtle)' }} />
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
                      onClick={() => setTab(t)}
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

              {/* Invoice list */}
              {activeData.isLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl animate-pulse"
                      style={{ background: 'var(--surface)', animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </div>
              ) : activeData.invoices.length === 0 ? (
                <div
                  className="rounded-2xl p-12 text-center space-y-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="mx-auto size-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--surface-muted)' }}
                  >
                    <LayoutDashboard className="size-5" style={{ color: 'var(--ghost)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                      {tab === 'buyer' ? 'No invoices posted yet' : 'No invoices assigned to you'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                      {tab === 'buyer'
                        ? 'Post your first invoice to lock collateral and offer early-payment discounts.'
                        : 'Invoices where you are the registered supplier will appear here.'}
                    </p>
                  </div>
                  {tab === 'buyer' && (
                    <button
                      onClick={() => setSheetOpen(true)}
                      className="btn btn-primary btn-sm mx-auto"
                    >
                      <Plus className="size-3.5" /> Post Invoice
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[...activeData.invoices].reverse().map((inv) => (
                    <InvoiceCard
                      key={inv.id.toString()}
                      invoice={inv}
                      role={role}
                      onRefresh={handleRefresh}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* ── Post Invoice Sheet ─────────────────────────────────────────────── */}
      <PostInvoiceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={() => {
          setSheetOpen(false)
          handleRefresh()
        }}
      />

      {/* ── Docs Viewer ──────────────────────────────────────────────────────── */}
      {docsOpen && <DocsViewer onClose={closeDocs} />}
    </div>
  )
}
