# Đặc Tả Tính Năng Chi Tiết

## 1. Đăng Hóa Đơn (postInvoice)

### Tác nhân
Người mua (bất kỳ ví EVM nào đã kết nối)

### Đầu vào

| Trường | Kiểu | Xác thực |
|---|---|---|
| `supplier` | `address` | Khác `address(0)`, khác người mua |
| `faceValue` | `uint128` | > 0, đơn vị: USDC decimals (6) |
| `windowEnds[0–2]` | `uint64` | Giảm dần, tất cả > `block.timestamp`, tất cả ≤ `expiresAt` |
| `discountsBps[0–2]` | `uint16` | Đơn điệu giảm dần (tier[0] ≥ tier[1] ≥ tier[2]), mỗi cái < 10000 |
| `expiresAt` | `uint64` | > `windowEnds[2]` |

### Luồng

1. Frontend tính toán `maxRebate = faceValue * discountsBps[0] / 10000`
2. Frontend gọi `USDC.approve(vault, maxRebate)`
3. Sau khi approve confirm, frontend gọi `vault.postInvoice(...)`
4. Contract chuyển `maxRebate` USDC từ người mua vào vault
5. Hóa đơn được khởi tạo với trạng thái OPEN
6. Sự kiện `InvoicePosted(invoiceId, buyer, supplier, faceValue, expiresAt)` được emit

### Trạng thái lỗi

| Lỗi | Điều kiện |
|---|---|
| `InvalidSupplier` | Nhà cung cấp là zero address hoặc trùng người mua |
| `InvalidAmount` | faceValue là 0 |
| `InvalidTiers` | windowEnds không hợp lệ hoặc discountsBps không đơn điệu |
| `InvalidExpiry` | expiresAt ≤ windowEnds cuối |
| ERC-20 revert | Allowance USDC không đủ |

---

## 2. Thanh Toán Hóa Đơn (settleInvoice)

### Tác nhân
Nhà cung cấp đã đăng ký trong hóa đơn (phải là `msg.sender`)

### Đầu vào

| Trường | Kiểu | Xác thực |
|---|---|---|
| `invoiceId` | `uint256` | Phải tồn tại, trạng thái OPEN, không hết hạn |

### Luồng

1. Frontend tính toán `netPayment = faceValue - currentDiscount` (hiển thị trong card)
2. Frontend gọi `USDC.approve(vault, netPayment)`
3. Sau khi approve confirm, gọi `vault.settleInvoice(invoiceId)`
4. Contract xác thực: trạng thái OPEN, chưa hết hạn, `msg.sender == supplier`
5. Contract kiểm tra tier hiện tại dựa trên `block.timestamp`
6. Contract chuyển `netPayment` từ nhà cung cấp vào vault, sau đó chuyển `faceValue` cho người mua
7. Hoàn tiền `rebate` (= maxRebate − chiết khấu thực tế) được trả về người mua
8. Trạng thái hóa đơn chuyển thành SETTLED
9. Sự kiện `InvoiceSettled(invoiceId, supplier, netPayment, rebate, tierUsed)` được emit

### Toán học thanh toán

```
currentDiscount = faceValue * activeDiscountBps / 10000
netPayment      = faceValue - currentDiscount
rebate          = maxRebate - currentDiscount
buyerReceives   = faceValue (= netPayment + rebate từ vault)
supplierPays    = netPayment
```

### Trạng thái lỗi

| Lỗi | Điều kiện |
|---|---|
| `NotSupplier` | Caller không phải nhà cung cấp đã đăng ký |
| `InvoiceNotOpen` | Hóa đơn đã SETTLED hoặc EXPIRED |
| `InvoiceAlreadyExpired` | `block.timestamp > expiresAt` |

---

## 3. Hết Hạn Hóa Đơn (expireInvoice)

### Tác nhân
Bất kỳ địa chỉ nào (permissionless)

### Đầu vào

| Trường | Kiểu | Xác thực |
|---|---|---|
| `invoiceId` | `uint256` | Phải tồn tại, trạng thái OPEN |

### Luồng

1. Bất kỳ ai gọi `vault.expireInvoice(invoiceId)` sau `expiresAt`
2. Contract xác thực: trạng thái OPEN, `block.timestamp > expiresAt`
3. Tài sản thế chấp `maxRebate` được trả về người mua
4. Trạng thái hóa đơn chuyển thành EXPIRED
5. Sự kiện `InvoiceExpired(invoiceId, buyer, refund)` được emit

### Trạng thái lỗi

| Lỗi | Điều kiện |
|---|---|
| `InvoiceNotOpen` | Hóa đơn đã SETTLED hoặc EXPIRED |
| `NotYetExpired` | `block.timestamp ≤ expiresAt` |

---

## 4. Dashboard Stats

### Hiển thị số dư USDC ví
- Đọc từ contract USDC ERC-20 (`balanceOf(walletAddress)`)
- Cập nhật mỗi block hoặc khi transaction confirm

### TVL Vault
- Đọc từ `USDC.balanceOf(vaultAddress)`
- Phản ánh tổng tài sản thế chấp đang bị khóa

### Bộ đếm hóa đơn
- Đọc từ `getInvoicesByBuyer` và `getInvoicesBySupplier`
- Bộ đếm theo vai trò, cập nhật ngay sau transaction confirm

---

## 5. Chuyển Đổi Chủ Đề (Dark/Light Mode)

### Lưu trữ
- Khóa: `localStorage['ep-theme']`
- Giá trị: `'dark'` | `'light'`
- Fallback: `prefers-color-scheme` của hệ thống

### Khởi tạo
- Script inline trong `index.html` áp dụng `data-theme` trước khi React render
- Không có flash khi tải trang

### Toggle
- Nút Sun/Moon trong navbar
- `aria-label`, focus-visible ring, điều hướng bàn phím

---

## 6. Tài Liệu Trong App (DocsViewer)

### Truy cập
- URL hash: `/#/docs`
- Nút **Docs** trong navbar

### Tính năng
- 13 tài liệu, điều hướng thanh bên
- Hỗ trợ hai ngôn ngữ: Tiếng Anh / Tiếng Việt
- Toggle ngôn ngữ lưu vào `localStorage['ep-docs-lang']`
- Render markdown: tiêu đề, bảng, code block, blockquote
- Mobile: sidebar overlay qua nút menu
- Phím Escape để đóng
