'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(typeof window !== 'undefined' && (window as any).__JWT
    ? { Authorization: `Bearer ${(window as any).__JWT}` }
    : {}),
})

interface Order {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  user?: { name: string | null; email: string }
}

interface Product {
  id: string
  name: string
  karat: string
  weight: number
  quantity: number
  finalPrice: number
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const PENDING_STATUSES = new Set(['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PROCESSING'])

export default function SellerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [shopId, setShopId] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'SHOP_ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const loadData = useCallback(async (sid?: string) => {
    const id = sid ?? shopId
    if (!id) return
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${B}/orders?shopId=${id}&limit=100`, { headers: authHeaders() }),
        fetch(`${B}/products?shopId=${id}&limit=200`, { headers: authHeaders() }),
      ])
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(Array.isArray(data) ? data : (data.orders ?? []))
      }
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(Array.isArray(data) ? data : (data.products ?? []))
      }
    } catch {
      toast({ title: 'Failed to load data', variant: 'destructive' })
    }
  }, [shopId, toast])

  useEffect(() => {
    if (status !== 'authenticated' || session.user.role !== 'SHOP_ADMIN') return
    ;(async () => {
      try {
        const res = await fetch(`${B}/shops?adminId=${session.user.id}`, { headers: authHeaders() })
        if (!res.ok) throw new Error()
        const data = await res.json()
        const shop = Array.isArray(data) ? data[0] : data
        if (!shop?.id) throw new Error('No shop found')
        setShopId(shop.id)
        await loadData(shop.id)
      } catch {
        toast({ title: 'Could not load your shop', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    })()
  }, [status, session, loadData, toast])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  useEffect(() => {
    if (!searchQuery.trim() || !shopId) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `${B}/products?shopId=${shopId}&search=${encodeURIComponent(searchQuery)}&limit=20`,
          { headers: authHeaders() },
        )
        if (res.ok) {
          const data = await res.json()
          setSearchResults(Array.isArray(data) ? data : (data.products ?? []))
        }
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery, shopId])

  const markReady = async (orderId: string) => {
    setUpdatingOrder(orderId)
    try {
      const res = await fetch(`${B}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'READY_FOR_PICKUP' }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Order marked as ready for pickup' })
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'READY_FOR_PICKUP' } : o)),
      )
    } catch {
      toast({ title: 'Failed to update order', variant: 'destructive' })
    } finally {
      setUpdatingOrder(null)
    }
  }

  const todayOrders = orders.filter((o) => isToday(o.createdAt))
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0)
  const todayCompleted = todayOrders.filter((o) => o.status === 'COMPLETED').length
  const pendingOrders = orders.filter((o) => PENDING_STATUSES.has(o.status)).slice(0, 10)
  const lowStockProducts = products.filter((p) => p.quantity <= 5)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-gray-100 animate-pulse mb-4" />
        <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Seller Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <ShoppingBag className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Orders Today</p>
              <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Revenue Today</p>
              <p className="text-2xl font-bold text-gray-900">
                ${todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{todayCompleted}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending Orders
              {pendingOrders.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-semibold">
                  {pendingOrders.length}
                </span>
              )}
            </CardTitle>
            <Link href="/dashboard/orders" className="text-xs text-amber-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {pendingOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No pending orders</p>
          ) : (
            <div className="space-y-2">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.user?.name ?? order.user?.email ?? 'Customer'} · ${order.totalAmount?.toFixed(0)}
                    </p>
                    <span className="inline-block mt-0.5 text-[11px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {order.status === 'PROCESSING' && (
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-xs"
                      disabled={updatingOrder === order.id}
                      onClick={() => markReady(order.id)}
                    >
                      {updatingOrder === order.id ? 'Saving…' : 'Mark Ready'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-amber-500" />
            Product Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            placeholder="Search by name or karat…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          {searching && <p className="text-sm text-gray-400 text-center py-4">Searching…</p>}
          {!searching && searchQuery && searchResults.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No products found</p>
          )}
          {!searching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.karat} · {p.weight}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">${p.finalPrice?.toFixed(0)}</p>
                    <p className={`text-xs ${p.quantity <= 5 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {p.quantity} in stock
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!searchQuery && (
            <p className="text-sm text-gray-400 text-center py-4">Type to search products</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Low Stock
            {lowStockProducts.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-semibold">
                {lowStockProducts.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">All products are well stocked</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 border border-red-100 rounded-lg bg-red-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.karat} · {p.weight}g</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{p.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
