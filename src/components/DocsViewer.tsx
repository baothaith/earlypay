/**
 * DocsViewer — in-app documentation browser.
 * Renders markdown files from /docs/ using the `marked` parser.
 * Navigation: sidebar list of all docs, main panel renders the selected doc.
 * Accessible at /#/docs (hash-based, no router dependency).
 */
import { useState, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import { BookOpen, ChevronLeft, Menu, X, ExternalLink } from 'lucide-react'
import { EarlyPayLogo } from '@/components/Logo'

// ── Doc manifest ─────────────────────────────────────────────────────────────
// Each entry maps to a file in /docs/ served as a static asset from /public/docs/
// We copy docs to public/docs/ via a vite plugin alternative: just import as raw text.
// Since Vite can import ?raw, we inline all docs at build time — no network fetch needed.

import doc00 from '../../docs/00-index.md?raw'
import doc01 from '../../docs/01-overview.md?raw'
import doc02 from '../../docs/02-features.md?raw'
import doc03 from '../../docs/03-feature-specs.md?raw'
import doc04 from '../../docs/04-tech-stack.md?raw'
import doc05 from '../../docs/05-design-system.md?raw'
import doc06 from '../../docs/06-ui-ux-guidelines.md?raw'
import doc07 from '../../docs/07-naming-conventions.md?raw'
import doc08 from '../../docs/08-coding-style.md?raw'
import doc09 from '../../docs/09-coding-rules.md?raw'
import doc10 from '../../docs/10-commit-conventions.md?raw'
import doc11 from '../../docs/11-code-review.md?raw'
import doc12 from '../../docs/12-quality-standards.md?raw'

interface DocEntry {
  id: string
  title: string
  content: string
}

const DOCS: DocEntry[] = [
  { id: '00', title: 'Index',                  content: doc00 },
  { id: '01', title: 'Overview & Goals',       content: doc01 },
  { id: '02', title: 'Features',               content: doc02 },
  { id: '03', title: 'Feature Specs',          content: doc03 },
  { id: '04', title: 'Tech Stack',             content: doc04 },
  { id: '05', title: 'Design System',          content: doc05 },
  { id: '06', title: 'UI/UX Guidelines',       content: doc06 },
  { id: '07', title: 'Naming Conventions',     content: doc07 },
  { id: '08', title: 'Coding Style',           content: doc08 },
  { id: '09', title: 'Coding Rules',           content: doc09 },
  { id: '10', title: 'Commit Conventions',     content: doc10 },
  { id: '11', title: 'Code Review',            content: doc11 },
  { id: '12', title: 'Quality Standards',      content: doc12 },
]

// Configure marked
marked.setOptions({ gfm: true, breaks: false })

interface Props {
  onClose: () => void
}

export function DocsViewer({ onClose }: Props) {
  const [activeId, setActiveId] = useState('00')
  const [navOpen, setNavOpen] = useState(false)

  // Parse markdown once per doc
  const html = useMemo(() => {
    const doc = DOCS.find((d) => d.id === activeId)
    if (!doc) return ''
    return marked.parse(doc.content) as string
  }, [activeId])

  // Close mobile nav on doc select
  function selectDoc(id: string) {
    setActiveId(id)
    setNavOpen(false)
    // Scroll content back to top
    document.getElementById('docs-content')?.scrollTo({ top: 0 })
  }

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const activeDoc = DOCS.find((d) => d.id === activeId)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      {/* ── Top bar ── */}
      <header
        className="flex items-center gap-3 px-4 lg:px-6 flex-shrink-0"
        style={{
          height: 'var(--navbar-h)',
          background: 'rgba(8,15,28,0.92)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Mobile nav toggle */}
        <button
          className="btn btn-ghost btn-sm lg:hidden p-0 size-8"
          onClick={() => setNavOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {navOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>

        {/* Back button */}
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm gap-1.5"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Back to App</span>
        </button>

        <div
          className="w-px h-5 flex-shrink-0"
          style={{ background: 'var(--border)' }}
        />

        {/* Logo + title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <EarlyPayLogo height={20} />
          <div
            className="w-px h-4 flex-shrink-0"
            style={{ background: 'var(--border)' }}
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="size-3.5 flex-shrink-0" style={{ color: 'var(--subtle)' }} />
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--muted)' }}>
              Documentation
            </span>
            {activeDoc && (
              <>
                <span style={{ color: 'var(--ghost)' }}>/</span>
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--ink-2)' }}>
                  {activeDoc.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* GitHub link */}
        <a
          href="https://github.com/baothaith/earlypay"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-sm hidden sm:inline-flex gap-1.5"
          style={{ color: 'var(--subtle)' }}
        >
          <ExternalLink className="size-3.5" />
          GitHub
        </a>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* ── Sidebar nav (desktop always visible, mobile overlay) ── */}
        <nav
          className={`
            flex-shrink-0 overflow-y-auto
            ${navOpen ? 'flex' : 'hidden'} lg:flex
            flex-col
          `}
          style={{
            width: '240px',
            background: 'rgba(8,15,28,0.96)',
            borderRight: '1px solid var(--border)',
            // Mobile: absolute overlay
            ...(navOpen ? {
              position: 'absolute' as const,
              inset: 0,
              zIndex: 10,
              width: '100%',
            } : {}),
          }}
        >
          <div className="p-3 space-y-0.5">
            <div className="label-caps px-3 py-2 mb-1">Contents</div>
            {DOCS.map((doc) => (
              <button
                key={doc.id}
                onClick={() => selectDoc(doc.id)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-sm"
                style={{
                  background: activeId === doc.id ? 'var(--surface-strong)' : 'transparent',
                  color: activeId === doc.id ? 'var(--ink)' : 'var(--muted)',
                  border: activeId === doc.id ? '1px solid var(--border-strong)' : '1px solid transparent',
                  fontWeight: activeId === doc.id ? 600 : 400,
                }}
              >
                <span
                  className="mono text-xs flex-shrink-0 tabular-nums"
                  style={{ color: activeId === doc.id ? 'var(--accent)' : 'var(--ghost)' }}
                >
                  {doc.id}
                </span>
                {doc.title}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Main content ── */}
        <main
          id="docs-content"
          className="flex-1 overflow-y-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-10"
          style={{ maxWidth: '860px' }}
        >
          {/* Render markdown as HTML */}
          <div
            className="docs-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </main>
      </div>

      {/* ── Markdown styles (scoped via .docs-content) ── */}
      <style>{`
        .docs-content {
          color: var(--ink-2);
          line-height: 1.75;
          font-size: 14px;
        }
        .docs-content h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.03em;
          margin: 0 0 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .docs-content h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.02em;
          margin: 2rem 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }
        .docs-content h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--ink-2);
          margin: 1.5rem 0 0.5rem;
        }
        .docs-content p {
          margin: 0 0 0.875rem;
          color: var(--muted);
        }
        .docs-content a {
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .docs-content a:hover { color: var(--accent-hover); }
        .docs-content strong { color: var(--ink); font-weight: 600; }
        .docs-content em { color: var(--ink-2); }
        .docs-content ul, .docs-content ol {
          margin: 0 0 0.875rem 1.25rem;
          color: var(--muted);
        }
        .docs-content li { margin-bottom: 0.25rem; }
        .docs-content hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 1.75rem 0;
        }
        /* Tables */
        .docs-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 1.25rem;
          font-size: 13px;
        }
        .docs-content th {
          text-align: left;
          padding: 8px 12px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--subtle);
          background: var(--surface-muted);
          border-bottom: 1px solid var(--border-strong);
        }
        .docs-content td {
          padding: 8px 12px;
          color: var(--muted);
          border-bottom: 1px solid var(--border);
          vertical-align: top;
        }
        .docs-content tr:last-child td { border-bottom: none; }
        .docs-content tbody tr:hover td { background: var(--surface); }
        /* Code */
        .docs-content code {
          font-family: 'JetBrains Mono', 'Menlo', monospace;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 5px;
          background: var(--surface-muted);
          color: var(--accent);
          border: 1px solid var(--border);
        }
        .docs-content pre {
          background: var(--surface-inset);
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          padding: 16px 20px;
          overflow-x: auto;
          margin: 0 0 1.25rem;
        }
        .docs-content pre code {
          background: none;
          border: none;
          padding: 0;
          color: var(--ink-2);
          font-size: 13px;
          line-height: 1.65;
        }
        /* Checkboxes */
        .docs-content input[type="checkbox"] { margin-right: 6px; }
        /* Blockquote */
        .docs-content blockquote {
          border-left: 3px solid var(--accent);
          margin: 0 0 1rem;
          padding: 8px 16px;
          background: var(--accent-dim);
          border-radius: 0 8px 8px 0;
          color: var(--muted);
        }
      `}</style>
    </div>
  )
}
