'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  PENDING_QUOTE: 'bg-blue-100 text-blue-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  IN_REVIEW: 'bg-sky-100 text-sky-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function GoldOffersPage() {
  const [offers, setOffers] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [quote, setQuote] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/gold-sale-offers')
      setOffers(Array.isArray(res) ? res : res?.offers ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submitQuote = async () => {
    const val = parseFloat(quote)
    if (!selected || isNaN(val) || val <= 0) return
    setActing(true)
    try {
      await api.patch(`/gold-sale-offers/${selected.id}/quote`, { shopQuote: val })
      await load()
      setSelected(null)
      setQuote('')
    } finally {
      setActing(false)
    }
  }

  const advance = async (status: 'IN_REVIEW' | 'PAID') => {
    if (!selected) return
    setActing(true)
    try {
      await api.patch(`/gold-sale-offers/${selected.id}/status`, { status })
      await load()
      setSelected(null)
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-amber-700 mb-6">Gold Purchase Offers</h1>

      {offers.length === 0 && (
        <p className="text-gray-500">No offers assigned to your shop yet.</p>
      )}

      <div className="space-y-3">
        {offers.map((o) => (
          <div
            key={o.id}
            className="bg-white border rounded-xl p-4 cursor-pointer hover:border-amber-400 transition"
            onClick={() => { setSelected(o); setQuote('') }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{o.karat} · {o.weightGrams}g · {o.client?.name}</p>
                <p className="text-sm text-gray-500">{o.condition}</p>
                <p className="text-sm text-gray-500">Est. ${o.estimatedPrice?.toFixed(2)}
                  {o.shopQuote != null && <> · Your quote: <strong>${o.shopQuote.toFixed(2)}</strong></>}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100'}`}>
                {o.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 space-y-4">
            <div className="flex justify-between">
              <h2 className="text-lg font-bold text-gray-800">{selected.karat} · {selected.weightGrams}g</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="text-sm space-y-1 text-gray-700">
              <p><strong>Client:</strong> {selected.client?.name} · {selected.client?.email}</p>
              <p><strong>Condition:</strong> {selected.condition}</p>
              {selected.notes && <p><strong>Notes:</strong> {selected.notes}</p>}
              <p><strong>Estimated price:</strong> ${selected.estimatedPrice?.toFixed(2)}</p>
              {selected.shopQuote != null && <p><strong>Your quote:</strong> ${selected.shopQuote.toFixed(2)}</p>}
            </div>

            {selected.images?.length > 0 && (
              <div className="flex gap-2">
                {selected.images.map((url: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="gold" className="w-20 h-20 object-cover rounded-lg" />
                ))}
              </div>
            )}

            {selected.status === 'PENDING_QUOTE' && (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Your quote ($)"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={submitQuote}
                  disabled={acting}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Send Quote
                </button>
              </div>
            )}

            {selected.status === 'ACCEPTED' && (
              <button
                onClick={() => advance('IN_REVIEW')}
                disabled={acting}
                className="w-full bg-sky-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Mark In Review
              </button>
            )}

            {selected.status === 'IN_REVIEW' && (
              <button
                onClick={() => advance('PAID')}
                disabled={acting}
                className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Mark Paid
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
