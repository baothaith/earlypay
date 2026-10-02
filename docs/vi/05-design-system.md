# Design System

## Tổng Quan

EarlyPay sử dụng hệ thống CSS custom properties (tokens) toàn cục, được định nghĩa trong `src/index.css`.
Tất cả component sử dụng tokens thay vì màu sắc hard-coded.
Dark Mode là chế độ mặc định; Light Mode dùng selector `[data-theme="light"]`.

---

## Tokens Màu Sắc

### Nền (Backgrounds)

| Token | Dark | Light | Mục đích |
|---|---|---|---|
| `--bg` | `#0d1b2f` | `#f0f4fa` | Canvas trang chính |
| `--surface` | `#0f2033` | `#e8eef8` | Card bề mặt |
| `--surface-muted` | `#0c1d30` | `#dde5f2` | Nền mờ nhạt |
| `--surface-strong` | `#162840` | `#d4ddf0` | Nền nổi bật |
| `--surface-inset` | `#080f1c` | `#ccd6eb` | Code blocks, inset |
| `--surface-panel` | `rgba(10,20,36,0.97)` | `rgba(240,244,250,0.97)` | Modal/Sheet |
| `--navbar-bg` | `rgba(8,15,28,0.82)` | `rgba(240,244,250,0.82)` | Header |
| `--footer-bg` | `#080f1c` | `#dde5f2` | Footer |
| `--overlay-bg` | `rgba(4,9,18,0.72)` | `rgba(180,196,224,0.72)` | Overlay modal |

### Màu Chữ

| Token | Dark | Light | Mục đích |
|---|---|---|---|
| `--ink` | `#f9faf3` | `#0d1b2f` | Chữ chính, tiêu đề |
| `--ink-2` | `#e2e8f0` | `#1e3a5f` | Chữ phụ |
| `--muted` | `#94a3b8` | `#334e6b` | Nhãn, mô tả |
| `--subtle` | `#64748b` | `#4a6484` | Chữ nhạt |
| `--ghost` | `#3d5166` | `#7a95b2` | Chữ rất nhạt |

### Màu Nhấn (Accent)

| Token | Dark | Light | Mục đích |
|---|---|---|---|
| `--accent` | `#acc6e9` | `#1d5ca8` | Màu thương hiệu chính |
| `--accent-hover` | `#cbd8f0` | `#2a71c8` | Hover trên accent |
| `--accent-dim` | `rgba(172,198,233,0.1)` | `rgba(29,92,168,0.1)` | Nền accent mờ |

### Viền (Borders)

| Token | Dark | Light | Mục đích |
|---|---|---|---|
| `--border` | `rgba(172,198,233,0.1)` | `rgba(29,92,168,0.15)` | Viền nhẹ mặc định |
| `--border-strong` | `rgba(172,198,233,0.2)` | `rgba(29,92,168,0.25)` | Viền active/selected |

### Trạng Thái (Status)

| Token | Dark | Light | Mục đích |
|---|---|---|---|
| `--success` | `#6ecf86` | `#1a9e3c` | Màu thành công |
| `--success-border` | `rgba(110,207,134,0.2)` | `rgba(26,158,60,0.2)` | Viền thành công |
| `--success-dim` | `rgba(110,207,134,0.08)` | `rgba(26,158,60,0.08)` | Nền thành công mờ |
| `--warning` | `#f6c44f` | `#b87c0a` | Màu cảnh báo |
| `--warning-dim` | `rgba(246,196,79,0.1)` | `rgba(184,124,10,0.1)` | Nền cảnh báo mờ |
| `--danger` | `#f07070` | `#c8303e` | Màu nguy hiểm |
| `--danger-dim` | `rgba(240,112,112,0.1)` | `rgba(200,48,62,0.1)` | Nền nguy hiểm mờ |

---

## Typography

### Font Families

| Tên | Font | Mục đích |
|---|---|---|
| Sans (mặc định) | `DM Sans`, Inter, system-ui | Chữ UI |
| Display | `Space Grotesk` | Tiêu đề, logo, H1, số liệu |
| Mono | `JetBrains Mono`, Menlo | Địa chỉ, code, hash |

### Scale Chữ

| Class | Kích thước | Weight | Mục đích |
|---|---|---|---|
| — | 10px | 600 | Label caps (`.label-caps`) |
| — | 12px | 400 | Caption, metadata |
| — | 13px | 400 | Nội dung phụ |
| — | 14px | 400/500 | Nội dung chính |
| — | 15px | 600 | Nhãn button |
| — | 16px | 400 | Chú thích |
| — | 20px | 700 | Section header |
| — | 28px | 700 | Page title |
| — | 36px | 700 | Hero / số liệu |

---

## Component Classes (index.css)

### Buttons

```css
.btn          /* Nền: transparent, padding: 8px 14px, radius: 10px */
.btn-sm       /* padding: 5px 10px, font-size: 13px */
.btn-primary  /* bg: --accent, text: --on-accent, hover: --accent-hover */
.btn-ghost    /* bg: transparent, hover: --surface-strong */
.btn-danger   /* bg: --danger-dim, text: --danger */
```

### Badges

```css
.badge        /* padding: 3px 9px, border-radius: 20px, font-size: 11px */
.badge-open   /* accent-dim bg, border-strong border */
.badge-settled/* success-dim bg, success-border border */
.badge-expired/* surface-muted bg, border border */
.badge-warning/* warning-dim bg, warning text */
```

### Layout

```css
.stat-card    /* surface bg, border, radius-16, padding-16 */
.invoice-row  /* surface bg, border, radius-16, hover state */
.sidebar-sticky/* sticky positioning với max-h tính toán */
```

---

## Hệ Thống Logo

### Logo Mark
Hai dấu ngoặc vuông (cửa sổ thanh toán) + mũi tên (thanh toán sớm).
Được vẽ trên lưới 32×32, scale tùy ý.

### Biến thể

| Biến thể | Component | Mục đích |
|---|---|---|
| `primary` | `<EarlyPayLogo />` | Mark + wordmark — Navbar, header |
| `mark` | `<LogoMark />` | Icon only — Favicon, icon tile |
| `wordmark` | `<EarlyPayLogo variant="wordmark" />` | Text only — TBD |

### Màu Logo

- Mark stroke/fill: `var(--accent)` → `var(--accent-hover)` (gradient)
- "Early" text: `var(--ink)` (thích nghi với theme)
- "Pay" text: `var(--accent)` (thích nghi với theme)

### Files Static

| File | Mô tả |
|---|---|
| `public/favicon.svg` | 32×32 SVG favicon |
| `public/logo-mark.svg` | Icon standalone |
| `public/logo-primary.svg` | Mark + wordmark dark |
| `public/logo-primary-light.svg` | Mark + wordmark light |
| `public/logo-mono.svg` | Trắng đơn sắc |

---

## Spacing & Radius

| Token | Giá trị | Mục đích |
|---|---|---|
| `--navbar-h` | `56px` | Chiều cao navbar |
| `--sidebar-w` | `272px` | Chiều rộng sidebar desktop |
| `--radius-sm` | `8px` | Input, badge nhỏ |
| `--radius-md` | `12px` | Card, dropdown |
| `--radius-lg` | `16px` | Modal, panel |
| `--radius-xl` | `20px` | Sheet, modal lớn |

---

## Shadows

```css
--shadow-sm:  0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)
--shadow-md:  0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.10)
--shadow-lg:  0 10px 30px rgba(0,0,0,0.20), 0 4px 8px rgba(0,0,0,0.12)
```
