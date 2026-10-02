# EarlyPay Documentation

Onchain B2B Dynamic Early Payment Discount Platform on Arc Testnet.

## Documents

| # | Title | Description |
|---|---|---|
| [01](./01-overview.md) | Project Overview & Goals | What EarlyPay is, why it exists, deployment info |
| [02](./02-features.md) | Features | Implemented features and planned roadmap |
| [03](./03-feature-specs.md) | Feature Specifications | Detailed inputs, flows, and error states per feature |
| [04](./04-tech-stack.md) | Tech Stack | All technologies, versions, and infrastructure |
| [05](./05-design-system.md) | Design System | Color tokens, typography, spacing, component classes |
| [06](./06-ui-ux-guidelines.md) | UI/UX Guidelines | Layout rules, interaction patterns, do/don't |
| [07](./07-naming-conventions.md) | Naming Conventions | TypeScript, Solidity, database, file/folder structure |
| [08](./08-coding-style.md) | Coding Style | Language-specific style rules |
| [09](./09-coding-rules.md) | Coding Rules | Hard rules, security invariants |
| [10](./10-commit-conventions.md) | Commit Conventions | Conventional commits format and examples |
| [11](./11-code-review.md) | Code Review Process | PR checklist and merge policy |
| [12](./12-quality-standards.md) | Quality Standards | Definition of done, tooling commands, known debt |

## Quick Reference

```bash
# Frontend
bun run check          # lint + typecheck
bunx vite build        # production build

# Contracts
bun run contracts:build   # forge build
bun run contracts:test    # forge test

# Database
bun run db:migrate     # apply schema
bun run db:verify      # verify tables
```

## Deployed Contract

`DiscountVault` on Arc Testnet:
`0xf8a283ada5c99831b904d058291895d0e38c546b`

Explorer: https://explorer.testnet.arc.io/address/0xf8a283ada5c99831b904d058291895d0e38c546b
