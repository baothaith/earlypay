# EarlyPay — Mục Lục Tài Liệu

Chào mừng đến với tài liệu kỹ thuật chính thức của **EarlyPay**.

Bộ tài liệu này phản ánh trạng thái thực tế của mã nguồn và kiến trúc hệ thống.
Dùng làm nguồn tham khảo tin cậy cho developer và AI Agent khi phát triển tiếp.

---

## Điều Hướng

| # | Tài liệu | Nội dung |
|---|---|---|
| 00 | Index | Trang này |
| 01 | Tổng Quan & Mục Tiêu | Tầm nhìn sản phẩm, vấn đề cần giải quyết, định nghĩa thành công |
| 02 | Tính Năng | Tính năng đã triển khai và lộ trình tương lai |
| 03 | Đặc Tả Tính Năng | Luồng chi tiết cho từng tính năng: đầu vào, đầu ra, trạng thái lỗi |
| 04 | Tech Stack | Mọi công nghệ, thư viện, cơ sở hạ tầng đang sử dụng |
| 05 | Design System | Tokens màu sắc, typography, spacing, component classes |
| 06 | Hướng Dẫn UI/UX | Breakpoint, pattern tương tác, do/don't |
| 07 | Quy Ước Đặt Tên | TypeScript, Solidity, DB, file/folder |
| 08 | Phong Cách Code | Quy tắc theo từng ngôn ngữ: TS, Solidity, CSS |
| 09 | Quy Tắc Code | Bất biến bảo mật cứng, quy tắc kiến trúc |
| 10 | Quy Ước Commit | Định dạng conventional commits + ví dụ |
| 11 | Quy Trình Code Review | Checklist PR cho tác giả + reviewer |
| 12 | Tiêu Chuẩn Chất Lượng | Định nghĩa hoàn thành, công cụ, nợ kỹ thuật |

---

## Lệnh Nhanh

```bash
# Cài đặt dependencies
bun install

# Chạy dev server
bun run dev

# Lint + typecheck
bun run check

# Build production
bunx vite build

# Chạy migration database
bun run db:migrate

# Xác minh schema
bun run db:verify
```

---

## Địa Chỉ Contract Đã Deploy

| Mạng | Contract | Địa chỉ |
|---|---|---|
| Arc Testnet | DiscountVault | `0xf8a283ada5c99831b904d058291895d0e38c546b` |

Explorer: https://explorer.testnet.arc.io/address/0xf8a283ada5c99831b904d058291895d0e38c546b

---

> Mọi nội dung chưa tồn tại trong dự án được đánh dấu là `TBD`.
> Không tự suy đoán hoặc tạo thông tin không có cơ sở.
