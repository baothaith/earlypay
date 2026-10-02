/**
 * EarlyPay Footer
 *
 * Layout (desktop lg+): 4-column grid
 *   Col 1 (wider): brand mark + tagline + social links
 *   Col 2: Product links
 *   Col 3: Resources links
 *   Col 4: Legal links
 *
 * Layout (tablet md–lg): 2×2 grid
 * Layout (mobile <md): single column, stacked
 *
 * Design rules:
 * - Background: --bg (#080f1c) — slightly deeper than the page gradient
 *   to "ground" the footer visually.
 * - Top separator: 1px --border line + subtle upward gradient fade.
 * - Column headings: .label-caps (.subtle color, uppercase, 10px)
 * - Links: --muted text, hover → --accent with 0.15s transition, no underline
 * - Focus: 2px accent outline with 2px offset (keyboard accessible)
 * - Social icon tiles: 32px, surface-muted bg, accent icon on hover
 * - Bottom bar: flex row, copyright left, status dot right
 * - No newsletter/email CTA (no email backend exists in v1)
 */
import { Github, ExternalLink, Zap, Shield, FileText, BookOpen, ArrowRight } from 'lucide-react'
import { EarlyPayLogo } from '@/components/Logo'

const YEAR = new Date().getFullYear()

const CONTRACT_ADDRESS = '0xf8a283ada5c99831b904d058291895d0e38c546b'
const EXPLORER_URL     = `https://explorer.testnet.arc.io/address/${CONTRACT_ADDRESS}`
const GITHUB_URL       = 'https://github.com/baothaith/earlypay'

// ── Nav groups ────────────────────────────────────────────────────────────────

const NAV_PRODUCT = [
  { label: 'Post Invoice',     href: '#',         desc: 'Lock collateral & set discount tiers' },
  { label: 'Settle Early',     href: '#',         desc: 'Pay early, claim your rebate' },
  { label: 'Expire Invoice',   href: '#',         desc: 'Recover collateral after deadline' },
  { label: 'View Contract',    href: EXPLORER_URL, external: true, desc: 'Deployed on Arc Testnet' },
]

const NAV_RESOURCES = [
  { label: 'Documentation',   href: '#/docs',    icon: BookOpen },
  { label: 'How It Works',    href: '#',         icon: Zap },
  { label: 'GitHub',          href: GITHUB_URL,  icon: Github, external: true },
  { label: 'Arc Testnet',     href: 'https://explorer.testnet.arc.io', icon: ExternalLink, external: true },
]

const NAV_LEGAL = [
  { label: 'Terms of Service', href: '#/docs' },
  { label: 'Privacy Policy',   href: '#/docs' },
  { label: 'Smart Contract',   href: EXPLORER_URL, external: true },
  { label: 'Open Source',      href: GITHUB_URL,   external: true },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function FooterLink({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="footer-link"
    >
      {children}
      {external && <ExternalLink className="size-2.5 ml-1 opacity-50 flex-shrink-0" />}
    </a>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer
      aria-label="Site footer"
      style={{
        background: '#080f1c',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
      }}
    >
      {/* Fade gradient bridge between body gradient and footer bg */}
      <div
        aria-hidden="true"
        style={{
          height: 48,
          background: 'linear-gradient(to bottom, transparent, #080f1c)',
          marginTop: -48,
          pointerEvents: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* ── Main content ── */}
      <div
        className="w-full mx-auto px-5 lg:px-8 pt-12 pb-8"
        style={{ maxWidth: '1440px' }}
      >
        {/* 4-col grid on lg+, 2-col on md, 1-col on mobile */}
        <div className="footer-grid">

          {/* ── Col 1: Brand ── */}
          <div className="footer-brand-col space-y-5">
            <div>
              <EarlyPayLogo height={26} />
              <p
                className="mt-3 text-sm leading-relaxed text-pretty max-w-[240px]"
                style={{ color: 'var(--subtle)' }}
              >
                Onchain B2B early-payment discounts. Trustless collateral, time-decay tiers,
                no approvers.
              </p>
            </div>

            {/* Status pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{
                background: 'var(--success-dim)',
                border: '1px solid var(--success-border)',
                color: 'var(--success)',
              }}
            >
              <span className="size-1.5 rounded-full bg-current animate-pulse flex-shrink-0" />
              Arc Testnet — Live
            </div>

            {/* Social row */}
            <div className="flex items-center gap-2" role="list" aria-label="Social links">
              {/* GitHub */}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="listitem"
                aria-label="GitHub repository"
                className="footer-social-btn"
              >
                <Github className="size-4" />
              </a>

              {/* Explorer */}
              <a
                href={EXPLORER_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="listitem"
                aria-label="Contract on Arc Explorer"
                className="footer-social-btn"
                title="View contract on Arc Explorer"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          {/* ── Col 2: Product ── */}
          <div className="space-y-4">
            <h3 className="label-caps">Product</h3>
            <ul className="space-y-3" role="list">
              {NAV_PRODUCT.map(({ label, href, external }) => (
                <li key={label}>
                  <FooterLink href={href} external={external}>
                    {label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Resources ── */}
          <div className="space-y-4">
            <h3 className="label-caps">Resources</h3>
            <ul className="space-y-3" role="list">
              {NAV_RESOURCES.map(({ label, href, external }) => (
                <li key={label}>
                  <FooterLink href={href} external={external}>
                    {label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4: Legal ── */}
          <div className="space-y-4">
            <h3 className="label-caps">Legal</h3>
            <ul className="space-y-3" role="list">
              {NAV_LEGAL.map(({ label, href, external }) => (
                <li key={label}>
                  <FooterLink href={href} external={external}>
                    {label}
                  </FooterLink>
                </li>
              ))}
            </ul>

            {/* Contract address tile */}
            <div
              className="mt-5 rounded-xl p-3 space-y-1"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <div className="label-caps flex items-center gap-1.5">
                <Shield className="size-3" />
                Contract
              </div>
              <a
                href={EXPLORER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-xs flex items-center gap-1 group"
                style={{ color: 'var(--accent)' }}
                aria-label="View deployed contract on explorer"
              >
                <span className="truncate">{CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)}</span>
                <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
              <p className="text-xs" style={{ color: 'var(--ghost)' }}>Arc Testnet · DiscountVault</p>
            </div>
          </div>

        </div>

        {/* ── Divider ── */}
        <hr className="divider mt-10 mb-6" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Copyright */}
          <p className="text-xs" style={{ color: 'var(--ghost)' }}>
            © {YEAR} EarlyPay. Built on{' '}
            <a
              href="https://arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link-inline"
            >
              Arc
            </a>{' '}
            with{' '}
            <a
              href="https://studio.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link-inline"
            >
              Arc Studio
            </a>
            . Smart contract audited and deployed on Arc Testnet.
          </p>

          {/* Right: legal inline links */}
          <div className="flex items-center gap-4 text-xs flex-shrink-0">
            <a href="#/docs" className="footer-link-inline">
              <FileText className="size-3 mr-1 inline" />
              Terms
            </a>
            <a href="#/docs" className="footer-link-inline">
              Privacy
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link-inline"
            >
              Open Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
