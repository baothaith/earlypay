Reading the full current codebase before forming any design opinion. Đủ context để phân tích chuyên sâu. Đây là đánh giá UX/UI đầy đủ:

---

## Phân Tích UX/UI Chuyên Sâu — EarlyPay

### 1. Những điểm mạnh hiện tại

- Design system token-based nhất quán, dark/light theme sạch
- Semantic HTML, accessible states, keyboard navigation có
- Component boundaries hợp lý (Sidebar, InvoiceCard, PostInvoiceSheet)
- Two-column dashboard layout đúng hướng cho B2B
- Transaction flow 2-step với toast feedback

---

### 2. Vấn đề UX nghiêm trọng cần giải quyết

**A — Information Architecture: Người dùng không biết họ đang ở đâu trong sản phẩm**

Ngay sau khi connect wallet, dashboard xuất hiện nhưng không có orientation. Không có summary context — "Bạn có X invoices cần settle, Y sắp hết hạn". Người dùng phải tự scan để hiểu tình trạng. Đây là lỗi IA phổ biến nhất trong Web3 dashboard.

**B — InvoiceCard: quá nhiều thông tin ẩn, hành động khó tìm**

Card ở trạng thái collapsed chỉ show faceValue + ID + địa chỉ rút gọn. Với supplier cần settle, không rõ ngay "Tôi cần trả bao nhiêu? Rebate là bao nhiêu? Còn bao lâu?". Họ phải mở expand mới thấy — đây là extra cognitive load không cần thiết cho action quan trọng nhất.

**C — Settle button: critical action bị chôn sâu**

`Pay X USDC — Claim Y rebate` là action quan trọng nhất của supplier nhưng bị ẩn trong expanded state. Nguyên tắc Web3 UX: action chính phải visible ở state 0, không sau 1-2 click.

**D — PostInvoice form: "bps" là jargon, người dùng non-technical không hiểu**

`Discount (bps)` và `200 bps = 2.00%` hiển thị sau khi nhập — đúng nhưng không đủ. Buyer cần thấy ngay: "Tôi sẽ lock bao nhiêu tiền làm collateral?" và "Supplier sẽ tiết kiệm được bao nhiêu?" — thông tin này đang bị ẩn và không realtime đủ.

**E — Empty state thiếu context + action**

Supplier tab empty state chỉ nói "No invoices assigned to you" — không hướng dẫn họ cần làm gì tiếp theo (ví dụ: share địa chỉ ví của bạn với buyer để được assign).

**F — Wrong network banner: không đủ urgency**

Banner `Switch to Arc Testnet` dùng warning color nhưng nằm dưới navbar, dễ bị bỏ qua. Toàn bộ interface vẫn render bình thường — người dùng có thể nghĩ app đang hoạt động.

**G — Không có transaction history / audit trail rõ ràng**

Settled invoices hiển thị trong list nhưng không có cách filter "chỉ show settled" hay "chỉ show OPEN". Trên B2B app, buyer cần review lịch sử thanh toán.

**H — Mobile UX: sidebar collapse nhưng tab switcher ở feed header bị tách khỏi stats**

Mobile user mất context vì không thấy wallet balance và TVL khi scroll down.

---

### 3. Đề xuất thiết kế cụ thể

**A — Thêm Dashboard Summary Bar (Priority: High)**

Giữa navbar và feed, thêm một bar ngang hiển thị theo context của tab đang active:

- *Buyer tab*: `X open invoices · Y settling soon · $Z locked as collateral`
- *Supplier tab*: `X invoices to settle · Best available rebate: Y% · Settle by [date] to save $Z`

**B — InvoiceCard: redesign summary row để show key decision data ngay (Priority: Critical)**

```
[STATE ICON] $1,000 USDC · #42         [2.0% rebate available]   Settle by Jan 15
              0x1234 → 0x5678                                     [Settle Now]  ← inline button
```

Supplier cần thấy "Settle Now" button ngay ở collapsed state khi `canSettle = true`. Không cần expand.

**C — PostInvoiceSheet: real-time financial summary (Priority: High)**

Thêm live preview panel ở góc phải (desktop) hoặc sticky bottom (mobile):

```
Invoice Summary
─────────────────
Face Value:        $10,000
Collateral locked: $200    ← tier 1 max rebate
─────────────────
Tier 1 (≤ Jan 7):   2.00% → supplier saves $200
Tier 2 (≤ Jan 14):  1.00% → supplier saves $100
─────────────────
Expiry:            Jan 30
```

**D — Thay "bps" input bằng % với bps hiển thị phụ (Priority: High)**

Input nhận `2.00%`, tự convert sang `200 bps` hiển thị phụ. Buyer không cần biết bps là gì.

**E — Invoice state filter (Priority: Medium)**

Thêm filter pills trên feed: `All · Open · Settled · Expired · Overdue`. Cho B2B context, đây là tính năng cần thiết.

**F — Wrong network: block interaction rõ hơn (Priority: Medium)**

Khi wrong network, overlay dim các invoice cards với `cursor-not-allowed`. Chỉ giữ "Switch Network" button enabled. Tránh trạng thái half-functional.

**G — Supplier empty state: actionable guidance (Priority: Medium)**

```
No invoices assigned to you yet
─────────────────────────────────
Share your wallet address with buyers to be
registered as a supplier on their invoices.

[Copy wallet address]
```

---

### 4. Quick wins không cần redesign lớn

1. **Hover state trên InvoiceCard**: show `Settle Now` button inline khi hover + `canSettle = true` → không cần expand
2. **Collateral preview realtime**: update ngay khi thay đổi face value hoặc tier 1 discount
3. **% thay vì bps** trong tier input
4. **Expiry countdown urgency**: Nếu còn < 24h → badge `Overdue` nên thay thành `Expires in Xh` với màu warning thay vì danger
5. **"Copy address" trên buyer/supplier trong expanded view** → tránh phải copy thủ công

---

Bạn muốn tôi bắt đầu implement phần nào trước? Tôi đề xuất thứ tự:

1. **InvoiceCard inline settle button** (highest impact, supplier workflow)
2. **Dashboard summary bar** (orientation cho tất cả users)
3. **% input thay vì bps** (form usability)
4. **State filter pills** (B2B power user feature)
