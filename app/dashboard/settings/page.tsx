'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { useToast } from '@/hooks/use-toast'
import { SingleImageUpload } from '@/components/SingleImageUpload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Store,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  Settings as SettingsIcon,
  Save,
  Edit,
  Trash2,
  CreditCard,
  DollarSign,
  RefreshCw,
  Clock,
  TrendingUp,
  UserPlus,
  ShieldCheck,
} from 'lucide-react'
import Image from 'next/image'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () =>
  typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

// ─── Types ───────────────────────────────────────────────────────────────────

interface SystemConfig {
  singleShopMode: boolean
  defaultShopId: string | null
  defaultCurrency: string
  platformName: string
  supportEmail: string
  commissionRate: number
  paymentMethods: {
    provider: string
    isEnabled: boolean
    displayName: string
  }[]
}

interface Shop {
  id: string
  name: string
  adminId: string
  description: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  logo: string | null
  banner: string | null
  commissionRate: number
  status: string
  shippingMethods?: string[]
  admin: {
    id: string
    name: string | null
    email: string
  }
  _count?: {
    products: number
    orders: number
  }
}

interface ShopAdmin {
  id: string
  name: string | null
  email: string
  role: string
  shop?: { id: string; name: string } | null
}

interface GoldRate {
  karat: string
  rate: number
  currency: string
  timestamp: Date | string
}

// ─── Tab definitions ─────────────────────────────────────────────────────────

