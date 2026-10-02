/**
 * useInvoiceList — fetch all invoice IDs for a buyer or supplier,
 * then load the fields + tiers + active tier for each.
 */
import { useReadContract, useReadContracts } from 'wagmi'
import { DISCOUNT_VAULT_ABI, DISCOUNT_VAULT_ADDRESS, InvoiceData, STATE_MAP } from '@/lib/discountVault'
import { ARC_TESTNET_CHAIN_ID } from '@/lib/constants'

type Role = 'buyer' | 'supplier'

export function useInvoiceList(address: `0x${string}` | undefined, role: Role) {
  const fnName = role === 'buyer' ? 'getInvoicesByBuyer' : 'getInvoicesBySupplier'

  const { data: ids, isLoading: idsLoading, refetch: refetchIds } = useReadContract({
    address: DISCOUNT_VAULT_ADDRESS,
    abi: DISCOUNT_VAULT_ABI,
    functionName: fnName,
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const invoiceIds = (ids ?? []) as bigint[]

  // Batch-read fields, tier windows, tier discounts, and current tier for every invoice.
  const contracts = invoiceIds.flatMap((id) => [
    {
      address: DISCOUNT_VAULT_ADDRESS,
      abi: DISCOUNT_VAULT_ABI,
      functionName: 'getInvoiceFields' as const,
      args: [id] as const,
      chainId: ARC_TESTNET_CHAIN_ID,
    },
    {
      address: DISCOUNT_VAULT_ADDRESS,
      abi: DISCOUNT_VAULT_ABI,
      functionName: 'getInvoiceTierWindows' as const,
      args: [id] as const,
      chainId: ARC_TESTNET_CHAIN_ID,
    },
    {
      address: DISCOUNT_VAULT_ADDRESS,
      abi: DISCOUNT_VAULT_ABI,
      functionName: 'getInvoiceTierDiscounts' as const,
      args: [id] as const,
      chainId: ARC_TESTNET_CHAIN_ID,
    },
    {
      address: DISCOUNT_VAULT_ADDRESS,
      abi: DISCOUNT_VAULT_ABI,
      functionName: 'getCurrentTier' as const,
      args: [id] as const,
      chainId: ARC_TESTNET_CHAIN_ID,
    },
  ])

  const { data: batch, isLoading: batchLoading, refetch: refetchBatch } = useReadContracts({
    contracts,
    query: { enabled: invoiceIds.length > 0 },
  })

  const invoices: InvoiceData[] = []

  if (batch && invoiceIds.length > 0) {
    for (let i = 0; i < invoiceIds.length; i++) {
      const base = i * 4
      const fields = batch[base]?.result as
        | [string, string, bigint, bigint, number, string, bigint, bigint, bigint]
        | undefined
      const windows = batch[base + 1]?.result as [bigint, bigint, bigint] | undefined
      const discounts = batch[base + 2]?.result as [number, number, number] | undefined
      const activeTier = batch[base + 3]?.result as [number, bigint, number] | undefined

      if (!fields) continue

      const tiers = []
      for (let t = 0; t < 3; t++) {
        const w = windows?.[t as 0 | 1 | 2] ?? 0n
        const d = discounts?.[t as 0 | 1 | 2] ?? 0
        if (w > 0n || d > 0) {
          tiers.push({ windowEnd: w, discountBps: d })
        }
      }

      invoices.push({
        id: invoiceIds[i],
        buyer: fields[0],
        supplier: fields[1],
        faceValue: fields[2],
        rebatePool: fields[3],
        state: STATE_MAP[fields[4]] ?? 'OPEN',
        settler: fields[5],
        settledAt: fields[6],
        rebatePaid: fields[7],
        expiresAt: fields[8],
        tiers,
        activeTierBps: activeTier?.[0],
        activeWindowEnd: activeTier?.[1],
      })
    }
  }

  const refetch = () => {
    void refetchIds()
    void refetchBatch()
  }

  return {
    invoices,
    isLoading: idsLoading || (invoiceIds.length > 0 && batchLoading),
    refetch,
    count: invoiceIds.length,
  }
}
