/**
 * DocsViewer — in-app documentation browser.
 * Renders markdown files from /docs/ (EN) and /docs/vi/ (VI) using `marked`.
 * Language toggle persists to localStorage['ep-docs-lang'].
 * Navigation: sidebar list of all docs, main panel renders the selected doc.
 * Accessible at /#/docs (hash-based, no router dependency).
 */
import { useState, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import { BookOpen, ChevronLeft, Menu, X, ExternalLink, Languages } from 'lucide-react'
import { EarlyPayLogo } from '@/components/Logo'

// ── English docs (inline at build time via Vite ?raw) ─────────────────────
import enDoc00 from '../../docs/00-index.md?raw'
import enDoc01 from '../../docs/01-overview.md?raw'
import enDoc02 from '../../docs/02-features.md?raw'
import enDoc03 from '../../docs/03-feature-specs.md?raw'
import enDoc04 from '../../docs/04-tech-stack.md?raw'
import enDoc05 from '../../docs/05-design-system.md?raw'
import enDoc06 from '../../docs/06-ui-ux-guidelines.md?raw'
import enDoc07 from '../../docs/07-naming-conventions.md?raw'
import enDoc08 from '../../docs/08-coding-style.md?raw'
import enDoc09 from '../../docs/09-coding-rules.md?raw'
import enDoc10 from '../../docs/10-commit-conventions.md?raw'
import enDoc11 from '../../docs/11-code-review.md?raw'
import enDoc12 from '../../docs/12-quality-standards.md?raw'

// ── Vietnamese docs ───────────────────────────────────────────────────────
import viDoc00 from '../../docs/vi/00-index.md?raw'
import viDoc01 from '../../docs/vi/01-overview.md?raw'
import viDoc02 from '../../docs/vi/02-features.md?raw'
import viDoc03 from '../../docs/vi/03-feature-specs.md?raw'
import viDoc04 from '../../docs/vi/04-tech-stack.md?raw'
import viDoc05 from '../../docs/vi/05-design-system.md?raw'
import viDoc06 from '../../docs/vi/06-ui-ux-guidelines.md?raw'
import viDoc07 from '../../docs/vi/07-naming-conventions.md?raw'
import viDoc08 from '../../docs/vi/08-coding-style.md?raw'
import viDoc09 from '../../docs/vi/09-coding-rules.md?raw'
import viDoc10 from '../../docs/vi/10-commit-conventions.md?raw'
import viDoc11 from '../../docs/vi/11-code-review.md?raw'
import viDoc12 from '../../docs/vi/12-quality-standards.md?raw'

type Lang = 'en' | 'vi'

interface DocMeta {
  id: string
  titleEn: string
  titleVi: string
  en: string
  vi: string
}

const DOCS: DocMeta[] = [
  { id: '00', titleEn: 'Index',                  titleVi: 'Mục Lục',            en: enDoc00, vi: viDoc00 },
  { id: '01', titleEn: 'Overview & Goals',       titleVi: 'Tổng Quan & Mục Tiêu', en: enDoc01, vi: viDoc01 },
  { id: '02', titleEn: 'Features',               titleVi: 'Tính Năng',          en: enDoc02, vi: viDoc02 },
  { id: '03', titleEn: 'Feature Specs',          titleVi: 'Đặc Tả Tính Năng',  en: enDoc03, vi: viDoc03 },
  { id: '04', titleEn: 'Tech Stack',             titleVi: 'Tech Stack',         en: enDoc04, vi: viDoc04 },
  { id: '05', titleEn: 'Design System',          titleVi: 'Design System',      en: enDoc05, vi: viDoc05 },
  { id: '06', titleEn: 'UI/UX Guidelines',       titleVi: 'Hướng Dẫn UI/UX',   en: enDoc06, vi: viDoc06 },
  { id: '07', titleEn: 'Naming Conventions',     titleVi: 'Quy Ước Đặt Tên',   en: enDoc07, vi: viDoc07 },
  { id: '08', titleEn: 'Coding Style',           titleVi: 'Phong Cách Code',    en: enDoc08, vi: viDoc08 },
  { id: '09', titleEn: 'Coding Rules',           titleVi: 'Quy Tắc Code',       en: enDoc09, vi: viDoc09 },
  { id: '10', titleEn: 'Commit Conventions',     titleVi: 'Quy Ước Commit',     en: enDoc10, vi: viDoc10 },
  { id: '11', titleEn: 'Code Review',            titleVi: 'Quy Trình Review',   en: enDoc11, vi: viDoc11 },
  { id: '12', titleEn: 'Quality Standards',      titleVi: 'Tiêu Chuẩn Chất Lượng', en: enDoc12, vi: viDoc12 },
]

const LANG_STORAGE_KEY = 'ep-docs-lang'

function getSavedLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (saved === 'en' || saved === 'vi') return saved
  } catch { /* ignore */ }
  return 'en'
}

