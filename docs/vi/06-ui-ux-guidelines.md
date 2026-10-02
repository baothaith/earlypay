# Hướng Dẫn UI/UX

## Breakpoints Responsive

| Breakpoint | Chiều rộng | Layout |
|---|---|---|
| Mobile | < 640px | Một cột, padding 16px |
| Tablet | 640–1023px | Một cột, padding 24px |
| Desktop | ≥ 1024px | Hai cột: sidebar 272px + feed chính |
| Wide | ≥ 1280px | max-width 1440px, căn giữa |

---

## Cấu Trúc Layout

### Trang Dashboard

```
┌─────────────── Navbar (56px, sticky) ──────────────────┐
│ Logo │ Docs │ Theme toggle │ Connect Wallet             │
├──────────────────┬─────────────────────────────────────┤
│ Sidebar (272px)  │ Invoice Feed                        │
│ · Post Invoice   │ · Tab: Buyer / Supplier             │
│ · Role tabs      │ · Invoice cards (scrollable)        │
│ · Stats          │                                     │
│ · How it works   │                                     │
├──────────────────┴─────────────────────────────────────┤
│ Footer (4 cột: Brand / Product / Resources / Legal)    │
└────────────────────────────────────────────────────────┘
```

### Mobile (< 1024px)

- Sidebar bị ẩn; tab Buyer/Supplier xuất hiện inline trong feed header
- Navbar compact: chỉ logo + connect button; Docs/Theme trong overflow menu
- Footer thu về 1 cột stacked

---

## Luồng Invoice Card

Mỗi card có hai trạng thái:

**Thu gọn (mặc định):**
- State icon tile + face value + ID + địa chỉ buyer→supplier
- Tier badge đang hoạt động + đếm ngược hết hạn
- Nút hành động chính (Settle / Expire)
- Chevron mở rộng

**Mở rộng:**
- 4 số liệu thống kê inset: Mệnh giá, Bạn Trả, Bạn Nhận, Max Rebate
- Bảng tier: 3 hàng với badge active/inactive
- Bảng settlement preview khi tier đang hoạt động
- Nút hành động đầy đủ

---

## Trạng Thái Tương Tác

### Buttons

| Trạng thái | Visual |
|---|---|
| Default | bg: accent, text: on-accent |
| Hover | bg: accent-hover, cursor: pointer |
| Focus | outline: 2px accent, offset: 2px |
| Active | scale: 0.98, opacity: 0.9 |
| Disabled | opacity: 0.4, cursor: not-allowed |
| Loading | Spinner icon, disabled |

### Inputs

| Trạng thái | Visual |
|---|---|
| Default | border: --border, bg: --surface-muted |
| Focus | border: --accent, ring: --accent-dim |
| Error | border: --danger, text: --danger |
| Disabled | opacity: 0.5, cursor: not-allowed |

### Invoice Cards

| Trạng thái | Visual |
|---|---|
| OPEN | border-left: 3px solid --accent |
| SETTLED | border-left: 3px solid --success |
| EXPIRED | border-left: 3px solid --ghost, opacity: 0.7 |
| Overdue | border-left: 3px solid --danger |
| Hover | bg: --surface-strong |

---

## Thứ Tự Thông Tin (Hierarchy)

1. **Hành động chính** — nút Post Invoice (CTA rõ ràng nhất trong sidebar)
2. **Tóm tắt tài chính** — USDC balance, TVL, bộ đếm hóa đơn
3. **Danh sách hóa đơn** — sắp xếp theo thời gian tạo giảm dần
4. **Chi tiết hóa đơn** — trong card mở rộng theo yêu cầu

---

## Quy Tắc UX

### NÊN

- Luôn hiển thị trạng thái loading trong khi transaction đang xử lý
- Hiển thị transaction hash sau khi confirm với link explorer
- Sử dụng toast cho phản hồi thành công/thất bại thoáng qua
- Hiển thị countdown timer thực tế để tạo cảm giác cấp bách
- Hiển thị toán học settlement preview trước khi user xác nhận
- Disable hành động khi ví chưa kết nối

### KHÔNG NÊN

- Không fake loading states hoặc giả lập dữ liệu
- Không hiển thị số dư USDC native và ERC-20 là hai số riêng biệt (trên Arc là một pool)
- Không cho phép thanh toán nếu đã hết hạn
- Không ẩn thông báo lỗi — hiển thị rõ ràng với hướng dẫn khắc phục
- Không dùng animation quá phức tạp — chỉ transition tối thiểu

---

## Accessibility

| Yêu cầu | Triển khai |
|---|---|
| Focus visible | `outline: 2px solid var(--accent)` trên mọi interactive element |
| ARIA labels | Mọi icon-only button có `aria-label` |
| Keyboard nav | Tab order logic, Escape đóng modal/docs |
| Contrast | Đảm bảo WCAG AA ở cả hai chủ đề |
| Screen reader | Semantic HTML: `<header>`, `<main>`, `<nav>`, `<footer>` |
| Form labels | Mọi input có label hoặc aria-label |

---

## Phong Cách Visual

- **Arc Dark (mặc định)**: canvas navy sâu, surface layered, accent steel-blue
- **Light mode**: canvas trắng xanh nhạt, accent navy đậm để đảm bảo contrast
- **Typography**: Space Grotesk cho tiêu đề và số liệu; DM Sans cho nội dung; JetBrains Mono cho địa chỉ/hash
- **Border radius**: 12–20px cho card/modal; 8px cho input/badge nhỏ
- **Không dùng**: blockchain cube, Ethereum icon, hexagon, biểu tượng crypto cliché

---

## Nguyên Tắc Anti-Slop

- Đừng dùng màu primary (`--accent`) cho mọi thứ — chỉ cho CTA và trạng thái active
- Đừng đặt card nền trắng trong dark mode
- Không padding quá lớn trên khoảng trống trống
- Không nội dung lọt thỏm giữa màn hình Full HD — dùng `max-w-[1440px]` container
- Không sử dụng loading skeleton cho fetch < 300ms
