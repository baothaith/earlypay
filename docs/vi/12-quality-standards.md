# Tiêu Chuẩn Chất Lượng

## Định Nghĩa "Hoàn Thành" (Definition of Done)

Một tính năng được coi là hoàn thành khi đáp ứng tất cả tiêu chí sau:

### Frontend

- [ ] Tất cả chức năng mô tả trong đặc tả tính năng đã hoạt động
- [ ] `bun run check` — 0 errors, 0 warnings
- [ ] `bunx vite build` — thành công
- [ ] Responsive trên: mobile 375px, tablet 768px, laptop 1280px, desktop 1920px
- [ ] Dark Mode và Light Mode đều hoạt động đúng
- [ ] Loading, error, và empty states được xử lý
- [ ] Không có console.error khi dùng bình thường
- [ ] Không có fake/mock data trong production code
- [ ] Accessibility: focus visible, aria-labels, keyboard navigation

### Contract

- [ ] `forge build` — compile sạch, không warnings
- [ ] `forge test` — tất cả tests pass (khi có tests)
- [ ] Đã deploy và xác minh trên testnet
- [ ] Address được cập nhật trong `AGENTS.md` và `src/constants.ts`
- [ ] Audit findings đã được review và xử lý

### Database

- [ ] Migration idempotent và đã test
- [ ] Schema khớp với `docs/04-tech-stack.md`
- [ ] Indexes tồn tại cho các query thường dùng

### Documentation

- [ ] Tài liệu phản ánh trạng thái thực tế của code
- [ ] Phiên bản tiếng Việt và tiếng Anh đều được cập nhật
- [ ] Không có thông tin sai lệch hoặc lỗi thời

---

## Lệnh Tooling

```bash
# Kiểm tra code
bun run check          # lint + typecheck (phải: 0 errors)
bash scripts/check.sh  # fallback nếu script không tồn tại

# Build
bunx vite build        # Production build

# Contract
forge build            # Compile Solidity
forge test             # Run tests (TBD)
forge test -vvv        # Verbose test output

# Database
bun run db:migrate     # Chạy migrations
bun run db:verify      # Xác minh schema

# Dev server
bun run dev            # Start Vite dev server
ps aux | grep vite     # Kiểm tra server đang chạy
```

---

## Tiêu Chuẩn Hiệu Năng

| Metric | Target | Hiện tại |
|---|---|---|
| Build size (gzipped main bundle) | < 600 kB | ~476 kB ✅ |
| Time to interactive (testnet) | < 3s | TBD |
| Transaction confirmation feedback | Immediate loading state | ✅ |
| Theme switch | Instant (< 50ms) | ✅ |
| Docs render | < 100ms | ✅ (marked.parse cached) |

---

## Giới Hạn Kỹ Thuật Đã Biết (Technical Debt)

| Mục | Mô tả | Độ ưu tiên |
|---|---|---|
| Không có unit tests contract | `forge test` chưa được viết | Cao |
| Không có indexer onchain | Invoice data được đọc trực tiếp từ chain (không scale) | Cao |
| Không có CI/CD | Chưa có GitHub Actions | Trung bình |
| Bundle size lớn | Web3 SDK (~1.5MB raw) — normal cho dApps | Thấp |
| `stream-json` advisory | False positive trong Bun audit DB | Thấp |
| `elliptic` advisory | Low severity, no upstream patch available | Thấp |
| Không có E2E tests | Playwright/Cypress chưa setup | Trung bình |
| Không có branch protection | Chưa setup GitHub branch rules | Trung bình |
| Slither chưa chạy | Static analysis contract chưa tự động | Cao |

---

## Audit Lỗ Hổng Dependency

Chạy định kỳ:

```bash
bun audit
```

Kết quả hiện tại: **2 vulnerabilities** (xuống từ 25 sau khi áp dụng overrides)

| Package | Severity | Trạng thái |
|---|---|---|
| `elliptic <=6.6.1` | Low | Không có patch — upstream chưa fix |
| `stream-json <=3.4.0` | Moderate | False positive — `1.9.1` đã là latest |

---

## Checklist Bảo Mật Thường Kỳ

Nên chạy định kỳ (TBD: tự động qua CI):

- [ ] `bun audit` — kiểm tra vulnerabilities mới
- [ ] Xem xét `.env` không bị commit
- [ ] Xem xét không có address cứng trong source code
- [ ] Xem xét contract permissions (owner, paused state)
- [ ] Xem xét balance vault khớp với tổng tài sản thế chấp mở

---

## Phiên Bản Hiện Tại

| Hạng mục | Phiên bản |
|---|---|
| EarlyPay Frontend | `v1.0.0` (deployed Netlify) |
| DiscountVault Contract | Block deploy trên Arc Testnet |
| Node.js | 20+ |
| Bun | latest |
| Solidity | 0.8.28 |
| OpenZeppelin | 5.1.0 |