// Configure marked
marked.setOptions({ gfm: true, breaks: false })

interface Props {
  onClose: () => void
}

export function DocsViewer({ onClose }: Props) {
  const [activeId, setActiveId]   = useState('00')
  const [navOpen, setNavOpen]     = useState(false)
  const [lang, setLangState]      = useState<Lang>(getSavedLang)

  function setLang(l: Lang) {
    setLangState(l)
    try { localStorage.setItem(LANG_STORAGE_KEY, l) } catch { /* ignore */ }
    document.getElementById('docs-content')?.scrollTo({ top: 0 })
  }

  // Parse markdown once per doc+lang combo
  const html = useMemo(() => {
    const doc = DOCS.find((d) => d.id === activeId)
    if (!doc) return ''
    return marked.parse(doc[lang]) as string
  }, [activeId, lang])

  function selectDoc(id: string) {
    setActiveId(id)
    setNavOpen(false)
    document.getElementById('docs-content')?.scrollTo({ top: 0 })
  }

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const activeDoc = DOCS.find((d) => d.id === activeId)
  const activeTitle = activeDoc ? (lang === 'vi' ? activeDoc.titleVi : activeDoc.titleEn) : ''
  const docsLabel   = lang === 'vi' ? 'Tài Liệu' : 'Documentation'
  const backLabel   = lang === 'vi' ? 'Quay Lại' : 'Back to App'
  const contentsLabel = lang === 'vi' ? 'Nội Dung' : 'Contents'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      {/* ── Top bar ── */}
      <header
        className="flex items-center gap-2 px-3 lg:px-5 flex-shrink-0"
        style={{
          height: 'var(--navbar-h)',
          background: 'var(--navbar-bg-docs)',
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
        <button onClick={onClose} className="btn btn-ghost btn-sm gap-1.5 flex-shrink-0">
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </button>

        <div className="w-px h-5 flex-shrink-0" style={{ background: 'var(--border)' }} />

        {/* Logo + breadcrumb */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <EarlyPayLogo height={20} />
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="size-3.5 flex-shrink-0" style={{ color: 'var(--subtle)' }} />
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--muted)' }}>
              {docsLabel}
            </span>
            {activeDoc && (
              <>
                <span style={{ color: 'var(--ghost)' }}>/</span>
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--ink-2)' }}>
                  {activeTitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Language Toggle ── */}
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5 flex-shrink-0"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
          role="group"
          aria-label="Select language"
        >
          <button
            onClick={() => setLang('en')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
            style={{
              background: lang === 'en' ? 'var(--surface-strong)' : 'transparent',
              color: lang === 'en' ? 'var(--ink)' : 'var(--subtle)',
              border: lang === 'en' ? '1px solid var(--border-strong)' : '1px solid transparent',
            }}
            aria-pressed={lang === 'en'}
            title="English"
          >
            <Languages className="size-3" />
            EN
          </button>
          <button
            onClick={() => setLang('vi')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
            style={{
              background: lang === 'vi' ? 'var(--surface-strong)' : 'transparent',
              color: lang === 'vi' ? 'var(--ink)' : 'var(--subtle)',
              border: lang === 'vi' ? '1px solid var(--border-strong)' : '1px solid transparent',
            }}
            aria-pressed={lang === 'vi'}
            title="Tiếng Việt"
          >
            <Languages className="size-3" />
            VI
          </button>
        </div>

        {/* GitHub link */}
        <a
          href="https://github.com/baothaith/earlypay"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-sm hidden sm:inline-flex gap-1.5 flex-shrink-0"
          style={{ color: 'var(--subtle)' }}
        >
          <ExternalLink className="size-3.5" />
          GitHub
        </a>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* ── Sidebar nav ── */}
        <nav
          className={`
            flex-shrink-0 overflow-y-auto
            ${navOpen ? 'flex' : 'hidden'} lg:flex
            flex-col
          `}
          style={{
            width: '248px',
            background: 'var(--surface-panel)',
            borderRight: '1px solid var(--border)',
            ...(navOpen ? {
              position: 'absolute' as const,
              inset: 0,
              zIndex: 10,
              width: '100%',
            } : {}),
          }}
        >
          <div className="p-3 space-y-0.5">
            <div className="label-caps px-3 py-2 mb-1">{contentsLabel}</div>
            {DOCS.map((doc) => {
              const title = lang === 'vi' ? doc.titleVi : doc.titleEn
              return (
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
                  {title}
                </button>
              )
            })}
          </div>
        </nav>

        {/* ── Main content ── */}
        <main
          id="docs-content"
          className="flex-1 overflow-y-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-10"
          style={{ maxWidth: '860px' }}
          lang={lang === 'vi' ? 'vi' : 'en'}
        >
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
        .docs-content input[type="checkbox"] { margin-right: 6px; }
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
