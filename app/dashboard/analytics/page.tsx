'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowLeft,
  Calendar,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () =>
  typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

// Status colors matching the mobile app STATUS_COLOR map
const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT:   '#F59E0B',
  PAYMENT_CONFIRMED: '#3B82F6',
  PROCESSING:        '#8B5CF6',
  READY_FOR_PICKUP:  '#06B6D4',
  SHIPPED:           '#6366F1',
  OUT_FOR_DELIVERY:  '#F97316',
  DELIVERED:         '#22C55E',
  COMPLETED:         '#D97706',
  CANCELLED:         '#EF4444',
  REFUNDED:          '#9CA3AF',
}

// Tailwind badge classes for status chips in the recent-orders table
const STATUS_BADGE: Record<string, string> = {
  PENDING_PAYMENT:   'bg-amber-100 text-amber-800',
  PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING:        'bg-violet-100 text-violet-800',
  READY_FOR_PICKUP:  'bg-cyan-100 text-cyan-800',
  SHIPPED:           'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY:  'bg-orange-100 text-orange-800',
  DELIVERED:         'bg-green-100 text-green-800',
  COMPLETED:         'bg-amber-100 text-amber-700',
  CANCELLED:         'bg-red-100 text-red-800',
  REFUNDED:          'bg-gray-100 text-gray-700',
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  totalCustomers?: number
  averageOrderValue?: number
  ordersByStatus: Array<{ status: string; count: number }>
  revenueByShop?: Array<{ shopId: string; shopName: string; revenue: number; orderCount: number }>
  topProducts: Array<{ productId: string; productName: string; quantitySold: number; orderCount: number }>
  recentOrders: Array<{
    id: string
    orderNumber?: string
    total: number
    status: string
    createdAt: string
    customer?: { name?: string; email?: string }
    user?: { name?: string; email?: string }
  }>
  shop?: { id: string; name: string }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function HorizontalBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mx-3">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [pendingRange, setPendingRange] = useState({ startDate: '', endDate: '' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (session && (session.user.role === 'SUPER_ADMIN' || session.user.role === 'SHOP_ADMIN')) {
      fetchAnalytics()
    } else if (session) {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`${B}/analytics?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilter() {
    setDateRange(pendingRange)
  }

  // ── loading / empty states ────────────────────────────────────────────────

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  // ── derived values ────────────────────────────────────────────────────────

  const maxStatusCount = Math.max(...analytics.ordersByStatus.map((s) => s.count), 1)
  const top5Products = analytics.topProducts.slice(0, 5)
  const maxProductSold = Math.max(...top5Products.map((p) => p.quantitySold), 1)
  const maxShopRevenue = Math.max(
    ...(analytics.revenueByShop ?? []).map((s) => s.revenue),
    1,
  )

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        {analytics.shop && (
          <p className="text-gray-600 mt-2">Shop: {analytics.shop.name}</p>
        )}
      </div>

      {/* ── Date Range Filter ── */}
      <Card className="mb-6 border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={pendingRange.startDate}
                onChange={(e) =>
                  setPendingRange((r) => ({ ...r, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={pendingRange.endDate}
                onChange={(e) =>
                  setPendingRange((r) => ({ ...r, endDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <Button onClick={applyFilter} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">
              <Calendar className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
            {(dateRange.startDate || dateRange.endDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setPendingRange({ startDate: '', endDate: '' })
                  setDateRange({ startDate: '', endDate: '' })
                }}
                className="w-full sm:w-auto"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics.totalCustomers !== undefined && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalCustomers}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analytics.averageOrderValue !== undefined && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analytics.averageOrderValue.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Orders by Status + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders by Status — CSS horizontal bar chart */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.ordersByStatus.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No order data available</p>
            ) : (
              <div className="space-y-3">
                {analytics.ordersByStatus.map((item) => {
                  const color = STATUS_COLOR[item.status] ?? '#D97706'
                  return (
                    <div key={item.status} className="flex items-center">
                      <span className="text-xs font-medium text-gray-600 w-36 shrink-0 capitalize">
                        {statusLabel(item.status)}
                      </span>
                      <HorizontalBar
                        value={item.count}
                        max={maxStatusCount}
                        color={color}
                      />
                      <span className="text-sm font-bold text-gray-900 w-8 text-right shrink-0">
                        {item.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products — ranked list with progress bars */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {top5Products.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No product data available</p>
            ) : (
              <div className="space-y-4">
                {top5Products.map((product, idx) => (
                  <div key={product.productId}>
                    <div className="flex items-center gap-3 mb-1">
                      {/* Rank badge */}
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-900 line-clamp-1">
                        {product.productName}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {product.orderCount} orders
                      </span>
                      <span className="text-sm font-bold text-amber-600 shrink-0 w-16 text-right">
                        {product.quantitySold} sold
                      </span>
                    </div>
                    {/* Relative progress bar */}
                    <div className="ml-9 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((product.quantitySold / maxProductSold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue by Shop (SUPER_ADMIN only) ── */}
      {analytics.revenueByShop && analytics.revenueByShop.length > 0 && (
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Revenue by Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.revenueByShop.map((shop) => (
                <div key={shop.shopId}>
                  <div className="flex items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 flex-1">{shop.shopName}</span>
                    <span className="text-xs text-gray-500 mr-3">{shop.orderCount} orders</span>
                    <span className="text-sm font-bold text-green-700 w-24 text-right">
                      ${shop.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((shop.revenue / maxShopRevenue) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Orders ── */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No recent orders</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Order #
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentOrders.slice(0, 10).map((order) => {
                    const customerName =
                      order.customer?.name ||
                      order.customer?.email ||
                      order.user?.name ||
                      order.user?.email ||
                      'N/A'
                    const badgeClass =
                      STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-700'
                    const orderNum =
                      order.orderNumber || order.id.slice(-8).toUpperCase()
                    return (
                      <tr
                        key={order.id}
                        className="border-b hover:bg-amber-50/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-mono text-gray-900">
                          #{orderNum}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{customerName}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          ${(order.total ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
                          >
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
