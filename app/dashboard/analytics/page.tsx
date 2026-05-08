'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () => typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  ArrowLeft,
  Calendar,
} from 'lucide-react'

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  totalCustomers?: number
  averageOrderValue?: number
  ordersByStatus: Array<{ status: string; count: number }>
  revenueByShop?: Array<{ shopId: string; shopName: string; revenue: number; orderCount: number }>
  topProducts: Array<{ productId: string; productName: string; quantitySold: number; orderCount: number }>
  recentOrders: Array<any>
  shop?: { id: string; name: string }
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

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

      const response = await fetch(`${B}/analytics?${params.toString()}`, { headers: authHeaders() })
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

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
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

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4">
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

      {/* Date Range Filter */}
      <Card className="mb-6 border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <Button onClick={fetchAnalytics} className="w-full sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders by Status */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topProducts.slice(0, 5).map((product) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {product.productName}
                    </p>
                    <p className="text-xs text-gray-500">{product.orderCount} orders</p>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{product.quantitySold}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Shop (Super Admin only) */}
      {analytics.revenueByShop && analytics.revenueByShop.length > 0 && (
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Revenue by Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.revenueByShop.map((shop) => (
                <div key={shop.shopId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{shop.shopName}</p>
                    <p className="text-xs text-gray-500">{shop.orderCount} orders</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    ${shop.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
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
                </tr>
              </thead>
              <tbody>
                {analytics.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {order.customer?.name || order.customer?.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




