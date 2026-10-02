import { requireChain, getUsdc } from '@/onchain-facts'

export const ARC_TESTNET_CHAIN_ID = 5042002

export const ARC_CHAIN = requireChain(ARC_TESTNET_CHAIN_ID)
export const ARC_USDC = getUsdc(ARC_TESTNET_CHAIN_ID)!

/** Format an address for display: 0x1234...abcd */
export function shortAddr(addr: string): string {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return '—'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

/** Format a bigint USDC amount (6 decimals) as a USD string. */
export function formatUsdc6(raw: bigint): string {
  const dollars = Number(raw) / 1_000_000
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars)
}

/** Format a unix timestamp as a relative string. */
export function formatRelativeTime(ts: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000))
  const diff = ts - now
  if (diff <= 0n) return 'Expired'
  const secs = Number(diff)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`
  return `${Math.floor(secs / 86400)}d`
}

/** Format a unix timestamp as a locale date/time string. */
export function formatDateTime(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
