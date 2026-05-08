'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Download, Package, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { OrderTimeline } from '@/components/OrderTimeline'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

/** Statuses where the client is still allowed to cancel */
const CANCELLABLE_STATUSES = new Set(['PENDING_PAYMENT', 'PAYMENT_CONFIRMED'])

function getToken(): string | undefined {
  return (window as any).__JWT as string | undefined
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface Order {
  id: string
  orderNumber: string
  total: number
  currency: string
  status: string
  paymentMethod: string | null
  paymentStatus: string | null
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
  billingAddress: any
  createdAt: string
  updatedAt: string
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

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (session && params.id) {
      fetchOrder()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const response = await fetch(`${B}/orders/${params.id}`, {
        headers: authHeaders(),
      })
      if (response.status === 401) {
        router.push('/auth/login')
        return
      }
      if (response.status === 403) {
        setFetchError('You do not have permission to view this order.')
        return
      }
      if (response.status === 404) {
        setFetchError('Order not found.')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        setFetchError('Failed to load order. Please try again.')
      }
    } catch {
      setFetchError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!order) return
    try {
      const response = await fetch(`${B}/orders/${order.id}/invoice`, {
        headers: authHeaders(),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${order.orderNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
    }
  }

  const handleCancel = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return

    setCancelling(true)
    try {
      const response = await fetch(`${B}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        alert(body?.message || 'Failed to cancel order. Please try again.')
        return
      }
      const updated: Order = await response.json()
      setOrder(updated)
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // ── Fetch error ──────────────────────────────────────────────────────────
  if (fetchError) {
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
  const canCancel   = CANCELLABLE_STATUSES.has(order.status)
  const statusClass = STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4"
        >
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
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusClass}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
            <Button onClick={handleDownloadInvoice} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* ── Cancelled / Refunded banner ─────────────────────────────────── */}
      {isCancelled && (
        <Card className={`mb-6 border-2 ${isRefunded ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            {isRefunded
              ? <RefreshCw className="h-5 w-5 text-gray-500 shrink-0" />
              : <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            }
            <div>
              <p className={`font-semibold ${isRefunded ? 'text-gray-700' : 'text-red-700'}`}>
                {isRefunded ? 'This order has been refunded' : 'This order has been cancelled'}
              </p>
              {isRefunded && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Refund status: <span className="font-medium">REFUNDED</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: timeline + items ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tracking timeline — hidden for cancelled/refunded */}
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

          {/* Cancel button — only for PENDING_PAYMENT and PAYMENT_CONFIRMED */}
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

        {/* ── Right column: summary + address ─────────────────────────── */}
        <div className="space-y-6">
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
                  <span className="font-semibold capitalize">
                    {order.paymentStatus}
                  </span>
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
                    <p>
                      {order.shippingAddress.zipCode} {order.shippingAddress.country}
                    </p>
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
    </div>
  )
}
