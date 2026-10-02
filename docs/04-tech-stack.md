# Tech Stack

## Blockchain

| Layer | Choice | Version / Address |
|---|---|---|
| Chain | Arc Testnet | Chain ID 5042002 |
| Payment token | USDC (native on Arc) | `0x3600000000000000000000000000000000000000` |
| Smart contract language | Solidity | 0.8.28 |
| EVM target | Paris | `evm_version = "paris"` (no Cancun opcodes) |
| OZ contracts | OpenZeppelin | 5.1.0 |
| Contract framework | Foundry | `.foundry-version` in repo root |
| Deployed contract | DiscountVault | `0xf8a283ada5c99831b904d058291895d0e38c546b` |

## Frontend

| Layer | Choice | Version |
|---|---|---|
| Framework | React | 18.3.x |
| Language | TypeScript | 5.x |
| Build tool | Vite | 5.x |
| Styling | Tailwind CSS v3 + CSS custom properties | 3.x |
| Animation | Framer Motion | 11.x |
| Icons | Lucide React | 0.468.x |
| Web3 hooks | wagmi v2 | 2.19.x |
| Web3 primitives | viem | 2.56.x |
| Wallet modal | ConnectKit | 1.9.x |
| Data fetching | @tanstack/react-query | 5.x |
| Toast notifications | Sonner | 1.7.x |
| Package manager | Bun | see `.bun-version` |

## Onchain modules (Arc Studio generated, do not edit)

| Module | Path | Purpose |
|---|---|---|
| `onchain-facts` | `src/onchain-facts.ts` | Chain IDs, RPC URLs, USDC addresses, contract addresses |
| `onchain-money` | `src/onchain-money.ts` | BigInt USDC arithmetic, `Amount` class |
| `onchain-wait` | `src/onchain-wait.ts` | Transaction state machine helpers |

## Database

| Layer | Choice |
|---|---|
| Engine | PostgreSQL (external, connection via `DATABASE_URL`) |
| Schema | `earlypay` (separate schema, not `public`) |
| Driver | `pg` 8.23.x (Node.js / Bun) |
| Migration | `scripts/migrate.sql` + `scripts/migrate.ts` |

## Infrastructure

| Item | Choice |
|---|---|
| Hosting | Netlify (static, `dist/`) |
| Repository | GitHub (`baothaith/earlypay`) |
| CI/CD | Not Defined |
| Secrets management | `.env` file (not committed) |
