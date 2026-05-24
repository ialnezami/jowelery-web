# Seller Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Seller Mode for SHOP_ADMIN users — a simplified dashboard focused on today's summary, pending orders, product search, and low-stock alerts — toggled from the top navbar.

**Architecture:** A new page at `app/dashboard/seller/page.tsx` fetches the admin's shop on mount, then loads orders and products in parallel. Filtering (today/pending/low-stock) is done client-side. A toggle button added to `components/Header.tsx` (shown only to SHOP_ADMIN on /dashboard routes) persists the selected mode in `localStorage` and navigates between `/dashboard` and `/dashboard/seller`.

**Tech Stack:** Next.js 14 App Router, React, NextAuth (`useSession`), Tailwind CSS, shadcn/ui (`Card`, `Button`, `Input`), lucide-react icons, `useToast` from `@/hooks/use-toast`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `components/Header.tsx` | Add seller/admin mode toggle pill for SHOP_ADMIN |
| Create | `app/dashboard/seller/page.tsx` | Full seller dashboard: summary + orders + search + low stock |

---

## Task 1: Add SellerModeToggle to Header

**Files:**
- Modify: `components/Header.tsx`

The toggle is a pill button with two labels ("Admin" / "Seller"). It appears only when `session?.user?.role === 'SHOP_ADMIN'` and the current path starts with `/dashboard`. Clicking saves to `localStorage` and navigates.

- [ ] **Step 1: Read the current Header.tsx**

Open `components/Header.tsx` and note where the "Right Side Actions" `<div>` ends (after `<CurrencySwitcher />` and `<LanguageSwitcher />`).

- [ ] **Step 2: Add imports to Header.tsx**

At the top of the file, add `usePathname` and `useRouter` to the existing next/navigation import, and add `useEffect` and `useCallback` to React:

```tsx
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useCallback } from 'react'
```

- [ ] **Step 3: Add toggle state + logic inside the Header function**

Add directly after the existing `const locale = useLocale()` line:

```tsx
  const router = useRouter()
  const pathname = usePathname()
  const isShopAdmin = session?.user?.role === 'SHOP_ADMIN'
  const onDashboard = pathname?.startsWith('/dashboard')

  const isSellerMode = useCallback(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('jowelery:sellerMode') === 'true'
  }, [])

  const toggleSellerMode = useCallback(() => {
    const next = !isSellerMode()
    localStorage.setItem('jowelery:sellerMode', String(next))
    router.push(next ? '/dashboard/seller' : '/dashboard')
  }, [isSellerMode, router])
```

- [ ] **Step 4: Add the toggle pill to the desktop right-side actions**

Inside the "Right Side Actions" `<div className="flex items-center gap-2 sm:gap-4">`, add before `<CurrencySwitcher />`:

```tsx
            {isShopAdmin && onDashboard && (
              <button
                onClick={toggleSellerMode}
                className="hidden sm:flex items-center gap-0 rounded-full border border-amber-300 bg-amber-50 text-xs font-semibold overflow-hidden"
                title="Switch mode"
              >
                <span className={`px-3 py-1.5 transition-colors ${!isSellerMode() ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-100'}`}>
                  Admin
                </span>
                <span className={`px-3 py-1.5 transition-colors ${isSellerMode() ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-100'}`}>
                  Seller
                </span>
              </button>
            )}
```

- [ ] **Step 5: Add the same toggle to the mobile menu**

Inside the mobile menu `<div>` (the one that opens on hamburger click), add before the existing mobile links:

```tsx
            {isShopAdmin && onDashboard && (
              <button
                onClick={() => { toggleSellerMode(); setMobileMenuOpen(false) }}
                className="flex items-center gap-0 rounded-full border border-amber-300 bg-amber-50 text-xs font-semibold overflow-hidden mx-4 my-2 w-fit"
              >
                <span className={`px-3 py-1.5 transition-colors ${!isSellerMode() ? 'bg-amber-600 text-white' : 'text-amber-700'}`}>
                  Admin
                </span>
                <span className={`px-3 py-1.5 transition-colors ${isSellerMode() ? 'bg-amber-600 text-white' : 'text-amber-700'}`}>
                  Seller
                </span>
              </button>
            )}
```

- [ ] **Step 6: Verify the app compiles**

```bash
cd /Users/ibrahimalnezami/Desktop/jow/jowelery-web
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors. Fix any type errors before continuing.

