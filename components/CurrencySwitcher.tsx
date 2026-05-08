'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { DollarSign } from 'lucide-react'
import { clientApi } from '@/lib/api'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'USD' },
  { code: 'KWD', symbol: 'د.ك', name: 'KWD' },
  { code: 'AED', symbol: 'د.إ', name: 'AED' },
]

export function CurrencySwitcher() {
  const { data: session } = useSession()
  const [currentCurrency, setCurrentCurrency] = useState('USD')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})

  useEffect(() => {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem('currencyPreference') || 'USD'
    setCurrentCurrency(savedCurrency)

    // Fetch exchange rates from NestJS backend
    fetch(`${B}/currency/rates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setExchangeRates(data.data)
        }
      })
      .catch((err) => console.error('Error fetching exchange rates:', err))
  }, [])

  const handleCurrencyChange = async (currency: string) => {
    setCurrentCurrency(currency)
    localStorage.setItem('currencyPreference', currency)

    // Update user preference if logged in
    if (session?.user) {
      try {
        await clientApi('/users/profile', {
          method: 'PUT',
          body: JSON.stringify({ currencyPreference: currency }),
        })
      } catch (error) {
        console.error('Error updating currency preference:', error)
      }
    }

    // Trigger currency change event for other components
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: currency }))
  }

  const currentCurrencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currentCurrency)

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 text-gray-700 hover:text-amber-600"
      >
        <DollarSign className="h-4 w-4" />
        <span className="hidden sm:inline">{currentCurrencyInfo?.symbol || '$'}</span>
        <span className="sm:hidden">{currentCurrencyInfo?.code || 'USD'}</span>
      </Button>
      <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="py-2">
          {SUPPORTED_CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 transition-colors ${
                currentCurrency === currency.code
                  ? 'bg-amber-50 text-amber-600 font-semibold'
                  : 'text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{currency.symbol} {currency.name}</span>
                {exchangeRates[currency.code] && currency.code !== 'USD' && (
                  <span className="text-xs text-gray-500">
                    1 USD = {exchangeRates[currency.code].toFixed(4)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
