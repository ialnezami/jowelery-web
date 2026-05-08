'use client'

import { useEffect, useState, useCallback } from 'react'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  KWD: 'د.ك',
  AED: 'د.إ',
}

const FALLBACK_RATES: Record<string, number> = { USD: 1.0, KWD: 0.3077, AED: 3.67 }
const CACHE_TTL_MS = 3600 * 1000

let _cachedRates: Record<string, number> | null = null
let _cacheTime = 0

async function fetchRates(): Promise<Record<string, number>> {
  if (_cachedRates && Date.now() - _cacheTime < CACHE_TTL_MS) return _cachedRates
  try {
    const res = await fetch(`${B}/currency/rates`)
    if (!res.ok) throw new Error()
    const json = await res.json()
    _cachedRates = json.data ?? FALLBACK_RATES
    _cacheTime = Date.now()
    return _cachedRates!
  } catch {
    return FALLBACK_RATES
  }
}

export function useCurrency() {
  const [currency, setCurrency] = useState('USD')
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)

  useEffect(() => {
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem('currencyPreference') ?? 'USD'
      : 'USD'
    setCurrency(saved)
    fetchRates().then(setRates)

    const onCurrencyChanged = (e: Event) => {
      setCurrency((e as CustomEvent<string>).detail)
    }
    window.addEventListener('currencyChanged', onCurrencyChanged)
    return () => window.removeEventListener('currencyChanged', onCurrencyChanged)
  }, [])

  const format = useCallback(
    (usdAmount: number): string => {
      const rate = rates[currency] ?? 1
      const converted = usdAmount * rate
      const symbol = CURRENCY_SYMBOLS[currency] ?? '$'
      return `${symbol}${converted.toFixed(2)}`
    },
    [currency, rates]
  )

  return { currency, symbol: CURRENCY_SYMBOLS[currency] ?? '$', format }
}
