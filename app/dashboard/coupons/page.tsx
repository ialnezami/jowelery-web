'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Tag } from 'lucide-react'
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

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface Coupon {
  id: string
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount: number | null
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

const defaultForm = () => ({
  code: '',
  discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  discountValue: '',
  minOrderAmount: '',
  maxUses: '',
  expiresAt: '',
})

function authHeaders(): HeadersInit {
  const token = (window as any).__JWT
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export default function CouponsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

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
      fetchCoupons()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${B}/coupons`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setCoupons(Array.isArray(data?.coupons) ? data.coupons : Array.isArray(data) ? data : [])
    } catch (err) {
      toast({ title: 'Failed to load coupons', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.code.trim() || !form.discountValue) {
      toast({ title: 'Code and discount value are required', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
      }
      if (form.minOrderAmount) body.minOrderAmount = Number(form.minOrderAmount)
      if (form.maxUses) body.maxUses = Number(form.maxUses)
      if (form.expiresAt) body.expiresAt = form.expiresAt

      const res = await fetch(`${B}/coupons`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `HTTP ${res.status}`)
      }
      toast({ title: 'Coupon created successfully' })
      setDialogOpen(false)
      setForm(defaultForm())
      fetchCoupons()
    } catch (err: any) {
      toast({ title: err.message || 'Failed to create coupon', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon.id)
    try {
      const res = await fetch(`${B}/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast({ title: `Coupon ${coupon.isActive ? 'deactivated' : 'activated'}` })
      fetchCoupons()
    } catch (err: any) {
      toast({ title: 'Failed to update coupon', variant: 'destructive' })
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`${B}/coupons/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast({ title: 'Coupon deleted' })
      fetchCoupons()
    } catch (err: any) {
      toast({ title: 'Failed to delete coupon', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Coupons
          </h1>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
        <p className="text-gray-500 mt-1">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
      </div>

      {coupons.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center text-gray-500">
            <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No coupons yet</p>
            <p className="text-sm mt-1">Create your first coupon to offer discounts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="border-0 shadow-md">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-bold text-gray-900 font-mono">{coupon.code}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountValue}% off`
                          : `$${coupon.discountValue} off`}
                      </span>
                      {coupon.minOrderAmount != null && (
                        <span>Min order: ${coupon.minOrderAmount}</span>
                      )}
                      <span>
                        Used: {coupon.usedCount}
                        {coupon.maxUses != null ? `/${coupon.maxUses}` : ''}
                      </span>
                      {coupon.expiresAt && (
                        <span>
                          Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(coupon)}
                      disabled={togglingId === coupon.id}
                      className="text-xs"
                    >
                      {togglingId === coupon.id
                        ? '...'
                        : coupon.isActive
                        ? 'Deactivate'
                        : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                      disabled={deletingId === coupon.id}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      {deletingId === coupon.id ? (
                        '...'
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. SUMMER20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {(['PERCENTAGE', 'FIXED'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discountType"
                      value={t}
                      checked={form.discountType === t}
                      onChange={() => setForm((f) => ({ ...f, discountType: t }))}
                      className="accent-amber-600"
                    />
                    <span className="text-sm">{t === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed ($)'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                placeholder={form.discountType === 'PERCENTAGE' ? '10 (%)' : '5.00 ($)'}
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Min Order Amount (optional)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 50"
                value={form.minOrderAmount}
                onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Max Uses (optional)
              </label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Expires At (optional)
              </label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(defaultForm()) }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {submitting ? 'Creating...' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
