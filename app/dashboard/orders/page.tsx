'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import Link from 'next/link'
import {
  Package,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () =>
  typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

// ── Constants ─────────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  { value: 'PENDING_PAYMENT',   label: 'Pending Payment' },
  { value: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
  { value: 'PROCESSING',        label: 'Processing' },
  { value: 'READY_FOR_PICKUP',  label: 'Ready for Pickup' },
  { value: 'SHIPPED',           label: 'Shipped' },
  { value: 'OUT_FOR_DELIVERY',  label: 'Out for Delivery' },
  { value: 'DELIVERED',         label: 'Delivered' },
  { value: 'COMPLETED',         label: 'Completed' },
  { value: 'CANCELLED',         label: 'Cancelled' },
  { value: 'REFUNDED',          label: 'Refunded' },
] as const

type OrderStatus = typeof ORDER_STATUSES[number]['value']

const REFUNDABLE_STATUSES = new Set<OrderStatus>([
  'PAYMENT_CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
])

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT:   'bg-yellow-100 text-yellow-800',
  PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING:        'bg-purple-100 text-purple-800',
  READY_FOR_PICKUP:  'bg-cyan-100 text-cyan-800',
  SHIPPED:           'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY:  'bg-orange-100 text-orange-800',
  DELIVERED:         'bg-green-100 text-green-800',
  COMPLETED:         'bg-amber-100 text-amber-800',
  CANCELLED:         'bg-red-100 text-red-800',
  REFUNDED:          'bg-gray-100 text-gray-700',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderUser {
  id: string
  name?: string | null
  email: string
  phone?: string | null
}

interface Order {
  id: string
  orderNumber: string
  total: number
  currency: string
  status: string
  createdAt: string
  updatedAt?: string
  notes?: string | null
  shop?: { id: string; name: string } | null
  user?: OrderUser | null
  items: Array<{
    id: string
    product: { name: string; images: string[] }
    quantity: number
    priceAtPurchase: number
  }>
}

interface Shop {
  id: string
  name: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const isAdmin =
    session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'SHOP_ADMIN'

  // List state
  const [orders, setOrders] = useState<Order[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [shopFilter, setShopFilter] = useState<string>('ALL')

  // Inline status change
  const [changingStatus, setChangingStatus] = useState<Record<string, boolean>>({})

  // Refund dialog
  const [refundDialogOrderId, setRefundDialogOrderId] = useState<string | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)

  // Success toast
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Fetch orders ────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (shopFilter !== 'ALL') params.set('shopId', shopFilter)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`${B}/orders${qs}`, { headers: authHeaders() })
      if (res.status === 401) { router.push('/auth/login'); return }
      if (!res.ok) { setFetchError('Failed to load orders.'); return }
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setFetchError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, shopFilter, router])

  const fetchShops = useCallback(async () => {
    try {
      const res = await fetch(`${B}/shops`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setShops(Array.isArray(data) ? data : (data?.shops ?? []))
      }
    } catch {
      // Non-critical — shop filter just won't populate
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (session) {
      fetchOrders()
      if (isSuperAdmin) fetchShops()
    }
  }, [session, status, fetchOrders, isSuperAdmin, fetchShops])

  // ── Status change ───────────────────────────────────────────────────────────

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setChangingStatus((prev) => ({ ...prev, [orderId]: true }))
    try {
      const res = await fetch(`${B}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        showError(body?.message || 'Failed to update status.')
        return
      }
      const updated: Order = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      showSuccess('Order status updated.')
    } catch {
      showError('Network error. Please try again.')
    } finally {
      setChangingStatus((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  // ── Refund ──────────────────────────────────────────────────────────────────

  const openRefundDialog = (orderId: string) => {
    setRefundDialogOrderId(orderId)
    setRefundReason('')
    setRefundError(null)
  }

  const closeRefundDialog = () => {
    setRefundDialogOrderId(null)
    setRefundReason('')
    setRefundError(null)
  }

  const confirmRefund = async () => {
    if (!refundDialogOrderId) return
    setRefunding(true)
    setRefundError(null)
    try {
      const res = await fetch(`${B}/orders/${refundDialogOrderId}/refund`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ reason: refundReason.trim() || undefined }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setRefundError(body?.message || 'Failed to process refund.')
        return
      }
      const updated: Order = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === refundDialogOrderId ? updated : o)))
      showSuccess('Order marked as refunded.')
      closeRefundDialog()
    } catch {
      setRefundError('Network error. Please try again.')
    } finally {
      setRefunding(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3500)
  }

  const showError = (msg: string) => {
    setFetchError(msg)
    setTimeout(() => setFetchError(null), 4000)
  }

  const statusLabel = (s: string) =>
    ORDER_STATUSES.find((x) => x.value === s)?.label ?? s.replace(/_/g, ' ')

  // ── Render guards ────────────────────────────────────────────────────────────

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  // ── Page ─────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            {isAdmin ? 'Orders Management' : 'My Orders'}
          </h1>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="self-start sm:self-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="font-medium text-green-800">{successMsg}</p>
        </div>
      )}
      {fetchError && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="font-medium text-red-700">{fetchError}</p>
        </div>
      )}

      {/* Filters — admin only */}
      {isAdmin && (
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isSuperAdmin && shops.length > 0 && (
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
                  <Select value={shopFilter} onValueChange={setShopFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by shop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Shops</SelectItem>
                      {shops.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(statusFilter !== 'ALL' || shopFilter !== 'ALL') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-end"
                  onClick={() => { setStatusFilter('ALL'); setShopFilter('ALL') }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <Card className="border-0 shadow-lg text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {statusFilter !== 'ALL' ? `No orders with status "${statusLabel(statusFilter)}"` : 'No orders found'}
            </p>
            {!isAdmin && (
              <Link href="/products">
                <Button>Browse Products</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canRefund = REFUNDABLE_STATUSES.has(order.status as OrderStatus)
            const statusClass = STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'
            const customerName = order.user?.name || order.user?.email || '—'

            return (
              <Card key={order.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Order meta */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link href={`/dashboard/orders/${order.id}`} className="hover:underline">
                          <CardTitle className="text-lg text-amber-700 hover:text-amber-800">
                            #{order.orderNumber}
                          </CardTitle>
                        </Link>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        {isAdmin && order.user && (
                          <span>Customer: <span className="text-gray-700 font-medium">{customerName}</span></span>
                        )}
                        {isSuperAdmin && order.shop && (
                          <span>Shop: <span className="text-gray-700 font-medium">{order.shop.name}</span></span>
                        )}
                        <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Total */}
                    <p className="text-xl font-bold text-amber-600 shrink-0">
                      {order.currency || 'USD'} {order.total.toFixed(2)}
                    </p>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Item summary */}
                  <div className="text-sm text-gray-600 mb-4 space-y-0.5">
                    {order.items.map((item, i) => (
                      <div key={item.id ?? i} className="flex justify-between">
                        <span className="truncate pr-4">{item.product.name} × {item.quantity}</span>
                        <span className="shrink-0 font-medium">
                          {order.currency || 'USD'} {(item.priceAtPurchase * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2 items-center border-t pt-3">
                      {/* Inline status change */}
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Select
                          defaultValue={order.status}
                          onValueChange={(val) => handleStatusChange(order.id, val)}
                          disabled={changingStatus[order.id]}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {changingStatus[order.id] && (
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-amber-500 shrink-0" />
                        )}
                      </div>

                      {/* Refund button */}
                      {canRefund && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs"
                          onClick={() => openRefundDialog(order.id)}
                        >
                          Refund
                        </Button>
                      )}

                      {/* View detail link */}
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50">
                          View Detail
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Client: link only */}
                  {!isAdmin && (
                    <div className="flex justify-end border-t pt-3">
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50">
                          View Detail
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Refund Dialog */}
      <Dialog open={!!refundDialogOrderId} onOpenChange={(open) => { if (!open) closeRefundDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Mark this order as refunded? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Reason <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors"
              rows={3}
              placeholder="Enter refund reason…"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              disabled={refunding}
            />
            {refundError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {refundError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRefundDialog} disabled={refunding}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmRefund}
              disabled={refunding}
            >
              {refunding ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Processing…
                </span>
              ) : 'Confirm Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
