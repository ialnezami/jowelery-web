'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { DollarSign, RefreshCw, Save, ArrowLeft, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () => typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

interface GoldRate {
  karat: string
  rate: number
  currency: string
  timestamp: Date | string
}

export default function GoldRatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [goldRates, setGoldRates] = useState<GoldRate[]>([])
  const [editingRates, setEditingRates] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (session && session.user.role === 'SUPER_ADMIN') {
      fetchGoldRates()
    } else if (session) {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchGoldRates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${B}/gold-rates`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        const rates = (Array.isArray(data) ? data : Object.values(data)) as GoldRate[]
        setGoldRates(rates)
        // Initialize editing rates with current values
        const editing: Record<string, string> = {}
        rates.forEach((rate: GoldRate) => {
          editing[rate.karat] = rate.rate.toFixed(2)
        })
        setEditingRates(editing)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch gold rates',
        })
      }
    } catch (error) {
      console.error('Error fetching gold rates:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch gold rates',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncRates = async () => {
    try {
      setSyncing(true)
      const response = await fetch(`${B}/gold-rates/sync`, {
        method: 'POST',
        headers: authHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: data.message || 'Gold rates synced and product prices updated',
        })
        // Refresh rates after sync
        await fetchGoldRates()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to sync gold rates',
        })
      }
    } catch (error) {
      console.error('Error syncing gold rates:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sync gold rates',
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleUpdateRate = async (karat: string) => {
    const rateValue = parseFloat(editingRates[karat])
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Rate',
        description: 'Please enter a valid positive number',
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`${B}/gold-rates`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          karat,
          rate: rateValue,
          currency: 'USD',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${karat} rate updated successfully`,
        })
        await fetchGoldRates()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to update gold rate',
        })
      }
    } catch (error) {
      console.error('Error updating gold rate:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update gold rate',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRateChange = (karat: string, value: string) => {
    setEditingRates((prev) => ({
      ...prev,
      [karat]: value,
    }))
  }

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gold Rates Management</h1>
        <p className="text-gray-600">Manage gold rates for different karats. Rates are in USD per gram.</p>
      </div>

      {/* Sync Button */}
      <Card className="mb-6 border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Sync from External API</h3>
              <p className="text-sm text-gray-600">
                Fetch latest gold rates from external API and automatically recalculate all product prices
              </p>
            </div>
            <Button
              onClick={handleSyncRates}
              disabled={syncing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Rates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gold Rates Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-500" />
            Current Gold Rates
          </CardTitle>
          <CardDescription>
            Rates are displayed in USD per gram. Click Save to update a rate manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Karat</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Rate (USD/g)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Updated</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {goldRates.map((rate) => (
                  <tr key={rate.karat} className="border-b hover:bg-amber-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{rate.karat}</span>
                        <span className="text-xs text-gray-500">
                          ({rate.karat === 'K24' ? '24k' : rate.karat === 'K22' ? '22k' : rate.karat === 'K21' ? '21k' : rate.karat === 'K18' ? '18k' : '14k'} - Pure Gold)
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingRates[rate.karat] || ''}
                        onChange={(e) => handleRateChange(rate.karat, e.target.value)}
                        className="w-32"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimestamp(rate.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateRate(rate.karat)}
                          disabled={saving || editingRates[rate.karat] === rate.rate.toFixed(2)}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {goldRates.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No gold rates found. Click the Sync Rates button to fetch from external API.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 border-0 shadow-md bg-amber-50/50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">How Gold Rates Work</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Gold rates are fetched from an external API and stored in the database</li>
            <li>When rates are synced, all product prices are automatically recalculated</li>
            <li>You can manually update individual rates by editing the value and clicking Save</li>
            <li>Rates are displayed in USD per gram</li>
            <li>K24 is the purest form (24 karat), with other karats calculated based on purity ratios</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

