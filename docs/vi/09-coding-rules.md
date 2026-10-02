# Quy Tắc Code

## Bất Biến Bảo Mật (Không Được Vi Phạm)

### Contract (Solidity)

| Quy tắc | Lý do |
|---|---|
| Luôn dùng `ReentrancyGuard` trên các function chuyển token | Ngăn tấn công re-entrancy |
| Luôn theo pattern Checks-Effects-Interactions | Ngăn tấn công state manipulation |
| Luôn dùng `SafeERC20` cho tất cả ERC-20 transfers | Xử lý token không tuân chuẩn |
| Nhà cung cấp phải là `msg.sender` — không có bypass | Ngăn bất kỳ địa chỉ tùy ý nào thanh toán |
| Không bao giờ cho phép rút tài sản thế chấp trước khi hóa đơn kết thúc | Người mua không thể rút sớm |
| Kiểm tra đơn điệu bps tại postInvoice, không tại view | Thực thi onchain, không tin tưởng input |
| Không dùng `block.timestamp` cho các khoảng thời gian < 15 giây | Miners có thể điều chỉnh một chút |
| Custom errors thay vì revert strings | Tiết kiệm gas, thông báo rõ ràng hơn |

### Frontend (TypeScript)

| Quy tắc | Lý do |
|---|---|
| Không fake balances, addresses, hay transaction hashes | UX sai lệch + tạo rủi ro bảo mật |
| Luôn await transaction receipt trước khi update UI | Tránh hiển thị trạng thái thành công khi tx có thể thất bại |
| Không expose private keys hay secrets trong client code | Bảo mật cơ bản |
| Luôn validate chain ID trước khi ký | Ngăn nhầm lẫn mainnet/testnet |
| `VITE_*` prefix chỉ cho giá trị public | Vite ship mọi VITE_ var ra browser |
| Không commit `.env` vào git | Secrets không được commit |

### Database

| Quy tắc | Lý do |
|---|---|
| Dùng parameterized queries — không string concatenation | Ngăn SQL injection |
| Không store private keys trong DB | Bảo mật |
| Mọi địa chỉ blockchain được store dưới dạng lowercase | Nhất quán, tránh case mismatch |
| Mọi số tiền được store dưới dạng `NUMERIC(38,0)` | Không mất precision với BigInt |

---

## Quy Tắc Kiến Trúc

### Frontend

```
App.tsx chỉ là thin composition root.
Mỗi view/tính năng lớn có component file riêng trong src/components/.
Không để logic nghiệp vụ trong JSX — tách vào hooks hoặc utility functions.
Không import component từ component khác một cách vòng tròn.
Hook chỉ sử dụng trong function component — không gọi trong callback.
```

### Onchain

```
Không hard-code địa chỉ contract hoặc chain ID — import từ @/onchain-facts hoặc @/constants.
Không tự viết decimal math — dùng @/onchain-money (parseUsdc, formatUsdc, etc.)
Không viết polling loop riêng — dùng @/onchain-wait.
Không đọc cả native balance lẫn USDC balance và hiển thị/cộng như hai số riêng (chúng là một pool trên Arc).
Không gọi decimals() trên native sentinel address (0xEeee...eEEeE, 0x0000...0000).
```

### Database

```
Mọi DDL phải idempotent (IF NOT EXISTS) — migrate.sql có thể chạy lại an toàn.
Không hardcode connection string — luôn dùng process.env.DATABASE_URL.
Không dùng node để chạy scripts DB — dùng bun để .env được load tự động.
```

---

## Quality Gates

Mọi Pull Request phải pass tất cả trước khi merge:

```bash
# TypeScript + lint
bun run check   # Phải: 0 errors, 0 warnings

# Build production
bunx vite build  # Phải: thành công, không có errors

# Contract (TBD)
forge test       # Phải: tất cả tests pass (khi có)
forge build      # Phải: compile sạch
```

---

## Không Được Phép

| Hành động | Thay thế |
|---|---|
| `bun add <pkg>` cho pkg đã có trong pre-installed list | Dùng trực tiếp |
| `npm install` hay `npx` | Dùng `bun install` hay `bunx` |
| `sudo` | Sandbox không có sudo |
| Commit `.env` hay `recovery_file*` | Đã có trong `.gitignore` |
| Hard-code địa chỉ USDC | Import từ `@/onchain-facts` |
| Viết polling loop thủ công | Dùng `@/onchain-wait` |
| Tạo component chỉ để wrap một thứ đơn giản | Dùng trực tiếp hoặc dùng utility function |
| `eslint-disable` không có lý do | Fix root cause |
| `@ts-ignore` hay `@ts-nocheck` | Fix type properly |

---

## Xử Lý Lỗi

### Frontend

```typescript
// ✅ Chuẩn: catch, classify, show toast
try {
  await action()
} catch (e) {
  const msg = e instanceof Error ? e.message : 'Unknown error'
  // Phân loại lỗi contract
  if (msg.includes('NotSupplier')) {
    toast.error('Only the registered supplier can settle this invoice.')
  } else if (msg.includes('InvoiceAlreadyExpired')) {
    toast.error('This invoice has already expired.')
  } else {
    toast.error(msg)
  }
}
```

### Solidity

```solidity
// ✅ Custom errors cụ thể, không dùng string chung chung
error InvalidTiers();   // Không: error InvalidInput()
error NotYetExpired();  // Không: error Forbidden()
```

---

## Performance

- Không render component nặng khi không cần — dùng lazy loading nếu phù hợp
- Không fetch cùng một onchain data nhiều lần — share via React Query hoặc pass props
- Không set state trong loop không cần thiết
- Cache `marked.parse()` với `useMemo([content])` — không parse mỗi render
- Không tạo closure mới trong JSX render hot path — dùng `useCallback`
