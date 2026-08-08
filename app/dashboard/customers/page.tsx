'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface Customer {
  id: string
  name: string | null
  email: string
  orderCount: number
  totalSpent: number
  joinedAt: string
}

function authHeaders(): HeadersInit {
  const token = (window as any).__JWT
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export default function CustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (
      status === 'authenticated' &&
      session.user.role !== 'SUPER_ADMIN' &&
      session.user.role !== 'SHOP_ADMIN'
    ) {
      router.push('/dashboard')
      return
    }
    if (session) {
      fetchCustomers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      // shops.controller.ts: GET /shops/customers — returns customers for the authenticated shop admin,
      // or all customers for SUPER_ADMIN (backend uses user.id + user.role to scope the query)
      const res = await fetch(`${B}/shops/customers`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data?.customers) ? data.customers : Array.isArray(data) ? data : []
      setCustomers(list)
      setTotal(data?.total ?? list.length)
    } catch (err) {
      toast({ title: 'Failed to load customers', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.email.toLowerCase().includes(q) ||
      (c.name ?? '').toLowerCase().includes(q)
    )
  })

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
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          Customers
        </h1>
        <p className="text-gray-500 mt-1">
          {total} customer{total !== 1 ? 's' : ''} · sorted by total spend
        </p>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {search ? 'No customers match your search' : 'No customers yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer, index) => (
            <Card key={customer.id} className="border-0 shadow-md">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-amber-700">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {customer.name || <span className="text-gray-400 italic">No name</span>}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Joined {new Date(customer.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-amber-700">
                      ${customer.totalSpent.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
