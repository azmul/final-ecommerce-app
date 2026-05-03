import type { CurrenciesConfig, Currency } from '@payloadcms/plugin-ecommerce/types'

/** Bangladeshi Taka — use narrowSymbol so en-US locale shows ৳ with Latin digits. */
export const BDT: Currency = {
  code: 'BDT',
  decimals: 2,
  label: 'Bangladeshi Taka',
  symbol: '৳',
  symbolDisplay: 'narrowSymbol' as Currency['symbolDisplay'],
}

export const ecommerceCurrenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'BDT',
  supportedCurrencies: [BDT],
}
