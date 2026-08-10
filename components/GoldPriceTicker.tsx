'use client'

import { useEffect, useState } from 'react'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

type Rates = Record<string, number>

const SUB_KARATS = [
  { key: 'K22', label: '22K' },
  { key: 'K21', label: '21K' },
  { key: 'K18', label: '18K' },
]

const STYLE = { backgroundColor: 'rgba(146, 64, 14, 0.93)', border: '1px solid rgba(253, 230, 138, 0.3)' }

export function GoldPriceTicker() {
  const [rates, setRates] = useState<Rates>({})
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`${B}/gold-rates`)
        if (!res.ok) return
        const body = await res.json()
        const obj = body?.data || body
        const r: Rates = {}
        for (const k of ['K24', 'K22', 'K21', 'K18']) {
          if (typeof obj?.[k]?.rate === 'number') r[k] = obj[k].rate
        }
        if (!cancelled && r.K24) setRates(r)
      } catch {
        // fail silently
      }
    }

    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (!rates.K24) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-1.5">
      {/* Sub-karats — expand upward from base */}
      {expanded && SUB_KARATS.map(({ key, label }) =>
        rates[key] ? (
          <div
            key={key}
            className="flex flex-col items-center rounded-xl px-3 py-2 shadow-md pointer-events-none"
            style={STYLE}
          >
            <span className="text-[10px] font-bold tracking-widest text-amber-200">{label} GOLD</span>
            <span className="text-sm font-bold text-white leading-tight">
              ${rates[key].toFixed(2)}
              <span className="text-[10px] font-normal text-amber-200">/g</span>
            </span>
          </div>
        ) : null
      )}

      {/* Base K24 button — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex flex-col items-center rounded-xl px-3 py-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
        style={STYLE}
      >
        <span className="text-[10px] font-bold tracking-widest text-amber-200">
          24K GOLD {expanded ? '▾' : '▸'}
        </span>
        <span className="text-sm font-bold text-white leading-tight">
          ${rates.K24.toFixed(2)}
          <span className="text-[10px] font-normal text-amber-200">/g</span>
        </span>
      </button>
    </div>
  )
}
