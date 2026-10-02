# Quy Ước Đặt Tên

## TypeScript / React

### Files & Thư mục

| Pattern | Ví dụ | Mục đích |
|---|---|---|
| PascalCase.tsx | `InvoiceCard.tsx` | React components |
| camelCase.ts | `useTheme.ts` | Hooks, utilities |
| kebab-case.ts | `onchain-facts.ts` | Module facts/constants |
| camelCase.ts | `constants.ts` | Constants dự án |
| SCREAMING_SNAKE | `DISCOUNT_VAULT_ABI` | Constants bất biến |

### Cấu Trúc Thư Mục

```
src/
├── components/          # UI components (PascalCase.tsx)
│   ├── Logo.tsx
│   ├── Sidebar.tsx
│   ├── InvoiceCard.tsx
│   ├── PostInvoiceSheet.tsx
│   ├── Footer.tsx
│   └── DocsViewer.tsx
├── hooks/               # Custom React hooks (use*.ts)
│   └── useTheme.ts
├── onchain-facts.ts     # Chain IDs, addresses, RPC URLs
├── onchain-money.ts     # Amount parsing/formatting
├── onchain-wait.ts      # Transaction state machine
├── config.ts            # wagmi config
├── constants.ts         # ABI, contract address
├── tracing.ts           # Trace logging
└── App.tsx              # Root component
```

### Components

```typescript
// ✅ Đúng
export function InvoiceCard({ invoice, onSettle }: Props) { ... }

// ❌ Sai
export default function card({ data }: any) { ... }
```

### Props

```typescript
// ✅ Interface riêng, PascalCase
interface InvoiceCardProps {
  invoice: InvoiceData
  onSettle: (id: bigint) => void
  isLoading?: boolean
}

// ❌ Sai: inline type, optional không cần thiết
function Card({ x, y, z }: { x?: any, y?: any }) { ... }
```

### State & Variables

```typescript
// ✅ camelCase, tên mô tả
const [isModalOpen, setIsModalOpen] = useState(false)
const [invoiceId, setInvoiceId] = useState<bigint | null>(null)
const currentTierIndex = getTierIndex(tiers, Date.now())

// ❌ Sai
const [x, setX] = useState()
const data2 = ...
```

### Hooks

```typescript
// ✅ Tiền tố use*, trả về object
export function useTheme() {
  return { theme, toggleTheme }
}

// ❌ Sai
export function getTheme() { ... }
```

### Constants

```typescript
// ✅ SCREAMING_SNAKE cho giá trị bất biến
const DISCOUNT_VAULT_ADDRESS = '0xf8a283ada5c99831b904d058291895d0e38c546b'
const USDC_DECIMALS = 6
const MAX_TIERS = 3

// ❌ Sai
const address = '0x...'
const decimals = 6
```

---

## Solidity

### Contracts & Interfaces

| Pattern | Ví dụ |
|---|---|
| PascalCase | `DiscountVault`, `IDiscountVault` |
| Interface tiền tố I | `IDiscountVault` |
| Library tiền tố Lib | TBD |

### Functions

```solidity
// ✅ camelCase, động từ + danh từ
function postInvoice(...) external { ... }
function settleInvoice(uint256 id) external { ... }
function getCurrentTier(uint256 id) external view returns (...) { ... }

// ❌ Sai
function Post(uint id) public { ... }
function get_invoice(uint id) public view { ... }
```

### Events

```solidity
// ✅ PascalCase, quá khứ
event InvoicePosted(uint256 indexed invoiceId, address indexed buyer, ...);
event InvoiceSettled(uint256 indexed invoiceId, ...);
event InvoiceExpired(uint256 indexed invoiceId, ...);
```

### Custom Errors

```solidity
// ✅ PascalCase, tên mô tả chính xác
error InvalidSupplier();
error InvalidAmount();
error NotYetExpired();
error InvoiceAlreadyExpired();
error InvoiceNotOpen();
error NotSupplier();
```

### State Variables

```solidity
// ✅ camelCase cho public mapping/var
mapping(uint256 => Invoice) public invoices;
address public immutable usdc;
uint256 public invoiceCount;

// ✅ tiền tố s_ cho storage variables phức tạp (TBD)
// ✅ tiền tố i_ cho immutables (TBD)
```

### Structs & Enums

```solidity
// ✅ PascalCase
struct Invoice { ... }
struct Tier { ... }
enum InvoiceState { OPEN, SETTLED, EXPIRED }
```

---

## Database

### Tables (snake_case)

```sql
earlypay.invoices
earlypay.invoice_tiers
earlypay.sync_cursors
earlypay.transaction_events
```

### Columns

```sql
-- snake_case, mô tả rõ ràng
invoice_id      BIGINT
buyer_address   CHAR(42)
face_value_raw  NUMERIC(38,0)
settled_at      TIMESTAMPTZ
discount_bps    SMALLINT
```

### Indexes

```sql
-- Tiền tố idx_, sau đó table_column
idx_invoices_buyer_address
idx_invoices_state_open
idx_transaction_events_invoice_id
```

---

## CSS / Tailwind

### Custom Classes

```css
/* kebab-case, tiền tố mô tả */
.btn-primary { ... }
.badge-open { ... }
.stat-card { ... }
.invoice-row { ... }
.label-caps { ... }
.sidebar-sticky { ... }
```

### CSS Variables (Tokens)

```css
/* kebab-case, tiền tố ngữ nghĩa */
--bg
--surface
--surface-muted
--ink
--accent
--border
--success
--danger
```

---

## Git Branches

```
main          # production-ready
feat/...      # tính năng mới
fix/...       # bug fixes
chore/...     # maintenance
docs/...      # chỉ thay đổi tài liệu
refactor/...  # refactoring
```

## Biến Môi Trường

```
VITE_*        # Prefix bắt buộc để expose ra browser
DATABASE_URL  # Connection string (không prefix VITE_)
CIRCLE_*      # Credentials Circle
RPC_PROXY_*   # Arc Studio RPC proxy
```
