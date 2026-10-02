# Tổng Quan & Mục Tiêu Dự Án

## EarlyPay là gì?

EarlyPay là nền tảng **chiết khấu thanh toán sớm B2B onchain** — một cơ chế tài chính chuỗi cung ứng phi tập trung, nơi người mua khóa tài sản thế chấp USDC cho các hóa đơn, và nhà cung cấp thanh toán sớm để nhận hoàn tiền tự động từ kho vault theo các mức chiết khấu giảm dần theo thời gian.

---

## Vấn Đề Cần Giải Quyết

Tài chính chuỗi cung ứng truyền thống (SCF) yêu cầu:
- Người phê duyệt trung gian (ngân hàng, factoring agent)
- Thời gian xử lý từ 3–10 ngày làm việc
- Phí cao và thiếu minh bạch về tỷ lệ chiết khấu
- Không có khả năng xử lý onchain khi cần

EarlyPay loại bỏ hoàn toàn người phê duyệt trung gian. Logic được thực thi onchain:
bất kỳ bên nào cũng có thể kiểm tra trạng thái chiết khấu và điều kiện hóa đơn mà không cần môi giới.

---

## Tầm Nhìn Sản Phẩm

> "Thời gian = tiền. Thanh toán sớm nên được thưởng tức thì, công khai và không cần tin tưởng."

EarlyPay biến triết lý đó thành cơ chế onchain: mức chiết khấu tốt nhất sẽ hết hạn trước,
thúc đẩy nhà cung cấp hành động nhanh chóng.

---

## Cơ Chế Cốt Lõi

- **Người mua** đăng hóa đơn với tối đa 3 mức chiết khấu theo thời gian
- **Mức 1**: chiết khấu cao nhất — cửa sổ thời gian ngắn nhất
- **Mức 2**: chiết khấu trung bình — cửa sổ trung gian
- **Mức 3**: chiết khấu thấp nhất — cửa sổ cuối cùng trước khi hết hạn
- **Nhà cung cấp** thanh toán mệnh giá trừ chiết khấu hiện hành, nhận hoàn tiền từ vault tức thì
- **Hết hạn** là permissionless — bất kỳ ai cũng gọi được, tài sản thế chấp trả về người mua

---

## Machine Trạng Thái Tiền

```
OPEN → SETTLED  (nhà cung cấp thanh toán sớm)
OPEN → EXPIRED  (thời hạn vượt qua, không ai thanh toán)
```

Không có trạng thái PENDING, DISPUTE, hay APPROVING. Logic hoàn toàn tất định.

---

## Định Nghĩa Thành Công

| Mục tiêu | Chỉ số |
|---|---|
| Hóa đơn onchain | Mọi hóa đơn đều có txHash trên Arc Testnet |
| Không cần người phê duyệt | Nhà cung cấp thanh toán trực tiếp vào contract |
| Chiết khấu tự động | Vault trả về đúng mức chiết khấu theo thời gian |
| Tài sản thế chấp an toàn | Không thể rút trước khi hóa đơn hết hạn hoặc được thanh toán |
| Hết hạn mở | Bất kỳ địa chỉ nào cũng gọi `expireInvoice` sau deadline |

---

## Contract Đã Deploy

| Mạng | Địa chỉ | Explorer |
|---|---|---|
| Arc Testnet (chainId 5042002) | `0xf8a283ada5c99831b904d058291895d0e38c546b` | [Xem trên Explorer](https://explorer.testnet.arc.io/address/0xf8a283ada5c99831b904d058291895d0e38c546b) |

USDC trên Arc Testnet: `0x3600000000000000000000000000000000000000`

---

## Phạm Vi Ngoài Mục Tiêu (Đã Từ Chối)

| Cơ chế | Lý do từ chối |
|---|---|
| Thanh toán định kỳ / phát trực tiếp | Không liên quan đến chiết khấu sớm |
| Escrow milestone | Cần người phê duyệt — đây là cơ chế đã bị từ chối |
| Tài trợ hóa đơn (factoring) | Bên thứ ba mua hóa đơn — ngoài phạm vi |
| Hợp đồng thông minh đa chuỗi | TBD cho phiên bản sau |
