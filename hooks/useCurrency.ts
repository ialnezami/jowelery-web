'use client'

import { useEffect, useState, useCallback } from 'react'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'
const CACHE_TTL_MS = 3600 * 1000

interface CurrencyRecord {
  code: string
  symbol: string
  exchangeRateToBase: number
}

let _cached: CurrencyRecord[] | null = null
let _cacheTime = 0

const FALLBACK: CurrencyRecord[] = [
  { code: 'USD', symbol: '$',    exchangeRateToBase: 1.0 },
  { code: 'KWD', symbol: 'KWD', exchangeRateToBase: 0.31 },
  { code: 'AED', symbol: 'AED', exchangeRateToBase: 3.67 },
  { code: 'SAR', symbol: 'SAR', exchangeRateToBase: 3.75 },
  { code: 'EUR', symbol: '€',   exchangeRateToBase: 0.92 },
  { code: 'GBP', symbol: '£',   exchangeRateToBase: 0.79 },
]

async function fetchCurrencies(): Promise<CurrencyRecord[]> {
  if (_cached && Date.now() - _cacheTime < CACHE_TTL_MS) return _cached
  try {
    const res = await fetch(`${B}/currencies`, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`currencies fetch failed: ${res.status}`)
    const json = await res.json()
    const list: CurrencyRecord[] = Array.isArray(json) ? json : (json?.data ?? [])
    if (list.length === 0) throw new Error('empty currencies response')
    _cached = list
    _cacheTime = Date.now()
    return list
  } catch {
    return FALLBACK
  }
}

export function useCurrency() {
  const [currencies, setCurrencies] = useState<CurrencyRecord[]>(FALLBACK)
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? (localStorage.getItem('currencyPreference') ?? 'USD')
        : 'USD'
    setCurrency(saved)
    fetchCurrencies().then(setCurrencies)

    const onChanged = (e: Event) => {
      const code = (e as CustomEvent<string>).detail
      setCurrency(code)
      localStorage.setItem('currencyPreference', code)
    }
    window.addEventListener('currencyChanged', onChanged)
    return () => window.removeEventListener('currencyChanged', onChanged)
  }, [])

  const activeCurrency = currencies.find(c => c.code === currency) ?? currencies[0]

  const format = useCallback(
    (usdAmount: number): string => {
      if (!activeCurrency) return `$${usdAmount.toFixed(2)}`
      const converted = usdAmount * activeCurrency.exchangeRateToBase
      return `${activeCurrency.symbol} ${converted.toFixed(2)}`
    },
    [activeCurrency]
  )

  return {
    currency,
    currencies,
    symbol: activeCurrency?.symbol ?? '$',
    format,
  }
}
