# Project Overview & Goals

## What is EarlyPay?

EarlyPay is an onchain B2B dynamic early-payment discount platform deployed on Arc Testnet.
Buyers post invoices with time-decaying USDC rebate tiers locked as collateral.
Suppliers settle early to claim a discount. The entire lifecycle is automated by the smart contract — no human approver, no custodian, no off-chain oracle.

## Core Value Proposition

| Problem | EarlyPay Solution |
|---|---|
| Buyers can't incentivise early payment without trusted intermediaries | USDC collateral locked in a trustless vault guarantees the rebate exists |
| Suppliers don't know how much they'll save until they call the bank | Live tier state is readable onchain, 24/7, with no login |
| Unpaid invoices tie up supplier cash flow | Settlement is permissionless — no approval needed from buyer |
| Expired invoices leave buyer collateral locked | Permissionless `expireInvoice` returns collateral to buyer with a single tx |

## Goals

1. **Trustless collateral lock** — buyers can never rug the rebate after posting.
2. **Time-decay discounts** — up to 3 tiers; earlier settlement = larger rebate.
3. **Automatic lifecycle** — contract drives OPEN → SETTLED | EXPIRED with no admin intervention.
4. **USDC-native on Arc** — single token for gas, collateral, and settlement.
5. **B2B dashboard UX** — dense, professional interface optimised for 1440px+ screens.

## Non-Goals

- No recurring billing / streaming payroll.
- No human approval step — reject any design that adds an approver.
- No multi-chain routing in v1.
- No fiat on/off-ramp integration.

## Deployment

| Item | Value |
|---|---|
| Chain | Arc Testnet (chain ID 5042002) |
| Contract | `DiscountVault` |
| Address | `0xf8a283ada5c99831b904d058291895d0e38c546b` |
| USDC | `0x3600000000000000000000000000000000000000` |
| Explorer | https://explorer.testnet.arc.io |
| GitHub | https://github.com/baothaith/earlypay |
