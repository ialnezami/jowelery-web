'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import Image from 'next/image'
import {
  ArrowLeft,
  Download,
  Package,
  XCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  User,
  Save,
} from 'lucide-react'
import { OrderTimeline } from '@/components/OrderTimeline'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

/** Statuses where the client is still allowed to cancel */
const CANCELLABLE_STATUSES = new Set(['PENDING_PAYMENT', 'PAYMENT_CONFIRMED'])

/** Statuses where admin can issue a refund */
const REFUNDABLE_STATUSES = new Set([
  'PAYMENT_CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
])

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

function getToken(): string | undefined {
  return typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
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
  paymentMethod: string | null
  paymentStatus: string | null
  notes?: string | null
  shippingAddress: {
    firstName?: string
    lastName?: string
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    phone?: string
    email?: string
  } | null
  billingAddress: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  user?: OrderUser | null
  items: Array<{
    id: string
    quantity: number
    priceAtPurchase: number
    product: {
      id: string
      name: string
      images: string[]
      sku: string
    }
  }>
}

// ── Status styles ─────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()

  const isAdmin =
    session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'SHOP_ADMIN'

  // Data
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Client cancel
  const [cancelling, setCancelling] = useState(false)

  // Admin status update
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Admin notes
  const [notesValue, setNotesValue] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesDirty, setNotesDirty] = useState(false)

  // Refund dialog
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)

  // Success
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // ── Fetch order ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (session && params.id) fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const res = await fetch(`${B}/orders/${params.id}`, { headers: authHeaders() })
      if (res.status === 401) { router.push('/auth/login'); return }
      if (res.status === 403) { setFetchError('You do not have permission to view this order.'); return }
      if (res.status === 404) { setFetchError('Order not found.'); return }
      if (!res.ok) { setFetchError('Failed to load order. Please try again.'); return }
      const data: Order = await res.json()
      setOrder(data)
      setSelectedStatus(data.status)
      setNotesValue(data.notes ?? '')
      setNotesDirty(false)
    } catch {
      setFetchError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setActionError(null)
    setTimeout(() => setSuccessMsg(null), 3500)
  }

  const showActionError = (msg: string) => {
    setActionError(msg)
    setTimeout(() => setActionError(null), 4000)
  }

  // ── Client cancel ────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      const res = await fetch(`${B}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        showActionError(body?.message || 'Failed to cancel order.')
        return
      }
      const updated: Order = await res.json()
      setOrder(updated)
      setSelectedStatus(updated.status)
    } catch {
      showActionError('Network error. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  // ── Admin status update ──────────────────────────────────────────────────────

  const handleStatusUpdate = async () => {
    if (!order || !selectedStatus || selectedStatus === order.status) return
    setStatusUpdating(true)
    try {
      const res = await fetch(`${B}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: selectedStatus }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        showActionError(body?.message || 'Failed to update status.')
        return
      }
      const updated: Order = await res.json()
      setOrder(updated)
      setSelectedStatus(updated.status)
      showSuccess('Order status updated.')
    } catch {
      showActionError('Network error. Please try again.')
    } finally {
      setStatusUpdating(false)
    }
  }

  // ── Admin notes save ─────────────────────────────────────────────────────────

  const handleSaveNotes = async () => {
    if (!order) return
    setNotesSaving(true)
    try {
      const res = await fetch(`${B}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: order.status, notes: notesValue }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        showActionError(body?.message || 'Failed to save notes.')
        return
      }
      const updated: Order = await res.json()
      setOrder(updated)
      setNotesValue(updated.notes ?? '')
      setNotesDirty(false)
      showSuccess('Notes saved.')
    } catch {
      showActionError('Network error. Please try again.')
    } finally {
      setNotesSaving(false)
    }
  }

  // ── Refund ───────────────────────────────────────────────────────────────────

  const openRefundDialog = () => {
    setRefundReason('')
    setRefundError(null)
    setRefundDialogOpen(true)
  }

  const closeRefundDialog = () => {
    setRefundDialogOpen(false)
    setRefundReason('')
    setRefundError(null)
  }

  const confirmRefund = async () => {
    if (!order) return
    setRefunding(true)
    setRefundError(null)
    try {
      const res = await fetch(`${B}/orders/${order.id}/refund`, {
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
      setOrder(updated)
      setSelectedStatus(updated.status)
      showSuccess('Order marked as refunded.')
      closeRefundDialog()
    } catch {
      setRefundError('Network error. Please try again.')
    } finally {
      setRefunding(false)
    }
  }

  // ── Invoice download ─────────────────────────────────────────────────────────

  const handleDownloadInvoice = async () => {
    if (!order) return
    try {
      const res = await fetch(`${B}/orders/${order.id}/invoice`, { headers: authHeaders() })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${order.orderNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch {
      // Non-critical — skip
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  // ── Fetch error ──────────────────────────────────────────────────────────────

  if (fetchError && !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
            <p className="text-red-700 font-medium">{fetchError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Order not found</p>
        <Link href="/dashboard/orders">
          <Button className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    )
  }

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED'
  const isRefunded  = order.status === 'REFUNDED'
  const canCancel   = !isAdmin && CANCELLABLE_STATUSES.has(order.status)
  const canRefund   = isAdmin && REFUNDABLE_STATUSES.has(order.status)
  const statusClass = STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'
  const statusDirty = selectedStatus !== order.status

  const statusLabel = (s: string) =>
    ORDER_STATUSES.find((x) => x.value === s)?.label ?? s.replace(/_/g, ' ')

  const customerName =
    order.user?.name ||
    (order.shippingAddress?.firstName
      ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName ?? ''}`.trim()
      : null) ||
    '—'

  // ── Page ─────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-500 mt-2">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusClass}`}>
              {statusLabel(order.status)}
            </span>
            <Button onClick={handleDownloadInvoice} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="font-medium text-green-800">{successMsg}</p>
        </div>
      )}
      {actionError && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="font-medium text-red-700">{actionError}</p>
        </div>
      )}

      {/* Cancelled / Refunded banner */}
      {isCancelled && (
        <Card className={`mb-6 border-2 ${isRefunded ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            {isRefunded
              ? <RefreshCw className="h-5 w-5 text-gray-500 shrink-0" />
              : <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
            <div>
              <p className={`font-semibold ${isRefunded ? 'text-gray-700' : 'text-red-700'}`}>
                {isRefunded ? 'This order has been refunded' : 'This order has been cancelled'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Admin management panel */}
          {isAdmin && (
            <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Status update */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Change Order Status
                  </label>
                  <div className="flex gap-2">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={!statusDirty || statusUpdating}
                      className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                    >
                      {statusUpdating ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      ) : (
                        <><Save className="h-4 w-4 mr-1.5" />Save</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Refund */}
                {canRefund && (
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      onClick={openRefundDialog}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Issue Refund
                    </Button>
                  </div>
                )}

                {/* Admin notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Admin Notes
                  </label>
                  <textarea
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    rows={3}
                    placeholder="Internal notes (not visible to customer)…"
                    value={notesValue}
                    onChange={(e) => { setNotesValue(e.target.value); setNotesDirty(true) }}
                    disabled={notesSaving}
                  />
                  {notesDirty && (
                    <Button
                      size="sm"
                      className="mt-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={handleSaveNotes}
                      disabled={notesSaving}
                    >
                      {notesSaving ? (
                        <span className="flex items-center gap-2">
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" />
                          Saving…
                        </span>
                      ) : (
                        <><Save className="h-3.5 w-3.5 mr-1" />Save Notes</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order tracking timeline */}
          {!isCancelled && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Order Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline
                  status={order.status}
                  createdAt={order.createdAt}
                  updatedAt={order.updatedAt}
                />
              </CardContent>
            </Card>
          )}

          {/* Order items */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <div className="relative w-20 h-20 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.product.name}</h3>
                      {item.product.sku && (
                        <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      )}
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">
                        ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${item.priceAtPurchase.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Client cancel */}
          {canCancel && (
            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-500" />
                  Cancelling…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </span>
              )}
            </Button>
          )}
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Customer info — admin only */}
          {isAdmin && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-600" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-right">{customerName}</span>
                </div>
                {order.user?.email && (
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 shrink-0">Email</span>
                    <a
                      href={`mailto:${order.user.email}`}
                      className="font-medium text-amber-600 hover:underline truncate text-right"
                    >
                      {order.user.email}
                    </a>
                  </div>
                )}
                {(order.user?.phone || order.shippingAddress?.phone) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium">
                      {order.user?.phone ?? order.shippingAddress?.phone}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order summary */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold capitalize">
                  {order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>
              {order.paymentStatus && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className="font-semibold capitalize">{order.paymentStatus}</span>
                </div>
              )}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          {order.shippingAddress && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 space-y-1">
                  {(order.shippingAddress.firstName || order.shippingAddress.lastName) && (
                    <p className="font-semibold">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                  )}
                  {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                  {(order.shippingAddress.city || order.shippingAddress.state) && (
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                    </p>
                  )}
                  {(order.shippingAddress.zipCode || order.shippingAddress.country) && (
                    <p>{order.shippingAddress.zipCode} {order.shippingAddress.country}</p>
                  )}
                  {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                  {order.shippingAddress.email && <p>Email: {order.shippingAddress.email}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="h-12" />

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={(open) => { if (!open) closeRefundDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Mark order #{order.orderNumber} as refunded? This action cannot be undone.
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
