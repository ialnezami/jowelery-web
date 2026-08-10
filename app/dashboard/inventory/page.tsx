'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Search, Plus, ArrowRightLeft, CheckCircle, XCircle, X,
  Package, Warehouse
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

function authHeaders(): HeadersInit {
  const token = (window as any).__JWT
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

const STATUS_BADGE: Record<string, { label: string }> = {
  IN_STOCK:  { label: 'In Stock' },
  IN_TRANSIT:{ label: 'In Transit' },
  SOLD:      { label: 'Sold' },
  PENDING:   { label: 'Pending' },
  CONFIRMED: { label: 'Confirmed' },
  REJECTED:  { label: 'Rejected' },
  CANCELLED: { label: 'Cancelled' },
}

const STATUS_STYLE: Record<string, string> = {
  IN_STOCK:   'bg-green-100 text-green-800',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-800',
  SOLD:       'bg-gray-100 text-gray-500',
  PENDING:    'bg-yellow-100 text-yellow-800',
  CONFIRMED:  'bg-green-100 text-green-800',
  REJECTED:   'bg-red-100 text-red-800',
  CANCELLED:  'bg-gray-100 text-gray-500',
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_BADGE[status]?.label || status.replace(/_/g, ' ')
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

type Tab = 'items' | 'transfers'
type Direction = 'all' | 'incoming' | 'outgoing'

export default function InventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [tab, setTab] = useState<Tab>('items')
  const [items, setItems] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState<Direction>('all')

  // Search
  const [serialQuery, setSerialQuery] = useState('')
  const [searchResult, setSearchResult] = useState<any | null>(null)
  const [searching, setSearching] = useState(false)

  // Create items modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ productId: '', quantity: 1, notes: '' })
  const [products, setProducts] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  // Transfer modal
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferItem, setTransferItem] = useState<any | null>(null)
  const [toShopId, setToShopId] = useState('')
  const [transferNotes, setTransferNotes] = useState('')
  const [shops, setShops] = useState<any[]>([])
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  const loadItems = useCallback(async () => {
    const res = await fetch(`${B}/product-items?limit=100`, { headers: authHeaders() })
    const data = await res.json()
    setItems(data.items || [])
  }, [])

  const loadTransfers = useCallback(async () => {
    const res = await fetch(`${B}/item-transfers?direction=${direction}&limit=100`, { headers: authHeaders() })
    const data = await res.json()
    setTransfers(data.transfers || [])
  }, [direction])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (tab === 'items') await loadItems()
        else await loadTransfers()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab, direction])

  const loadProducts = async () => {
    const res = await fetch(`${B}/products?includeInactive=true&limit=200`, { headers: authHeaders() })
    const data = await res.json()
    setProducts(data.products || [])
  }

  const loadShops = async () => {
    const res = await fetch(`${B}/shops`, { headers: authHeaders() })
    const data = await res.json()
    setShops(data.shops || [])
  }

  const handleSearch = async () => {
    if (!serialQuery.trim()) return
    setSearching(true)
    setSearchResult(null)
    try {
      const res = await fetch(`${B}/product-items/by-serial/${encodeURIComponent(serialQuery.trim())}`, { headers: authHeaders() })
      if (!res.ok) throw new Error((await res.json()).error || 'Not found')
      setSearchResult(await res.json())
    } catch (e: any) {
      toast({ title: 'Not found', description: e.message, variant: 'destructive' })
    } finally {
      setSearching(false)
    }
  }

  const handleCreateItems = async () => {
    if (!createForm.productId || createForm.quantity < 1) return
    setCreating(true)
    try {
      const product = products.find(p => p.id === createForm.productId)
      const res = await fetch(`${B}/product-items`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          productId: createForm.productId,
          shopId: product?.shopId,
          quantity: createForm.quantity,
          notes: createForm.notes || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: `Created ${createForm.quantity} item(s)` })
      setShowCreate(false)
      setCreateForm({ productId: '', quantity: 1, notes: '' })
      loadItems()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openTransferModal = (item: any) => {
    setTransferItem(item)
    setToShopId('')
    setTransferNotes('')
    loadShops()
    setShowTransfer(true)
  }

  const handleInitiateTransfer = async () => {
    if (!toShopId) return
    setTransferring(true)
    try {
      const res = await fetch(`${B}/item-transfers`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ itemId: transferItem.id, toShopId, notes: transferNotes || undefined }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: 'Transfer initiated' })
      setShowTransfer(false)
      loadItems()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setTransferring(false)
    }
  }

  const handleTransferAction = async (transferId: string, action: 'confirm' | 'reject' | 'cancel') => {
    try {
      const res = await fetch(`${B}/item-transfers/${transferId}/${action}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: `Transfer ${action}ed` })
      loadTransfers()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (status === 'loading') return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" /></div>
  if (!session) return null

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-amber-600" /> Inventory & Transfers
          </h1>
          <p className="text-sm text-gray-500">Track individual items by serial number across shops</p>
        </div>
        <Button onClick={() => { loadProducts(); setShowCreate(true) }} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" /> Add Items
        </Button>
      </div>

      {/* Serial search */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search by serial number (e.g. RING-001-A3F9C2)…"
          value={serialQuery}
          onChange={e => setSerialQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button variant="outline" onClick={handleSearch} disabled={searching}>
          <Search className="h-4 w-4 mr-1" /> {searching ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {/* Search result card */}
      {searchResult && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-mono text-sm font-bold text-amber-800">{searchResult.serialNumber}</p>
                <p className="font-semibold">{searchResult.product?.name}</p>
                <p className="text-sm text-gray-500">{searchResult.shop?.name} · {searchResult.product?.sku} · {searchResult.product?.karat}</p>
                <StatusBadge status={searchResult.status} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSearchResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Event log</p>
              {((searchResult.events || []) as any[]).map((ev: any, i: number) => (
                <p key={i} className="text-xs text-gray-500">
                  • {ev.type.replace(/_/g, ' ')} — {new Date(ev.timestamp).toLocaleDateString()}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b mb-6 flex gap-6">
        {(['items', 'transfers'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 font-medium capitalize text-sm border-b-2 transition-colors ${
              tab === t ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Transfer direction filter */}
      {tab === 'transfers' && (
        <div className="flex gap-2 mb-4">
          {(['all', 'incoming', 'outgoing'] as Direction[]).map(d => (
            <Button key={d} variant={direction === d ? 'default' : 'outline'} size="sm"
              className={direction === d ? 'bg-amber-600 hover:bg-amber-700' : ''}
              onClick={() => setDirection(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
      ) : tab === 'items' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No tracked items yet. Click &ldquo;Add Items&rdquo; to register the first batch.</p>
            </div>
          )}
          {items.map(item => (
            <Card key={item.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-400">{item.serialNumber}</p>
                    <p className="font-semibold text-gray-900 truncate">{item.product?.name}</p>
                    <p className="text-xs text-gray-500">{item.product?.sku} · {item.product?.karat} · {item.shop?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={item.status} />
                    {item.status === 'IN_STOCK' && (
                      <Button size="sm" variant="outline" onClick={() => openTransferModal(item)}>
                        <ArrowRightLeft className="h-3 w-3 mr-1" /> Transfer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No transfers found.</p>
            </div>
          )}
          {transfers.map(t => (
            <Card key={t.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-gray-400">{t.item?.serialNumber}</p>
                    <p className="font-semibold truncate">{t.item?.product?.name}</p>
                    <p className="text-sm text-gray-500">{t.fromShop?.name} → {t.toShop?.name}</p>
                    <p className="text-xs text-gray-400">By {t.initiator?.name} · {new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={t.status} />
                    {t.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleTransferAction(t.id, 'confirm')}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleTransferAction(t.id, 'reject')}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-500"
                          onClick={() => handleTransferAction(t.id, 'cancel')}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create items dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register New Items</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Product</label>
              <Select value={createForm.productId} onValueChange={v => setCreateForm(f => ({ ...f, productId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select product…" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quantity</label>
              <Input type="number" min={1} max={100} value={createForm.quantity}
                onChange={e => setCreateForm(f => ({ ...f, quantity: +e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Input value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Batch note, supplier, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleCreateItems} disabled={creating || !createForm.productId}>
              {creating ? 'Creating…' : `Create ${createForm.quantity} item(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Item</DialogTitle>
          </DialogHeader>
          {transferItem && (
            <div className="py-1">
              <p className="font-mono text-xs text-gray-400">{transferItem.serialNumber}</p>
              <p className="font-semibold mb-4">{transferItem.product?.name}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Send to shop</label>
              <Select value={toShopId} onValueChange={setToShopId}>
                <SelectTrigger><SelectValue placeholder="Select destination shop…" /></SelectTrigger>
                <SelectContent>
                  {shops.filter(s => s.id !== transferItem?.shopId).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Input value={transferNotes} onChange={e => setTransferNotes(e.target.value)} placeholder="Reason, condition, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleInitiateTransfer} disabled={transferring || !toShopId}>
              {transferring ? 'Sending…' : 'Initiate Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
