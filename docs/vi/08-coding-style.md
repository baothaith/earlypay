# Phong Cách Code

## TypeScript / React

### Nguyên Tắc Chung

- **Không dùng `any`** — dùng `unknown` nếu type chưa xác định, sau đó narrow.
- **Không dùng non-null assertion (`!`)** — dùng optional chaining và nullish coalescing.
- **Ưu tiên `const`** — chỉ dùng `let` khi thực sự cần reassign.
- **Không implicit return trong JSX** — tách biệt logic và markup.
- **Không inline object literals trong props** — tách ra ngoài hoặc dùng `useMemo`.
- **Một component = một file** — không khai báo nhiều exported components trong cùng một file.

### Cấu Trúc Component

```typescript
// 1. Imports
import { useState, useEffect } from 'react'
import { SomeIcon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

// 2. Types / Interfaces
interface Props {
  invoiceId: bigint
  onClose: () => void
}

// 3. Constants (nếu có, nhỏ gọn)
const MAX_DISPLAY = 10

// 4. Component function (named export, không default export)
export function InvoiceDetail({ invoiceId, onClose }: Props) {
  // 4a. Hooks đầu tiên
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  // 4b. Derived state / computed values
  const displayId = `#${invoiceId.toString().padStart(4, '0')}`

  // 4c. Event handlers
  function handleClose() {
    setIsOpen(false)
    onClose()
  }

  // 4d. Effects
  useEffect(() => { ... }, [invoiceId])

  // 4e. Render
  return (
    <div>...</div>
  )
}
```

### Hooks

```typescript
// ✅ Trả về named object
export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  function toggleTheme() { ... }
  return { theme, toggleTheme }
}

// ❌ Không trả về array (trừ [value, setter] theo chuẩn useState)
export function useTheme() {
  return [theme, toggle]  // confusing
}
```

### Conditional Rendering

```typescript
// ✅ Rõ ràng
{isConnected && <Dashboard />}
{error ? <ErrorState message={error} /> : <Content />}

// ❌ Tránh nested ternary
{a ? b ? <X /> : <Y /> : <Z />}
```

### Xử Lý Async / Transactions

```typescript
// ✅ Luôn catch error, luôn cleanup loading
async function handleSettle() {
  setIsLoading(true)
  try {
    const hash = await writeContractAsync({ ... })
    await waitForTransactionReceipt(config, { hash })
    toast.success('Invoice settled!')
    refetch()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Transaction failed'
    toast.error(msg)
  } finally {
    setIsLoading(false)
  }
}
```

### Import Paths

```typescript
// ✅ Dùng alias @ cho src/
import { parseUsdc } from '@/onchain-money'
import { DISCOUNT_VAULT_ABI } from '@/constants'

// ❌ Relative paths dài
import { parseUsdc } from '../../onchain-money'
```

---

## Solidity

### Layout File

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 1. Imports OpenZeppelin
// 2. Custom errors
// 3. Events
// 4. Contract declaration
// 5. State variables (immutables trước, storage sau)
// 6. Constructor
// 7. External functions
// 8. Public functions
// 9. Internal/private functions
// 10. View/pure functions
```

### Kiểm Tra Gas

```solidity
// ✅ Custom errors (tiết kiệm gas)
error InvalidAmount();
if (amount == 0) revert InvalidAmount();

// ❌ Revert strings (tốn gas hơn)
require(amount > 0, "Amount must be positive");
```

### SafeERC20

```solidity
// ✅ Luôn dùng SafeERC20 cho token transfers
using SafeERC20 for IERC20;
token.safeTransferFrom(from, to, amount);

// ❌ Không gọi transfer trực tiếp
token.transfer(to, amount);
```

### Kiểm Tra Trạng Thái

```solidity
// ✅ Checks-Effects-Interactions
function settleInvoice(uint256 id) external nonReentrant {
  // 1. Checks
  if (inv.state != InvoiceState.OPEN) revert InvoiceNotOpen();
  if (block.timestamp > inv.expiresAt) revert InvoiceAlreadyExpired();
  if (msg.sender != inv.supplier) revert NotSupplier();

  // 2. Effects
  inv.state = InvoiceState.SETTLED;

  // 3. Interactions
  usdc.safeTransferFrom(msg.sender, address(this), netPayment);
  usdc.safeTransfer(inv.buyer, faceValue);

  emit InvoiceSettled(id, msg.sender, netPayment, rebate, tierUsed);
}
```

---

## CSS / Tailwind

### Ưu Tiên

1. Dùng Tailwind utilities cho layout, spacing, breakpoints
2. Dùng `style={}` với CSS vars cho màu sắc semantic (`var(--token)`)
3. Dùng custom classes trong `index.css` cho patterns lặp lại (`.btn`, `.badge`, ...)
4. **Không** tạo file CSS riêng cho từng component
5. **Không** viết màu hard-coded trong `style={}` prop

### Pattern Chuẩn

```tsx
// ✅ CSS var cho màu, Tailwind cho layout
<div
  className="flex items-center gap-3 px-4 py-3 rounded-xl"
  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
>

// ❌ Màu hard-coded
<div style={{ background: '#0d1b2f', border: '1px solid #1a2a3e' }}>

// ❌ Tailwind cho màu (không responsive với theme)
<div className="bg-slate-900 border-slate-700">
```

### Responsive Classes

```tsx
// ✅ Mobile-first, breakpoint rõ ràng
<div className="flex flex-col lg:flex-row gap-4">
<div className="hidden lg:flex">  {/* Desktop only */}
<div className="lg:hidden">       {/* Mobile only */}
```
