# Features

## Core Features (Implemented)

### 1. Post Invoice (Buyer)
- Buyer specifies supplier address, face value (USDC), up to 3 discount tiers, and an expiry deadline.
- Contract computes the rebate pool = `faceValue × tier[0].discountBps / 10000`.
- Buyer approves USDC → contract pulls the rebate pool as collateral.
- Two-step UI: **Approve USDC → Post Invoice** with step toasts.
- Validation: non-zero supplier, positive face value, at least one tier, non-zero rebate pool.

### 2. Time-Decaying Discount Tiers
- Up to 3 tiers per invoice, each with a `windowEnd` timestamp and a `discountBps` value.
- Tiers must have strictly increasing `windowEnd` and non-increasing `discountBps` (enforced onchain).
- The active tier is the first tier whose `windowEnd >= block.timestamp`.
- After all tier windows close (but before `expiresAt`), discount = 0 — full face value is owed.

### 3. Settle Invoice (Supplier)
- Only the registered supplier can call `settleInvoice`.
- Supplier approves `faceValue − rebate` USDC → contract pulls it and routes it to the buyer.
- Contract releases the rebate from the locked pool to the supplier.
- Excess collateral (tier-0 rebate minus active-tier rebate) is returned to the buyer.
- Two-step UI: **Approve USDC → Settle** with auto-chain on approval confirm.

### 4. Expire Invoice (Anyone)
- After `expiresAt` passes, any address can call `expireInvoice`.
- Full collateral is returned to the buyer.
- State transitions to `EXPIRED`.
- UI shows a single "Expire Invoice" button on overdue open invoices.

### 5. Invoice Dashboard
- **Buyer tab**: all invoices posted by the connected wallet.
- **Supplier tab**: all invoices assigned to the connected wallet.
- Live chain reads via `wagmi` `useReadContracts` — no backend required.
- Refresh button re-fetches both lists.
- Reverse chronological display (newest first).

### 6. Sidebar Stats
- Wallet USDC balance (live ERC-20 `balanceOf`).
- Vault TVL (live ERC-20 `balanceOf` of the contract).
- Total invoices ever created.
- Invoice counts as buyer / as supplier.

### 7. Wrong-Chain Detection
- Banner appears if connected wallet is not on Arc Testnet (chain 5042002).
- One-click "Switch Network" button calls `useSwitchChain`.

### 8. Wallet Connection
- ConnectKit modal with Arc Testnet pre-configured.
- Landing page shown when disconnected; dashboard shown when connected.

## Planned / TBD

| Feature | Status |
|---|---|
| Onchain event indexer (sync to Postgres) | TBD |
| Invoice search / filter | TBD |
| Email / webhook notifications | TBD |
| Multi-invoice batch settle | TBD |
| Mainnet deployment | TBD |
