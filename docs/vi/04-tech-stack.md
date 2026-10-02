# Tech Stack

## Blockchain

| Hạng mục | Công nghệ | Phiên bản |
|---|---|---|
| Mạng mục tiêu | Arc Testnet | chainId 5042002 |
| Token gas/thanh toán | USDC native | `0x3600000000000000000000000000000000000000` |
| Ngôn ngữ contract | Solidity | 0.8.28 |
| EVM version | Paris | `evm_version = "paris"` |
| Framework contract | Foundry / Forge | `foundry.toml` |
| Thư viện contract | OpenZeppelin | 5.1.0 |
| Contract đã deploy | DiscountVault | `0xf8a283ada5c99831b904d058291895d0e38c546b` |

## Frontend

| Hạng mục | Công nghệ | Phiên bản |
|---|---|---|
| Framework UI | React | 18 |
| Ngôn ngữ | TypeScript | 5.x |
| Build tool | Vite | 6.x |
| CSS | Tailwind CSS | 3.x |
| Quản lý state | React hooks (useState, useEffect, useMemo, useCallback) | — |
| Web3 client | wagmi | v2 |
| Viem | viem | v2 |
| UI kết nối ví | ConnectKit | latest |
| Query layer | @tanstack/react-query | v5 |
| Toast | Sonner | latest |
| Icons | lucide-react | latest |
| Web3 icons | @web3icons/react | latest |
| Markdown | marked | latest |
| Package manager | Bun | latest |

## Backend / Hạ Tầng

| Hạng mục | Công nghệ | Ghi chú |
|---|---|---|
| Database | PostgreSQL | Kết nối qua `DATABASE_URL` trong `.env` |
| Schema | `earlypay` (namespace riêng) | Migration tại `scripts/migrate.sql` |
| Migration runner | `scripts/migrate.ts` | Chạy bằng `bun run db:migrate` |
| Hosting frontend | Netlify | `https://monumental-cupcake-cf072e.netlify.app` |
| Quản lý mã nguồn | GitHub | `github.com/baothaith/earlypay` |

## Tooling & Chất Lượng

| Hạng mục | Công nghệ | Ghi chú |
|---|---|---|
| Linting | oxlint | `.oxlintrc.json` |
| Type checking | tsc --noEmit | `tsconfig.json` |
| Combined check | `bun run check` | `scripts/check.sh` |
| Kiểm thử contract | Foundry forge test | TBD |
| CI/CD | TBD | — |

## Biến Môi Trường

| Biến | Mục đích | Bắt buộc |
|---|---|---|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL | Chỉ cần cho DB ops |
| `VITE_WALLETCONNECT_PROJECT_ID` | Project ID của WalletConnect | Frontend |
| `RPC_PROXY_BASE_URL` | Proxy RPC của Arc Studio | Nếu có |
| `RPC_PROXY_TOKEN` | Token auth RPC proxy | Nếu có |
| `CIRCLE_API_KEY` | Circle Developer API Key | TBD |

Xem `.env.example` để biết tất cả biến có sẵn.