type SuperAdminTab = 'system' | 'shops' | 'gold-rates' | 'admins'
type ShopAdminTab = 'shop' | 'gold-rates'

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // ── Shared loading / error
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ── Tab state
  const [superTab, setSuperTab] = useState<SuperAdminTab>('system')
  const [shopAdminTab, setShopAdminTab] = useState<ShopAdminTab>('shop')

  // ── SHOP_ADMIN: own shop
  const [shop, setShop] = useState<Shop | null>(null)
  const [shopFormData, setShopFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    logo: null as string | null,
    banner: null as string | null,
    shippingMethods: ['PICKUP', 'DELIVERY'] as ('PICKUP' | 'DELIVERY')[],
  })

  // ── SUPER_ADMIN: system config
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [configDraft, setConfigDraft] = useState<Partial<SystemConfig>>({})

  // ── SUPER_ADMIN: shops
  const [shops, setShops] = useState<Shop[]>([])
  const [shopAdmins, setShopAdmins] = useState<ShopAdmin[]>([])
  const [showCreateShop, setShowCreateShop] = useState(false)
  const [showEditShop, setShowEditShop] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [createShopStep, setCreateShopStep] = useState<1 | 2>(1)
  const [editShopTab, setEditShopTab] = useState<'shop' | 'manager'>('shop')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shopToDelete, setShopToDelete] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    shopAddress: '',
    shopCity: '',
    shopCountry: '',
    shopPhone: '',
    shopEmail: '',
    commissionRate: '0.10',
    adminId: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })

  const [editShopData, setEditShopData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    logo: null as string | null,
    banner: null as string | null,
    commissionRate: '0.10',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    adminId: '',
  })

  const [editManagerData, setEditManagerData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // ── SUPER_ADMIN: gold rates
  const [goldRates, setGoldRates] = useState<GoldRate[]>([])
  const [editingRates, setEditingRates] = useState<Record<string, string>>({})
  const [goldLoading, setGoldLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [savingRate, setSavingRate] = useState(false)

  // ── SUPER_ADMIN: admin users
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    shopId: '',
  })
  const [deleteAdminDialogOpen, setDeleteAdminDialogOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null)

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (session) {
      if (session.user.role === 'SHOP_ADMIN') {
        Promise.all([fetchShop(), fetchGoldRates()]).finally(() => setLoading(false))
      } else if (session.user.role === 'SUPER_ADMIN') {
        Promise.all([fetchData(), fetchSystemConfig(), fetchGoldRates()]).finally(() =>
          setLoading(false),
        )
      } else {
        router.push('/dashboard')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  // Sync manager fields when adminId changes in edit modal
  useEffect(() => {
    if (editShopTab === 'manager' && editShopData.adminId && shopAdmins.length > 0) {
      const selectedAdmin = shopAdmins.find((a) => a.id === editShopData.adminId)
      if (selectedAdmin) {
        setEditManagerData({
          name: selectedAdmin.name || '',
          email: selectedAdmin.email || '',
          phone: '',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editShopData.adminId, editShopTab])

  // ─── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchShop = async () => {
    try {
      const response = await fetch(`${B}/shops?adminId=${session?.user.id}`, {
        headers: authHeaders(),
      })
      if (response.ok) {
        const shopData = await response.json()
        if (shopData) {
          setShop(shopData)
          setShopFormData({
            name: shopData.name || '',
            description: shopData.description || '',
            address: shopData.address || '',
            city: shopData.city || '',
            country: shopData.country || '',
            phone: shopData.phone || '',
            email: shopData.email || '',
            logo: shopData.logo,
            banner: shopData.banner,
            shippingMethods: (shopData.shippingMethods || ['PICKUP', 'DELIVERY']) as (
              | 'PICKUP'
              | 'DELIVERY'
            )[],
          })
        }
      }
    } catch (err) {
      console.error('Error fetching shop:', err)
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch shop information' })
    }
  }

  const fetchSystemConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await fetch(`${B}/system-config`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        setSystemConfig(data)
        setConfigDraft(data)
      }
    } catch (err) {
      console.error('Error fetching system config:', err)
    } finally {
      setConfigLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setError('')
      const [shopsRes, usersRes] = await Promise.all([
        fetch(`${B}/shops`, { headers: authHeaders() }).catch(() => null),
        fetch(`${B}/users?role=SHOP_ADMIN`, { headers: authHeaders() }).catch(() => null),
      ])

      if (shopsRes?.ok) {
        const shopsData = await shopsRes.json().catch(() => [])
        setShops(Array.isArray(shopsData) ? shopsData : (shopsData.shops ?? []))
      } else if (shopsRes) {
        const errData = await shopsRes.json().catch(() => ({}))
        if (errData.error === 'Unauthorized') {
          router.push('/auth/login')
          return
        }
      }

      if (usersRes?.ok) {
        const usersData = await usersRes.json().catch(() => [])
        setShopAdmins(Array.isArray(usersData) ? usersData : [])
      } else if (usersRes) {
        const errData = await usersRes.json().catch(() => ({}))
        if (errData.error === 'Unauthorized') {
          router.push('/auth/login')
          return
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data. Please try again.')
    }
  }

  const fetchGoldRates = async () => {
    try {
      setGoldLoading(true)
      const response = await fetch(`${B}/gold-rates`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        const rates = (Array.isArray(data) ? data : Object.values(data)) as GoldRate[]
        setGoldRates(rates)
        const editing: Record<string, string> = {}
        rates.forEach((rate: GoldRate) => {
          editing[rate.karat] = rate.rate.toFixed(2)
        })
        setEditingRates(editing)
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch gold rates' })
      }
    } catch (err) {
      console.error('Error fetching gold rates:', err)
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch gold rates' })
    } finally {
      setGoldLoading(false)
    }
  }

  // ─── System Config handlers ─────────────────────────────────────────────────

  const handleSaveConfig = async () => {
    if (!systemConfig) return
    try {
      const payload = { ...systemConfig, ...configDraft }
      const response = await fetch(`${B}/system-config`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        const updated = await response.json()
        setSystemConfig(updated)
        setConfigDraft(updated)
        toast({ title: 'Success', description: 'System configuration saved' })
      } else {
        const err = await response.json().catch(() => ({}))
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.message || 'Failed to update configuration',
        })
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update configuration' })
    }
  }

  const togglePaymentMethod = (index: number, checked: boolean) => {
    if (!systemConfig) return
    const newMethods = [...systemConfig.paymentMethods]
    newMethods[index] = { ...newMethods[index], isEnabled: checked }
    setSystemConfig({ ...systemConfig, paymentMethods: newMethods })
    setConfigDraft((prev) => ({ ...prev, paymentMethods: newMethods }))
  }

  // ─── Shop handlers (SHOP_ADMIN) ─────────────────────────────────────────────

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (!shop) { setError('Shop not found'); return }
      if (!shopFormData.shippingMethods || shopFormData.shippingMethods.length === 0) {
        setError('At least one shipping method must be selected')
        return
      }
      const response = await fetch(`${B}/shops/${shop.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: shopFormData.name,
          description: shopFormData.description || null,
          address: shopFormData.address || null,
          city: shopFormData.city || null,
          country: shopFormData.country || null,
          phone: shopFormData.phone || null,
          email: shopFormData.email || null,
          logo: shopFormData.logo,
          banner: shopFormData.banner,
          shippingMethods: shopFormData.shippingMethods,
        }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Failed to update shop'); return }
      toast({ title: 'Success', description: 'Shop information updated successfully' })
      fetchShop()
    } catch (err) {
      console.error('Error updating shop:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Shop handlers (SUPER_ADMIN) ────────────────────────────────────────────

  const resetCreateForm = () => {
    setFormData({
      shopName: '',
      shopDescription: '',
      shopAddress: '',
      shopCity: '',
      shopCountry: '',
      shopPhone: '',
      shopEmail: '',
      commissionRate: '0.10',
      adminId: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    })
    setCreateShopStep(1)
    setError('')
  }

  const handleEditShop = (shopItem: Shop) => {
    setEditingShop(shopItem)
    setEditShopData({
      name: shopItem.name || '',
      description: shopItem.description || '',
      address: shopItem.address || '',
      city: shopItem.city || '',
      country: shopItem.country || '',
      phone: shopItem.phone || '',
      email: shopItem.email || '',
      logo: shopItem.logo,
      banner: shopItem.banner,
      commissionRate: shopItem.commissionRate.toString(),
      status: shopItem.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
      adminId: shopItem.adminId,
    })
    setEditManagerData({
      name: shopItem.admin.name || '',
      email: shopItem.admin.email || '',
      phone: '',
    })
    setEditShopTab('shop')
    setShowEditShop(true)
  }

  const handleUpdateShopForSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingShop) return
    setError('')
    setSubmitting(true)
    try {
      const response = await fetch(`${B}/shops/${editingShop.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editShopData.name,
          description: editShopData.description || null,
          address: editShopData.address || null,
          city: editShopData.city || null,
          country: editShopData.country || null,
          phone: editShopData.phone || null,
          email: editShopData.email || null,
          logo: editShopData.logo,
          banner: editShopData.banner,
          commissionRate: parseFloat(editShopData.commissionRate),
          status: editShopData.status,
          adminId:
            editShopData.adminId !== editingShop.adminId ? editShopData.adminId : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || data.message || 'Failed to update shop'); return }
      toast({ title: 'Success', description: 'Shop updated successfully' })
      setShowEditShop(false)
      setEditingShop(null)
      setError('')
      fetchData()
    } catch (err) {
      console.error('Error updating shop:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateManager = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingShop) return
    setError('')
    setSubmitting(true)
    try {
      const response = await fetch(`${B}/users/${editingShop.adminId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editManagerData.name,
          email: editManagerData.email,
          phone: editManagerData.phone || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || data.message || 'Failed to update manager'); return }
      toast({ title: 'Success', description: 'Manager updated successfully' })
      fetchData()
      const shopResponse = await fetch(`${B}/shops/${editingShop.id}`, { headers: authHeaders() })
      if (shopResponse.ok) {
        const shopData = await shopResponse.json()
        handleEditShop(shopData)
      }
    } catch (err) {
      console.error('Error updating manager:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (shopId: string) => {
    setShopToDelete(shopId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!shopToDelete) return
    try {
      const response = await fetch(`${B}/shops/${shopToDelete}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (response.ok) {
        toast({ title: 'Success', description: 'Shop deleted successfully' })
        fetchData()
      } else {
        const err = await response.json()
        toast({ variant: 'destructive', title: 'Error', description: err.error || 'Failed to delete shop' })
      }
    } catch (err) {
      console.error('Error deleting shop:', err)
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete shop' })
    } finally {
      setShopToDelete(null)
    }
  }

  const handleToggleShopStatus = async (shopItem: Shop) => {
    const newStatus = shopItem.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const response = await fetch(`${B}/shops/${shopItem.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        toast({ title: 'Success', description: `Shop ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}` })
        fetchData()
      } else {
        const err = await response.json()
        toast({ variant: 'destructive', title: 'Error', description: err.error || 'Failed to update status' })
      }
    } catch (err) {
      console.error('Error toggling shop status:', err)
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update shop status' })
    }
  }

  // ─── Gold rates handlers ────────────────────────────────────────────────────

  const handleSyncRates = async () => {
    try {
      setSyncing(true)
      const response = await fetch(`${B}/gold-rates/sync`, { method: 'POST', headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        toast({ title: 'Success', description: data.message || 'Gold rates synced successfully' })
        await fetchGoldRates()
      } else {
        const err = await response.json()
        toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to sync gold rates' })
      }
    } catch (err) {
      console.error('Error syncing gold rates:', err)
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to sync gold rates' })
    } finally {
      setSyncing(false)
    }
  }

  const handleUpdateRate = async (karat: string) => {
    const rateValue = parseFloat(editingRates[karat])
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Rate', description: 'Please enter a valid positive number' })
      return
    }
    try {
      setSavingRate(true)
      const response = await fetch(`${B}/gold-rates`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ karat, rate: rateValue, currency: 'USD' }),
      })
      if (response.ok) {
        toast({ title: 'Success', description: `${karat} rate updated successfully` })
        await fetchGoldRates()
      } else {
        const err = await response.json()
        toast({ variant: 'destructive', title: 'Error', description: err.error || 'Failed to update gold rate' })
      }
    } catch (err) {
      console.error('Error updating gold rate:', err)
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update gold rate' })
    } finally {
      setSavingRate(false)
    }
  }

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // ─── Admin users handlers ───────────────────────────────────────────────────

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await fetch(`${B}/auth/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newAdminData.name,
          email: newAdminData.email,
          password: newAdminData.password,
          confirmPassword: newAdminData.password,
          role: 'SHOP_ADMIN',
        }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Failed to create shop admin'); return }
      toast({ title: 'Success', description: 'Shop admin created successfully' })
      setShowCreateAdmin(false)
      setNewAdminData({ name: '', email: '', password: '', shopId: '' })
      fetchData()
    } catch (err) {
      console.error('Error creating admin:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return
    try {
      const response = await fetch(`${B}/users/${adminToDelete}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (response.ok) {
        toast({ title: 'Success', description: 'Admin deleted successfully' })
        fetchData()
      } else {
        const err = await response.json()
        toast({ variant: 'destructive', title: 'Error', description: err.error || 'Failed to delete admin' })
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete admin' })
    } finally {
      setAdminToDelete(null)
    }
  }

  // ─── Loading / auth guards ───────────────────────────────────────────────────

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  if (!session) return null

  // ─── Tab helper ──────────────────────────────────────────────────────────────

  const tabCls = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
      active
        ? 'border-b-2 border-amber-500 text-amber-600'
        : 'text-gray-500 hover:text-gray-700'
    }`

  // ─── Gold Rates panel (shared between SHOP_ADMIN and SUPER_ADMIN) ────────────

  const GoldRatesPanel = () => (
    <div className="space-y-6">
      {/* Sync */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Sync from External API</h3>
              <p className="text-sm text-gray-600">
                Fetch latest gold rates and automatically recalculate all product prices
              </p>
            </div>
            <Button
              onClick={handleSyncRates}
              disabled={syncing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Rates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rates table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-500" />
            Current Gold Rates
          </CardTitle>
          <CardDescription>Rates are in USD per gram. Click Save to update manually.</CardDescription>
        </CardHeader>
        <CardContent>
          {goldLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Karat</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Rate (USD/g)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Updated</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {goldRates.map((rate) => (
                    <tr key={rate.karat} className="border-b hover:bg-amber-50/50 transition-colors">
                      <td className="py-4 px-4 font-semibold text-gray-900">{rate.karat}</td>
                      <td className="py-4 px-4">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingRates[rate.karat] || ''}
                          onChange={(e) =>
                            setEditingRates((prev) => ({ ...prev, [rate.karat]: e.target.value }))
                          }
                          className="w-32"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {formatTimestamp(rate.timestamp)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRate(rate.karat)}
                            disabled={
                              savingRate ||
                              editingRates[rate.karat] === rate.rate.toFixed(2)
                            }
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {goldRates.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No gold rates found. Click Sync Rates to fetch from external API.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-amber-50/50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">How Gold Rates Work</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Gold rates are fetched from an external API and stored in the database</li>
            <li>When rates are synced, all product prices are automatically recalculated</li>
            <li>You can manually update individual rates by editing the value and clicking Save</li>
            <li>Rates are displayed in USD per gram</li>
            <li>K24 is the purest form (24 karat); other karats are calculated from purity ratios</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )

  // ─── SHOP_ADMIN view ─────────────────────────────────────────────────────────

  if (session.user.role === 'SHOP_ADMIN') {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600">Manage your shop and gold rates</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button className={tabCls(shopAdminTab === 'shop')} onClick={() => setShopAdminTab('shop')}>
            Shop Settings
          </button>
          <button className={tabCls(shopAdminTab === 'gold-rates')} onClick={() => setShopAdminTab('gold-rates')}>
            Gold Rates
          </button>
        </div>

        {shopAdminTab === 'shop' && (
          <>
            {!shop ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No Shop Found</h2>
                  <p className="text-gray-600">
                    Your shop account is not set up yet. Please contact the administrator.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {error && (
                  <Card className="border-2 border-red-200 bg-red-50 mb-6">
                    <CardContent className="p-4">
                      <p className="text-red-700">{error}</p>
                    </CardContent>
                  </Card>
                )}
                <form onSubmit={handleUpdateShop}>
                  <Card className="border-0 shadow-lg mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-amber-500" />
                        Shop Information
                      </CardTitle>
                      <CardDescription>Update your shop details and branding</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <SingleImageUpload
                        value={shopFormData.logo}
                        onChange={(url) => setShopFormData({ ...shopFormData, logo: url })}
                        folder="shops/logos"
                        label="Shop Logo"
                      />
                      <SingleImageUpload
                        value={shopFormData.banner}
                        onChange={(url) => setShopFormData({ ...shopFormData, banner: url })}
                        folder="shops/banners"
                        label="Shop Banner"
                      />
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name *</label>
                        <Input
                          required
                          value={shopFormData.name}
                          onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })}
                          placeholder="Enter shop name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                          value={shopFormData.description}
                          onChange={(e) =>
                            setShopFormData({ ...shopFormData, description: e.target.value })
                          }
                          rows={4}
                          className="flex w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          placeholder="Shop description..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                        <Input
                          value={shopFormData.address}
                          onChange={(e) =>
                            setShopFormData({ ...shopFormData, address: e.target.value })
                          }
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                          <Input
                            value={shopFormData.city}
                            onChange={(e) =>
                              setShopFormData({ ...shopFormData, city: e.target.value })
                            }
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                          <Input
                            value={shopFormData.country}
                            onChange={(e) =>
                              setShopFormData({ ...shopFormData, country: e.target.value })
                            }
                            placeholder="Country"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                          <Input
                            type="tel"
                            value={shopFormData.phone}
                            onChange={(e) =>
                              setShopFormData({ ...shopFormData, phone: e.target.value })
                            }
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                          <Input
                            type="email"
                            value={shopFormData.email}
                            onChange={(e) =>
                              setShopFormData({ ...shopFormData, email: e.target.value })
                            }
                            placeholder="shop@example.com"
                          />
                        </div>
                      </div>

                      {/* Shipping Methods */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Shipping Methods *
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                          Select available shipping methods for this shop
                        </p>
                        <div className="space-y-2">
                          {(['PICKUP', 'DELIVERY'] as const).map((method) => (
                            <label key={method} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={shopFormData.shippingMethods.includes(method)}
                                onChange={(e) => {
                                  setShopFormData({
                                    ...shopFormData,
                                    shippingMethods: e.target.checked
                                      ? [...shopFormData.shippingMethods, method]
                                      : shopFormData.shippingMethods.filter((m) => m !== method),
                                  })
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">
                                {method === 'PICKUP' ? 'Pickup from Shop' : 'Delivery'}
                              </span>
                            </label>
                          ))}
                        </div>
                        {shopFormData.shippingMethods.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            At least one shipping method must be selected
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      {shop._count && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Total Products</p>
                            <p className="text-2xl font-bold text-amber-600">{shop._count.products}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                            <p className="text-2xl font-bold text-amber-600">{shop._count.orders}</p>
                          </div>
                        </div>
                      )}

                      <div className="pt-4">
                        <Button type="submit" disabled={submitting} size="lg">
                          <Save className="h-5 w-5 mr-2" />
                          {submitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </>
            )}
          </>
        )}

        {shopAdminTab === 'gold-rates' && <GoldRatesPanel />}
      </div>
    )
  }

  // ─── SUPER_ADMIN view ────────────────────────────────────────────────────────

  if (session.user.role !== 'SUPER_ADMIN') return null

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600">Platform configuration, shops, gold rates, and admin users</p>
      </div>

      {error && (
        <Card className="border-2 border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Top-level tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        <button className={tabCls(superTab === 'system')} onClick={() => setSuperTab('system')}>
          System Config
        </button>
        <button className={tabCls(superTab === 'shops')} onClick={() => setSuperTab('shops')}>
          Shop Management
        </button>
        <button className={tabCls(superTab === 'gold-rates')} onClick={() => setSuperTab('gold-rates')}>
          Gold Rates
        </button>
        <button className={tabCls(superTab === 'admins')} onClick={() => setSuperTab('admins')}>
          Admin Users
        </button>
      </div>

      {/* ── Tab: System Config ─────────────────────────────────────────────── */}
      {superTab === 'system' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-amber-500" />
              System Configuration
            </CardTitle>
            <CardDescription>Global platform settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {configLoading || !systemConfig ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              </div>
            ) : (
              <>
                {/* Platform Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
                  <Input
                    value={configDraft.platformName ?? systemConfig.platformName}
                    onChange={(e) =>
                      setConfigDraft((prev) => ({ ...prev, platformName: e.target.value }))
                    }
                    placeholder="Jowelery"
                  />
                </div>

                {/* Support Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
                  <Input
                    type="email"
                    value={configDraft.supportEmail ?? systemConfig.supportEmail}
                    onChange={(e) =>
                      setConfigDraft((prev) => ({ ...prev, supportEmail: e.target.value }))
                    }
                    placeholder="support@example.com"
                  />
                </div>

                {/* Default Currency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <Select
                    value={configDraft.defaultCurrency ?? systemConfig.defaultCurrency}
                    onValueChange={(v) =>
                      setConfigDraft((prev) => ({ ...prev, defaultCurrency: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {['USD', 'EUR', 'GBP', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Commission Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Platform Commission Rate
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={configDraft.commissionRate ?? systemConfig.commissionRate}
                    onChange={(e) =>
                      setConfigDraft((prev) => ({
                        ...prev,
                        commissionRate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.10 (10%)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Current: {((configDraft.commissionRate ?? systemConfig.commissionRate) * 100).toFixed(1)}%
                  </p>
                </div>

                {/* Single Shop Mode */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-gray-500" />
                      <label className="text-base font-medium">Single Shop Mode</label>
                    </div>
                    <p className="text-sm text-gray-500">Restrict platform to a single default shop</p>
                  </div>
                  <Switch
                    checked={configDraft.singleShopMode ?? systemConfig.singleShopMode}
                    onCheckedChange={(checked) =>
                      setConfigDraft((prev) => ({ ...prev, singleShopMode: checked }))
                    }
                  />
                </div>

                {(configDraft.singleShopMode ?? systemConfig.singleShopMode) && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <label className="block text-sm font-medium mb-2">Default Shop</label>
                    <Select
                      value={configDraft.defaultShopId ?? systemConfig.defaultShopId ?? ''}
                      onValueChange={(v) =>
                        setConfigDraft((prev) => ({ ...prev, defaultShopId: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a shop" />
                      </SelectTrigger>
                      <SelectContent>
                        {shops.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Payment Methods */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Methods
                  </h3>
                  <div className="grid gap-4">
                    {(configDraft.paymentMethods ?? systemConfig.paymentMethods)?.map(
                      (method, index) => (
                        <div
                          key={method.provider}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{method.displayName || method.provider}</p>
                            <p className="text-sm text-gray-500">{method.provider}</p>
                          </div>
                          <Switch
                            checked={method.isEnabled}
                            onCheckedChange={(checked) => togglePaymentMethod(index, checked)}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={handleSaveConfig} className="bg-amber-600 hover:bg-amber-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Shop Management ───────────────────────────────────────────── */}
      {superTab === 'shops' && (
        <div className="space-y-6">
          {/* Create Shop CTA */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Create a New Shop</h3>
                <p className="text-sm text-gray-600">
                  Create a shop and assign a manager in two steps.
                </p>
              </div>
              <Button
                onClick={() => {
                  resetCreateForm()
                  setShowCreateShop(true)
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Store className="h-4 w-4 mr-2" />
                Create Shop
              </Button>
            </CardContent>
          </Card>

          {/* Shops list */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-500" />
                Existing Shops ({shops.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shops.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No shops created yet</p>
              ) : (
                <div className="space-y-4">
                  {shops.map((shopItem) => (
                    <div
                      key={shopItem.id}
                      className="border rounded-lg p-4 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {shopItem.logo && (
                              <Image
                                src={shopItem.logo}
                                alt={shopItem.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                              />
                            )}
                            <h3 className="font-bold text-lg text-gray-900">{shopItem.name}</h3>
                          </div>
                          {shopItem.description && (
                            <p className="text-sm text-gray-600 mb-2">{shopItem.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{shopItem.admin?.email}</span>
                            </div>
                            {shopItem.admin?.name && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{shopItem.admin.name}</span>
                              </div>
                            )}
                            {shopItem.city && shopItem.country && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {shopItem.city}, {shopItem.country}
                                </span>
                              </div>
                            )}
                            {shopItem._count && (
                              <>
                                <span>{shopItem._count.products} products</span>
                                <span>{shopItem._count.orders} orders</span>
                              </>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                shopItem.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : shopItem.status === 'INACTIVE'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {shopItem.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleShopStatus(shopItem)}
                          >
                            {shopItem.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditShop(shopItem)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(shopItem.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Gold Rates ────────────────────────────────────────────────── */}
      {superTab === 'gold-rates' && <GoldRatesPanel />}

      {/* ── Tab: Admin Users ───────────────────────────────────────────────── */}
      {superTab === 'admins' && (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Shop Admins</h3>
                <p className="text-sm text-gray-600">
                  Create standalone shop admin accounts. You can assign them to shops later.
                </p>
              </div>
              <Button
                onClick={() => {
                  setNewAdminData({ name: '', email: '', password: '', shopId: '' })
                  setError('')
                  setShowCreateAdmin(true)
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                Shop Admins ({shopAdmins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shopAdmins.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No shop admins found</p>
              ) : (
                <div className="space-y-3">
                  {shopAdmins.map((admin) => {
                    const assignedShop = shops.find((s) => s.adminId === admin.id)
                    return (
                      <div
                        key={admin.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-4 hover:bg-amber-50 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{admin.name || 'Unnamed'}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Mail className="h-4 w-4" />
                            <span>{admin.email}</span>
                          </div>
                          {assignedShop ? (
                            <div className="flex items-center gap-2 text-sm text-amber-600 mt-1">
                              <Store className="h-4 w-4" />
                              <span>{assignedShop.name}</span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">Not assigned to any shop</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAdminToDelete(admin.id)
                              setDeleteAdminDialogOpen(true)
                            }}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Create Shop Dialog ────────────────────────────────────────────── */}
      <Dialog
        open={showCreateShop}
        onOpenChange={(open) => {
          setShowCreateShop(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-500" />
              Create Shop
            </DialogTitle>
            <DialogDescription>Follow the steps to create a shop and assign a manager</DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center justify-between mb-6 mt-4">
            <div className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  createShopStep >= 1
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {createShopStep > 1 ? (
                  <span className="text-white font-bold">✓</span>
                ) : (
                  <span className="font-bold">1</span>
                )}
              </div>
              <div className={`ml-3 ${createShopStep >= 1 ? 'text-amber-600' : 'text-gray-400'}`}>
                <p className="font-semibold text-sm">Shop Details</p>
                <p className="text-xs">Step 1 of 2</p>
              </div>
            </div>
            <div className="flex-1 mx-4">
              <div className={`h-0.5 ${createShopStep >= 2 ? 'bg-amber-500' : 'bg-gray-300'}`} />
            </div>
            <div className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  createShopStep >= 2
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <span className="font-bold">2</span>
              </div>
              <div className={`ml-3 ${createShopStep >= 2 ? 'text-amber-600' : 'text-gray-400'}`}>
                <p className="font-semibold text-sm">Create Manager</p>
                <p className="text-xs">Step 2 of 2</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="border-2 border-red-200 bg-red-50 p-3 rounded-lg mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {createShopStep === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!formData.shopName) { setError('Shop name is required'); return }
                setError('')
                setCreateShopStep(2)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name *</label>
                <Input
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  placeholder="Enter shop name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full h-24 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  value={formData.shopDescription}
                  onChange={(e) => setFormData({ ...formData, shopDescription: e.target.value })}
                  placeholder="Shop description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <Input
                  value={formData.shopAddress}
                  onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <Input
                    value={formData.shopCity}
                    onChange={(e) => setFormData({ ...formData, shopCity: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <Input
                    value={formData.shopCountry}
                    onChange={(e) => setFormData({ ...formData, shopCountry: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={formData.shopPhone}
                    onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.shopEmail}
                    onChange={(e) => setFormData({ ...formData, shopEmail: e.target.value })}
                    placeholder="shop@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Commission Rate
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  placeholder="0.10 (10%)"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateShop(false)
                    resetCreateForm()
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700">
                  Next: Create Manager
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setError('')
                setSubmitting(true)
                try {
                  // Step 1: create manager account
                  const adminResponse = await fetch(`${B}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.adminName,
                      email: formData.adminEmail,
                      password: formData.adminPassword,
                      confirmPassword: formData.adminPassword,
                      role: 'SHOP_ADMIN',
                    }),
                  })
                  const adminData = await adminResponse.json()
                  if (!adminResponse.ok) {
                    setError(adminData.error || 'Failed to create manager')
                    return
                  }
                  const managerId = adminData.user?.id || adminData.id

                  // Step 2: create shop with manager
                  const shopResponse = await fetch(`${B}/shops`, {
                    method: 'POST',
                    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.shopName,
                      adminId: managerId,
                      description: formData.shopDescription,
                      address: formData.shopAddress,
                      city: formData.shopCity,
                      country: formData.shopCountry,
                      phone: formData.shopPhone,
                      email: formData.shopEmail,
                      commissionRate: parseFloat(formData.commissionRate),
                    }),
                  })
                  const shopData = await shopResponse.json()
                  if (!shopResponse.ok) {
                    setError(shopData.error || 'Failed to create shop')
                    return
                  }

                  toast({ title: 'Success', description: 'Shop and manager created successfully' })
                  setShowCreateShop(false)
                  resetCreateForm()
                  fetchData()
                } catch (err) {
                  console.error('Error creating shop and manager:', err)
                  setError('An error occurred. Please try again.')
                } finally {
                  setSubmitting(false)
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <Input
                  required
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="Enter manager name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <Input
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="manager@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <PasswordInput
                  required
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateShopStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateShop(false)
                    resetCreateForm()
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Shop & Manager'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Shop Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showEditShop} onOpenChange={setShowEditShop}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-500" />
              Edit Shop
            </DialogTitle>
            <DialogDescription>Update shop information and manager details</DialogDescription>
          </DialogHeader>

          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              onClick={() => setEditShopTab('shop')}
              className={tabCls(editShopTab === 'shop')}
            >
              Shop Details
            </button>
            <button
              type="button"
              onClick={() => setEditShopTab('manager')}
              className={tabCls(editShopTab === 'manager')}
            >
              Manager Info
            </button>
          </div>

          {error && (
            <div className="border-2 border-red-200 bg-red-50 p-3 rounded-lg mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {editShopTab === 'shop' ? (
            <form onSubmit={handleUpdateShopForSuperAdmin} className="space-y-4">
              <SingleImageUpload
                value={editShopData.logo}
                onChange={(url) => setEditShopData({ ...editShopData, logo: url })}
                folder="shops/logos"
                label="Shop Logo"
              />
              <SingleImageUpload
                value={editShopData.banner}
                onChange={(url) => setEditShopData({ ...editShopData, banner: url })}
                folder="shops/banners"
                label="Shop Banner"
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name *</label>
                <Input
                  required
                  value={editShopData.name}
                  onChange={(e) => setEditShopData({ ...editShopData, name: e.target.value })}
                  placeholder="Enter shop name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full h-24 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  value={editShopData.description}
                  onChange={(e) => setEditShopData({ ...editShopData, description: e.target.value })}
                  placeholder="Shop description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <Input
                  value={editShopData.address}
                  onChange={(e) => setEditShopData({ ...editShopData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <Input
                    value={editShopData.city}
                    onChange={(e) => setEditShopData({ ...editShopData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <Input
                    value={editShopData.country}
                    onChange={(e) => setEditShopData({ ...editShopData, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={editShopData.phone}
                    onChange={(e) => setEditShopData({ ...editShopData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <Input
                    type="email"
                    value={editShopData.email}
                    onChange={(e) => setEditShopData({ ...editShopData, email: e.target.value })}
                    placeholder="shop@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Commission Rate
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={editShopData.commissionRate}
                    onChange={(e) =>
                      setEditShopData({ ...editShopData, commissionRate: e.target.value })
                    }
                    placeholder="0.10 (10%)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    value={editShopData.status}
                    onChange={(e) =>
                      setEditShopData({
                        ...editShopData,
                        status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
                      })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditShop(false)
                    setEditingShop(null)
                    setError('')
                    setEditShopTab('shop')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Shop'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdateManager} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Change Manager
                </label>
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  value={editShopData.adminId}
                  onChange={(e) => setEditShopData({ ...editShopData, adminId: e.target.value })}
                >
                  <option value={editingShop?.adminId}>
                    {editingShop?.admin.name || editingShop?.admin.email} (current)
                  </option>
                  {shopAdmins
                    .filter(
                      (a) =>
                        a.id !== editingShop?.adminId &&
                        !shops.some(
                          (s) => s.adminId === a.id && s.id !== editingShop?.id,
                        ),
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.email}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Select a different manager for this shop</p>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Update Current Manager Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      required
                      value={editManagerData.name}
                      onChange={(e) =>
                        setEditManagerData({ ...editManagerData, name: e.target.value })
                      }
                      placeholder="Enter manager name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <Input
                      type="email"
                      required
                      value={editManagerData.email}
                      onChange={(e) =>
                        setEditManagerData({ ...editManagerData, email: e.target.value })
                      }
                      placeholder="manager@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <Input
                      type="tel"
                      value={editManagerData.phone}
                      onChange={(e) =>
                        setEditManagerData({ ...editManagerData, phone: e.target.value })
                      }
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditShop(false)
                    setEditingShop(null)
                    setError('')
                    setEditShopTab('shop')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Manager'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create Admin Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={showCreateAdmin}
        onOpenChange={(open) => {
          setShowCreateAdmin(open)
          if (!open) { setError(''); setNewAdminData({ name: '', email: '', password: '', shopId: '' }) }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-500" />
              Create Shop Admin
            </DialogTitle>
            <DialogDescription>
              Create a new shop admin account. You can assign them to a shop from the Shop Management tab.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="border-2 border-red-200 bg-red-50 p-3 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <Input
                required
                value={newAdminData.name}
                onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <Input
                type="email"
                required
                value={newAdminData.email}
                onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
              <PasswordInput
                required
                value={newAdminData.password}
                onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign to Shop (optional)
              </label>
              <select
                className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                value={newAdminData.shopId}
                onChange={(e) => setNewAdminData({ ...newAdminData, shopId: e.target.value })}
              >
                <option value="">— No shop —</option>
                {shops
                  .filter((s) => !shopAdmins.some((a) => a.id === s.adminId))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateAdmin(false)
                  setError('')
                  setNewAdminData({ name: '', email: '', password: '', shopId: '' })
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Admin'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Shop Confirmation ──────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Shop"
        description="Are you sure you want to delete this shop? This action cannot be undone. All products and orders associated with this shop will be affected."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      {/* ── Delete Admin Confirmation ─────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteAdminDialogOpen}
        onOpenChange={setDeleteAdminDialogOpen}
        title="Delete Admin"
        description="Are you sure you want to delete this shop admin? They will lose access to their shop."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteAdmin}
        variant="destructive"
      />
    </div>
  )
}
