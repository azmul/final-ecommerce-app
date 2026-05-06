import { ecommerceCurrenciesConfig } from '@/lib/ecommerceCurrency'

/** Shipment admin fields are entered in major units (taka); cart / Price use plugin minor units. */
export function shipmentMajorToStoreMinor(amountMajor: number, currencyCode: string): number {
  const c = ecommerceCurrenciesConfig.supportedCurrencies.find(
    (x) => x.code.toLowerCase() === currencyCode.toLowerCase(),
  )
  const d = c?.decimals ?? 2
  const n = Number(amountMajor)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 10 ** d)
}
