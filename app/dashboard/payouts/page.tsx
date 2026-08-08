'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calculator, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface Payout {
  id: string
  shopId: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'FAILED'
  periodStart: string
  periodEnd: string
  notes: string | null
  paidAt: string | null
  createdAt: string
  shop: { id: string; name: string }
}

interface CalcResult {
  shopId: string
  periodStart: string
  periodEnd: string
  commissionRate: number
  totalRevenue: number
  commissionAmount: number
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700' },
  PAID: { bg: 'bg-green-100', text: 'text-green-700' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-600' },
}

const defaultCreateForm = () => ({
  shopId: '',
  amount: '',
  periodStart: '',
  periodEnd: '',
  notes: '',
})

const defaultCalcForm = () => ({
  shopId: '',
  periodStart: '',
  periodEnd: '',
})

function authHeaders(): HeadersInit {
  const token = (window as any).__JWT
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export default function PayoutsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(defaultCreateForm())
  const [calcForm, setCalcForm] = useState(defaultCalcForm())
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated' && session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
      return
    }
    if (session) {
      fetchPayouts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchPayouts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${B}/payouts`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setPayouts(Array.isArray(data?.payouts) ? data.payouts : Array.isArray(data) ? data : [])
    } catch (err) {
      toast({ title: 'Failed to load payouts', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.shopId || !createForm.amount || !createForm.periodStart || !createForm.periodEnd) {
      toast({ title: 'Shop ID, amount, and period are required', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        shopId: createForm.shopId,
        amount: Number(createForm.amount),
        periodStart: createForm.periodStart,
        periodEnd: createForm.periodEnd,
      }
      if (createForm.notes.trim()) body.notes = createForm.notes.trim()

      const res = await fetch(`${B}/payouts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `HTTP ${res.status}`)
      }
      toast({ title: 'Payout created' })
      setCreateOpen(false)
      setCreateForm(defaultCreateForm())
      fetchPayouts()
    } catch (err: any) {
      toast({ title: err.message || 'Failed to create payout', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    if (!confirm('Mark this payout as paid? This confirms funds were transferred.')) return
    setMarkingId(id)
    try {
      const res = await fetch(`${B}/payouts/${id}/mark-paid`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast({ title: 'Payout marked as paid' })
      fetchPayouts()
    } catch (err: any) {
      toast({ title: 'Failed to update payout', variant: 'destructive' })
    } finally {
      setMarkingId(null)
    }
  }

  const handleCalculate = async () => {
    if (!calcForm.shopId || !calcForm.periodStart || !calcForm.periodEnd) {
      toast({ title: 'All fields required for calculation', variant: 'destructive' })
      return
    }
    setCalcLoading(true)
    setCalcResult(null)
    try {
      const res = await fetch(`${B}/payouts/calculate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(calcForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `HTTP ${res.status}`)
      }
      const result = await res.json()
      setCalcResult(result)
    } catch (err: any) {
      toast({ title: err.message || 'Calculation failed', variant: 'destructive' })
    } finally {
      setCalcLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  const pending = payouts.filter((p) => p.status === 'PENDING')
  const paid = payouts.filter((p) => p.status === 'PAID')

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Payouts
            </h1>
            <p className="text-gray-500 mt-1">
              {pending.length} pending · {paid.length} paid
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setCalcResult(null); setCalcForm(defaultCalcForm()); setCalcOpen(true) }}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Payout
            </Button>
          </div>
        </div>
      </div>

      {payouts.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No payouts yet</p>
            <p className="text-sm mt-1">Create the first payout for a shop.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payouts.map((payout) => {
            const style = STATUS_STYLES[payout.status] ?? STATUS_STYLES.PENDING
            return (
              <Card key={payout.id} className="border-0 shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{payout.shop?.name ?? payout.shopId}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
                        >
                          {payout.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(payout.periodStart).toLocaleDateString()} –{' '}
                        {new Date(payout.periodEnd).toLocaleDateString()}
                      </p>
                      {payout.notes && (
                        <p className="text-sm text-gray-500 mt-0.5">{payout.notes}</p>
                      )}
                      {payout.paidAt && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Paid on {new Date(payout.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {payout.currency || 'USD'} {payout.amount.toFixed(2)}
                        </p>
                      </div>
                      {payout.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(payout.id)}
                          disabled={markingId === payout.id}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          {markingId === payout.id ? '...' : 'Mark Paid'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Payout Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Shop ID <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Shop ID"
                value={createForm.shopId}
                onChange={(e) => setCreateForm((f) => ({ ...f, shopId: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Amount (USD) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={createForm.amount}
                onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={createForm.periodStart}
                  onChange={(e) => setCreateForm((f) => ({ ...f, periodStart: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Period End <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={createForm.periodEnd}
                  onChange={(e) => setCreateForm((f) => ({ ...f, periodEnd: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Notes (optional)
              </label>
              <Input
                placeholder="Optional notes"
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setCreateForm(defaultCreateForm()) }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {submitting ? 'Creating...' : 'Create Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculate Commission Dialog */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Calculate Commission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Shop ID <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Shop ID"
                value={calcForm.shopId}
                onChange={(e) => setCalcForm((f) => ({ ...f, shopId: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Period Start <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={calcForm.periodStart}
                  onChange={(e) => setCalcForm((f) => ({ ...f, periodStart: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Period End <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={calcForm.periodEnd}
                  onChange={(e) => setCalcForm((f) => ({ ...f, periodEnd: e.target.value }))}
                />
              </div>
            </div>
            {calcResult && (
              <Card className="border border-amber-200 bg-amber-50">
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold">${calcResult.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission Rate</span>
                    <span className="font-semibold">{calcResult.commissionRate}%</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-200 pt-2">
                    <span className="font-bold text-amber-700">Commission Amount</span>
                    <span className="font-bold text-amber-700">${calcResult.commissionAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalcOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleCalculate}
              disabled={calcLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {calcLoading ? 'Calculating...' : 'Calculate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
