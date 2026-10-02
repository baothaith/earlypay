# Tính Năng

## Tính Năng Đã Triển Khai

### Hợp Đồng Thông Minh (DiscountVault.sol)

| Tính năng | Mô tả | Trạng thái |
|---|---|---|
| `postInvoice` | Người mua khóa tài sản thế chấp USDC, đăng ký nhà cung cấp, thiết lập 3 mức chiết khấu | ✅ Live |
| `settleInvoice` | Nhà cung cấp được đăng ký thanh toán mệnh giá trừ chiết khấu hiện hành, nhận hoàn tiền từ vault | ✅ Live |
| `expireInvoice` | Permissionless sau deadline — trả tài sản thế chấp về người mua | ✅ Live |
| `getCurrentTier` | View function: trả về tier index và discount bps tại thời điểm hiện tại | ✅ Live |
| `getInvoiceState` | View: trả về OPEN/SETTLED/EXPIRED | ✅ Live |
| `getInvoiceCore` | View: mệnh giá, tài sản thế chấp, người mua, nhà cung cấp, hết hạn | ✅ Live |
| `getInvoiceTier` | View: windowEnd và discountBps cho từng tier | ✅ Live |
| `getInvoicesByBuyer` | Lấy danh sách ID hóa đơn theo địa chỉ người mua | ✅ Live |
| `getInvoicesBySupplier` | Lấy danh sách ID hóa đơn theo địa chỉ nhà cung cấp | ✅ Live |
| Pause/Unpause | Owner có thể tạm dừng contract trong tình huống khẩn cấp | ✅ Live |
| Custom errors | Lỗi rõ ràng, tốn ít gas hơn revert strings | ✅ Live |
| ReentrancyGuard | Bảo vệ khỏi tấn công re-entrant | ✅ Live |
| Kiểm tra đơn điệu bps | Xác thực tiers giảm dần khi `postInvoice` | ✅ Live |

### Frontend Dashboard

| Tính năng | Mô tả | Trạng thái |
|---|---|---|
| Kết nối ví | ConnectKit + wagmi — MetaMask, WalletConnect, Coinbase Wallet | ✅ Live |
| Hiển thị số dư USDC | Số dư ví realtime từ chain | ✅ Live |
| TVL vault | Tổng USDC đang khóa trong contract | ✅ Live |
| Đăng hóa đơn | Form nhiều bước: nhà cung cấp, mệnh giá, 3 tiers, hết hạn, flow approve+post | ✅ Live |
| Danh sách hóa đơn | Tab Người Mua / Nhà Cung Cấp, lọc theo vai trò ví kết nối | ✅ Live |
| Invoice card | Hiển thị trạng thái, tier hiện tại, đếm ngược hết hạn, toán học thanh toán | ✅ Live |
| Thanh toán hóa đơn | Flow 2 bước approve+settle cho nhà cung cấp | ✅ Live |
| Hết hạn hóa đơn | Nút expire permissionless sau deadline | ✅ Live |
| Chuyển đổi Theme | Dark/Light mode với tùy chọn được lưu trữ | ✅ Live |
| Tài liệu trong app | Docs viewer với 13 tài liệu, hỗ trợ tiếng Việt/Anh | ✅ Live |
| Footer | 4 cột: thương hiệu, sản phẩm, tài nguyên, pháp lý | ✅ Live |

---

## Lộ Trình (TBD)

### Giai Đoạn 2 — Indexer & Thông Báo

| Tính năng | Mô tả | Ưu tiên |
|---|---|---|
| Indexer sự kiện onchain | Sync InvoicePosted/Settled/Expired vào PostgreSQL | Cao |
| Thông báo real-time | WebSocket hoặc webhook khi trạng thái hóa đơn thay đổi | Cao |
| Lịch sử hóa đơn | Dashboard có thể tìm kiếm từ DB thay vì quét chain | Trung bình |
| Export CSV | Xuất lịch sử hóa đơn và thanh toán | Thấp |

### Giai Đoạn 3 — Đa Chuỗi & Enterprise

| Tính năng | Mô tả | Ưu tiên |
|---|---|---|
| Hỗ trợ đa chuỗi | Deploy trên Base, Arbitrum, Optimism | Trung bình |
| API REST | Endpoint headless cho tích hợp ERP | Trung bình |
| Bảng điều khiển tổ chức | Phân quyền dựa trên vai trò | TBD |
| KYC/KYB | Xác thực nhà cung cấp tùy chọn | TBD |
| Bảo hiểm hợp đồng | Bảo hiểm DeFi cho rủi ro counterparty | TBD |

---

## Tính Năng Ngoài Phạm Vi (Đã Xác Nhận Từ Chối)

- Thanh toán hóa đơn có thể nhường nhượng / trao đổi
- Cơ chế phê duyệt multi-sig
- Chuỗi cung ứng đa bên (>2 đối tác)
- Kết nối hệ thống ERP
- Cổng thanh toán fiat
