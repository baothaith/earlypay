# Design System

## Theme: Arc Dark

Dark-first B2B SaaS aesthetic. Deep navy backgrounds, steel-blue accent, high-contrast ink.
All tokens are CSS custom properties defined in `src/index.css`.

---

## Color Tokens

### Canvas
| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#080f1c` | Page background base |
| `--bg-mid` | `#0d1b2f` | Secondary background |
| `--bg-gradient` | `linear-gradient(160deg, #090e1b, #0d1b2f, #0f2340)` | Body background |

### Surfaces
| Token | Value | Usage |
|---|---|---|
| `--surface` | `rgba(255,255,255,0.055)` | Card/panel background |
| `--surface-hover` | `rgba(255,255,255,0.085)` | Card hover state |
| `--surface-strong` | `rgba(255,255,255,0.10)` | Active tab / selected state |
| `--surface-muted` | `#141f30` | Input background, muted areas |
| `--surface-inset` | `#0c1724` | Modal body, inset panels |

### Borders
| Token | Value | Usage |
|---|---|---|
| `--border` | `rgba(255,255,255,0.09)` | Default card/input border |
| `--border-strong` | `rgba(172,198,233,0.30)` | Active/focused border |
| `--border-accent` | `rgba(172,198,233,0.50)` | Input focus ring |

### Ink (text)
| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#f4f7fc` | Primary text |
| `--ink-2` | `#d8e5f5` | Secondary headings |
| `--muted` | `#a8bdd6` | Labels, secondary text |
| `--subtle` | `#637a96` | Tertiary text, placeholders |
| `--ghost` | `#3a4e65` | Disabled, placeholder |

### Brand Accent (steel blue)
| Token | Hex | Usage |
|---|---|---|
| `--accent` | `#acc6e9` | Primary buttons, active states, key numbers |
| `--accent-dim` | `rgba(172,198,233,0.15)` | Accent backgrounds |
| `--accent-hover` | `#c5d8f5` | Button hover |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| `--success` | `#6ecf86` | Active tier, settled state |
| `--success-dim` | `rgba(110,207,134,0.12)` | Success backgrounds |
| `--success-border` | `rgba(110,207,134,0.25)` | Success card borders |
| `--danger` | `#e0606e` | Expired/overdue, danger actions |
| `--danger-dim` | `rgba(224,96,110,0.12)` | Danger backgrounds |
| `--danger-border` | `rgba(224,96,110,0.25)` | Danger borders |
| `--warning` | `#f0bc55` | Wrong-chain banner |
| `--warning-dim` | `rgba(240,188,85,0.10)` | Warning backgrounds |
| `--warning-border` | `rgba(240,188,85,0.28)` | Warning borders |

---

## Typography

### Font stack
| Role | Font | Fallback |
|---|---|---|
| Body | DM Sans | Inter, sans-serif |
| Display / numbers | Space Grotesk | DM Sans, sans-serif |
| Monospace | JetBrains Mono | Menlo, monospace |

### CSS helpers
| Class | Description |
|---|---|
| `.display` | Space Grotesk, `letter-spacing: -0.03em`, `font-feature-settings: 'ss01' 1` |
| `.mono` | JetBrains Mono, `font-feature-settings: 'zero' 1` |
| `.label-caps` | 10px, 600 weight, `letter-spacing: 0.08em`, uppercase, `--subtle` color |

Base body: 14px / 1.5 line-height, `-webkit-font-smoothing: antialiased`.

---

## Spacing & Radius

| Token | Value |
|---|---|
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 20px |
| `--radius-2xl` | 24px |

---

## Shadows

| Token | Usage |
|---|---|
| `--shadow-sm` | Subtle card lift |
| `--shadow-md` | Panel elevation |
| `--shadow-lg` | Modal/dialog |
| `--shadow-sheet` | Bottom sheet / modal overlay |

---

## Layout Constants

| Token | Value | Usage |
|---|---|---|
| `--navbar-h` | 56px | Sticky navbar height |
| `--sidebar-w` | 272px | Left sidebar width (lg+) |
| Max content width | 1440px | Dashboard container |

---

## Component Classes

### Buttons
```
.btn          base: 36px height, 13px, 600 weight, rounded-md
.btn-primary  accent bg, dark text, hover glow
.btn-ghost    transparent bg, muted text, border
.btn-danger   danger-dim bg, danger text, danger border
.btn-sm       30px height, 12px, rounded-sm
.btn-lg       44px height, 14px, rounded-lg
.btn-xl       52px height, 15px, rounded-xl
```

### Badges
```
.badge          base pill: 11px, 600 weight, inline-flex
.badge-success  success-dim bg, success text + border
.badge-accent   accent-dim bg, accent text + border
.badge-muted    surface-muted bg, muted text + border
.badge-danger   danger-dim bg, danger text + border
.badge-warning  warning-dim bg, warning text + border
```

### Structural
```
.invoice-row    Card with hover: surface bg, border, rounded-xl, overflow-hidden
.stat-card      Stat tile: surface bg, border, rounded-lg, hover
.sidebar-sticky Sticky sidebar: top = navbar-h + 24px, max-height = 100dvh - navbar-h - 48px
```

---

## Logo System

| Asset | File | Usage |
|---|---|---|
| Primary (mark + wordmark) | `public/logo-primary.svg` | Dark backgrounds |
| Primary light | `public/logo-primary-light.svg` | Light backgrounds |
| Mark only | `public/logo-mark.svg` | Icons, favicons |
| Monochrome | `public/logo-mono.svg` | Single-color contexts |
| Favicon | `public/favicon.svg` | Browser tab |
| React component | `src/components/Logo.tsx` | `<EarlyPayLogo>`, `<LogoMark>` |

Concept: two vertical brackets (payment window) + forward chevron (early settlement).
Never use generic blockchain/Ethereum icons for branding.