- [ ] **Step 7: Commit**

```bash
git -C /Users/ibrahimalnezami/Desktop/jow/jowelery-web add components/Header.tsx
git -C /Users/ibrahimalnezami/Desktop/jow/jowelery-web commit -m "feat: add seller/admin mode toggle pill to header for SHOP_ADMIN"
```

---

## Task 2: Create the Seller Dashboard Page

**Files:**
- Create: `app/dashboard/seller/page.tsx`

This page:
1. Guards against non-SHOP_ADMIN access
2. Fetches the admin's shop → extracts `shopId`
3. Fetches all shop orders and all shop products in parallel
4. Derives today's stats, pending orders, low-stock products client-side
5. Provides a live product search input (separate fetch on input change)

- [ ] **Step 1: Create the file with the full page implementation**

Create `app/dashboard/seller/page.tsx` with the following content:

```tsx
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

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(typeof window !== 'undefined' && (window as any).__JWT
    ? { Authorization: `Bearer ${(window as any).__JWT}` }
    : {}),
})

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

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

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'SHOP_ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // ── Data loading ─────────────────────────────────────────────────────────────
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

  // ── Product search ────────────────────────────────────────────────────────────
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

  // ── Order status update ───────────────────────────────────────────────────────
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

  // ── Derived data ──────────────────────────────────────────────────────────────
  const todayOrders = orders.filter((o) => isToday(o.createdAt))
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0)
  const todayCompleted = todayOrders.filter((o) => o.status === 'COMPLETED').length
  const pendingOrders = orders
    .filter((o) => PENDING_STATUSES.has(o.status))
    .slice(0, 10)
  const lowStockProducts = products.filter((p) => p.quantity <= 5)

  // ── Render ────────────────────────────────────────────────────────────────────
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
      {/* Header */}
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

      {/* ── Section 1: Today's summary ──────────────────────────────────────── */}
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

      {/* ── Section 2: Pending orders ───────────────────────────────────────── */}
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

      {/* ── Section 3: Product search ───────────────────────────────────────── */}
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
          {searching && (
            <p className="text-sm text-gray-400 text-center py-4">Searching…</p>
          )}
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

      {/* ── Section 4: Low stock alerts ─────────────────────────────────────── */}
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
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd /Users/ibrahimalnezami/Desktop/jow/jowelery-web
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors. If there are import errors (e.g., `useToast` path wrong), check with `find . -name 'use-toast*' -not -path '*/node_modules/*'` and update the import.

- [ ] **Step 3: Commit**

```bash
git -C /Users/ibrahimalnezami/Desktop/jow/jowelery-web add app/dashboard/seller/page.tsx
git -C /Users/ibrahimalnezami/Desktop/jow/jowelery-web commit -m "feat: add seller mode dashboard page"
```

---

## Task 3: Smoke-test in the browser

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/ibrahimalnezami/Desktop/jow/jowelery-web
npm run dev
```

- [ ] **Step 2: Log in as shop admin**

Open `http://localhost:3000/auth/login` and sign in with:
- Email: `shop1@jowelery.com`
- Password: `shop123`

- [ ] **Step 3: Verify the toggle appears**

Navigate to `http://localhost:3000/dashboard`. The header should show a pill toggle "Admin | Seller" in the top-right. Verify it is NOT shown when logged in as `admin@jowelery.com` (SUPER_ADMIN).

- [ ] **Step 4: Switch to Seller Mode**

Click "Seller" in the toggle. Should navigate to `/dashboard/seller` and show:
- Three stat cards (Orders Today, Revenue Today, Completed Today)
- Pending Orders section
- Product Lookup search input
- Low Stock section

- [ ] **Step 5: Switch back to Admin Mode**

Click "Admin" in the toggle. Should navigate back to `/dashboard`.

- [ ] **Step 6: Verify localStorage persistence**

With Seller mode active, refresh the page. The toggle should still show "Seller" as active (pill is amber on the Seller side).

> **Note:** The localStorage state controls only the visual highlight. The active page is determined by the URL. If a user navigates directly to `/dashboard` the toggle will show Admin as active regardless of localStorage — this is correct behavior.

- [ ] **Step 7: Commit final state and push**

```bash
git -C /Users/ibrahimalnezami/Desktop/jow/jowelery-web push origin master
```
