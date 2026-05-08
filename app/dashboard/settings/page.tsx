'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { SingleImageUpload } from '@/components/SingleImageUpload'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () => typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Store, Users, Building2, Mail, Phone, MapPin, Settings as SettingsIcon, Save, Edit, Trash2, CreditCard, ToggleLeft } from 'lucide-react'
import Image from 'next/image'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SystemConfig {
  singleShopMode: boolean
  defaultShopId: string | null
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
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [shop, setShop] = useState<Shop | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [shopAdmins, setShopAdmins] = useState<ShopAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreateShop, setShowCreateShop] = useState(false)
  const [showEditShop, setShowEditShop] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [createShopStep, setCreateShopStep] = useState<1 | 2>(1)
  const [editShopTab, setEditShopTab] = useState<'shop' | 'manager'>('shop')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shopToDelete, setShopToDelete] = useState<string | null>(null)
  const [error, setError] = useState('')

  // System Config State
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
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

  // Super admin form data
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

  // Edit shop form data
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

  // Edit manager form data
  const [editManagerData, setEditManagerData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (session) {
      if (session.user.role === 'SHOP_ADMIN') {
        fetchShop()
      } else if (session.user.role === 'SUPER_ADMIN') {
        fetchData()
        fetchSystemConfig()
      } else {
        router.push('/dashboard')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  // Update manager data when adminId changes in edit form
  useEffect(() => {
    if (editShopTab === 'manager' && editShopData.adminId && shopAdmins.length > 0) {
      const selectedAdmin = shopAdmins.find(admin => admin.id === editShopData.adminId)
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

  const fetchShop = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${B}/shops?adminId=${session?.user.id}`, { headers: authHeaders() })
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
            shippingMethods: (shopData.shippingMethods || ['PICKUP', 'DELIVERY']) as ('PICKUP' | 'DELIVERY')[],
          })
        }
      }
    } catch (error) {
      console.error('Error fetching shop:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch shop information',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await fetch(`${B}/admin/config`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        setSystemConfig(data)
      }
    } catch (error) {
      console.error('Error fetching system config:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleUpdateConfig = async (newConfig: Partial<SystemConfig>) => {
    try {
      const response = await fetch(`${B}/admin/config`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(newConfig),
      })

      if (response.ok) {
        const updated = await response.json()
        setSystemConfig(updated)
        toast({
          title: 'Success',
          description: 'System configuration updated',
        })
      } else {
        throw new Error('Failed to update config')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update configuration',
      })
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [shopsRes, usersRes] = await Promise.all([
        fetch(`${B}/shops`, { headers: authHeaders() }).catch(err => {
          console.error('Error fetching shops:', err)
          return { ok: false, json: async () => ({ error: 'Failed to fetch shops' }) }
        }),
        fetch(`${B}/users?role=SHOP_ADMIN`, { headers: authHeaders() }).catch(err => {
          console.error('Error fetching users:', err)
          return { ok: false, json: async () => ({ error: 'Failed to fetch users' }) }
        }),
      ])

      if (shopsRes.ok) {
        try {
          const shopsData = await shopsRes.json()
          setShops(Array.isArray(shopsData) ? shopsData : [])
        } catch (err) {
          console.error('Error parsing shops data:', err)
          setShops([])
        }
      } else {
        const errorData = await shopsRes.json().catch(() => ({}))
        if (errorData.error === 'Unauthorized') {
          router.push('/auth/login')
          return
        }
        console.error('Failed to fetch shops:', errorData)
      }

      if (usersRes.ok) {
        try {
          const usersData = await usersRes.json()
          setShopAdmins(Array.isArray(usersData) ? usersData : [])
        } catch (err) {
          console.error('Error parsing users data:', err)
          setShopAdmins([])
        }
      } else {
        const errorData = await usersRes.json().catch(() => ({}))
        if (errorData.error === 'Unauthorized') {
          router.push('/auth/login')
          return
        }
        console.error('Failed to fetch users:', errorData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!shop) {
        setError('Shop not found')
        return
      }

      if (!shopFormData.shippingMethods || shopFormData.shippingMethods.length === 0) {
        setError('At least one shipping method must be selected')
        setSubmitting(false)
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

      if (!response.ok) {
        setError(data.error || 'Failed to update shop')
        return
      }

      toast({
        title: 'Success',
        description: 'Shop information updated successfully',
      })
      fetchShop()
    } catch (error) {
      console.error('Error updating shop:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // This validation is no longer needed since manager is created in step 2
      // Shop creation happens together with manager creation

      const response = await fetch(`${B}/shops`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: formData.shopName,
          adminId: formData.adminId,
          description: formData.shopDescription,
          address: formData.shopAddress,
          city: formData.shopCity,
          country: formData.shopCountry,
          phone: formData.shopPhone,
          email: formData.shopEmail,
          commissionRate: parseFloat(formData.commissionRate),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create shop')
        return
      }

      toast({
        title: 'Success',
        description: 'Shop created successfully',
      })
      setShowCreateShop(false)
      setCreateShopStep(1)
      setFormData({
        ...formData,
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
      fetchData()
    } catch (error) {
      console.error('Error creating shop:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`${B}/auth/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: formData.adminName,
          email: formData.adminEmail,
          password: formData.adminPassword,
          confirmPassword: formData.adminPassword,
          role: 'SHOP_ADMIN',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create shop admin')
        return
      }

      toast({
        title: 'Success',
        description: 'Shop admin created successfully',
      })
      
      // This handler is no longer used since we create manager and shop together in step 2
      // Keeping for backward compatibility but it shouldn't be called
      
      fetchData()
    } catch (error) {
      console.error('Error creating admin:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop)
    setEditShopData({
      name: shop.name || '',
      description: shop.description || '',
      address: shop.address || '',
      city: shop.city || '',
      country: shop.country || '',
      phone: shop.phone || '',
      email: shop.email || '',
      logo: shop.logo,
      banner: shop.banner,
      commissionRate: shop.commissionRate.toString(),
      status: shop.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
      adminId: shop.adminId,
    })
    setEditManagerData({
      name: shop.admin.name || '',
      email: shop.admin.email || '',
      phone: '', // Phone not in admin object, will fetch if needed
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
          adminId: editShopData.adminId !== editingShop.adminId ? editShopData.adminId : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || data.message || 'Failed to update shop')
        return
      }

      toast({
        title: 'Success',
        description: 'Shop created successfully',
      })
      setShowCreateShop(false)
      setCreateShopStep(1)
      setFormData({
        ...formData,
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
      fetchData()
    } catch (error) {
      console.error('Error updating shop:', error)
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
      const response = await fetch(`${B}/users?id=${editingShop.adminId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: editManagerData.name,
          email: editManagerData.email,
          phone: editManagerData.phone || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || data.message || 'Failed to update manager')
        return
      }

      toast({
        title: 'Success',
        description: 'Manager updated successfully',
      })
      fetchData()
      // Refresh the shop data
      if (editingShop) {
        const shopResponse = await fetch(`${B}/shops/${editingShop.id}`, { headers: authHeaders() })
        if (shopResponse.ok) {
          const shopData = await shopResponse.json()
          handleEditShop(shopData)
        }
      }
    } catch (error) {
      console.error('Error updating manager:', error)
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
        toast({
          title: 'Success',
          description: 'Shop deleted successfully',
        })
        fetchData()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to delete shop',
        })
      }
    } catch (error) {
      console.error('Error deleting shop:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete shop',
      })
    } finally {
      setShopToDelete(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // SHOP_ADMIN: Show shop settings
  if (session.user.role === 'SHOP_ADMIN') {
    if (!shop) {
      return (
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Shop Found</h2>
              <p className="text-gray-600">Your shop account is not set up yet. Please contact the administrator.</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Shop Settings
          </h1>
          <p className="text-gray-600">Update your shop information</p>
        </div>

        {error && (
          <Card className="border-2 border-red-200 bg-red-50 mb-6 animate-scale-in">
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
              {/* Shop Logo */}
              <div>
                <SingleImageUpload
                  value={shopFormData.logo}
                  onChange={(url) => setShopFormData({ ...shopFormData, logo: url })}
                  folder="shops/logos"
                  label="Shop Logo"
                />
              </div>

              {/* Shop Banner */}
              <div>
                <SingleImageUpload
                  value={shopFormData.banner}
                  onChange={(url) => setShopFormData({ ...shopFormData, banner: url })}
                  folder="shops/banners"
                  label="Shop Banner"
                />
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shop Name *
                </label>
                <Input
                  required
                  value={shopFormData.name}
                  onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })}
                  placeholder="Enter shop name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={shopFormData.description}
                  onChange={(e) => setShopFormData({ ...shopFormData, description: e.target.value })}
                  rows={4}
                  className="flex w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  placeholder="Shop description..."
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <Input
                  value={shopFormData.address}
                  onChange={(e) => setShopFormData({ ...shopFormData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    value={shopFormData.city}
                    onChange={(e) => setShopFormData({ ...shopFormData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={shopFormData.country}
                    onChange={(e) => setShopFormData({ ...shopFormData, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={shopFormData.phone}
                    onChange={(e) => setShopFormData({ ...shopFormData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={shopFormData.email}
                    onChange={(e) => setShopFormData({ ...shopFormData, email: e.target.value })}
                    placeholder="shop@example.com"
                  />
                </div>
              </div>

              {/* Shipping Methods */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Methods *</label>
                <p className="text-xs text-gray-500 mb-3">Select available shipping methods for this shop</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shopFormData.shippingMethods.includes('PICKUP')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShopFormData({
                            ...shopFormData,
                            shippingMethods: [...shopFormData.shippingMethods, 'PICKUP'],
                          })
                        } else {
                          setShopFormData({
                            ...shopFormData,
                            shippingMethods: shopFormData.shippingMethods.filter(m => m !== 'PICKUP'),
                          })
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Pickup from Shop</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shopFormData.shippingMethods.includes('DELIVERY')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShopFormData({
                            ...shopFormData,
                            shippingMethods: [...shopFormData.shippingMethods, 'DELIVERY'],
                          })
                        } else {
                          setShopFormData({
                            ...shopFormData,
                            shippingMethods: shopFormData.shippingMethods.filter(m => m !== 'DELIVERY'),
                          })
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Delivery</span>
                  </label>
                </div>
                {shopFormData.shippingMethods.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">At least one shipping method must be selected</p>
                )}
              </div>

              {/* Shop Stats */}
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

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting} size="lg">
                  <Save className="h-5 w-5 mr-2" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    )
  }

  // SUPER_ADMIN: Show shop/admin management (existing code)
  if (session.user.role !== 'SUPER_ADMIN') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600">Manage shops and shop admins</p>
      </div>

      {error && (
        <Card className="border-2 border-red-200 bg-red-50 mb-6 animate-scale-in">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* System Configuration Section */}
      <Card className="border-0 shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-amber-500" />
            System Configuration
          </CardTitle>
          <CardDescription>Global platform settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {systemConfig ? (
            <>
              {/* Single Shop Mode */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-gray-500" />
                    <label className="text-base font-medium">Single Shop Mode</label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Restrict platform to a single default shop
                  </p>
                </div>
                <Switch
                  checked={systemConfig.singleShopMode}
                  onCheckedChange={(checked) =>
                    handleUpdateConfig({ singleShopMode: checked })
                  }
                />
              </div>

              {/* Default Shop Selection */}
              {systemConfig.singleShopMode && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <label className="block text-sm font-medium mb-2">Default Shop</label>
                  <Select
                    value={systemConfig.defaultShopId || ''}
                    onValueChange={(value) =>
                      handleUpdateConfig({ defaultShopId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
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
                  {systemConfig.paymentMethods.map((method, index) => (
                    <div key={method.provider} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{method.displayName || method.provider}</p>
                        <p className="text-sm text-gray-500">{method.provider}</p>
                      </div>
                      <Switch
                        checked={method.isEnabled}
                        onCheckedChange={(checked) => {
                          const newMethods = [...systemConfig.paymentMethods]
                          newMethods[index] = { ...method, isEnabled: checked }
                          handleUpdateConfig({ paymentMethods: newMethods })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">Loading configuration...</div>
          )}
        </CardContent>
      </Card>

      {/* Create Shop Button */}
      <Card className="border-0 shadow-lg mb-8">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <Store className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Create Shop</h3>
          <p className="text-sm text-gray-600 mb-4 text-center">Create a new shop and assign an admin. You can also create a new manager from within the modal.</p>
          <Button onClick={() => {
            setCreateShopStep(1)
            setShowCreateShop(true)
          }}>
            <Store className="h-4 w-4 mr-2" />
            Create Shop
          </Button>
        </CardContent>
      </Card>

      {/* Create Shop Modal */}
      <Dialog open={showCreateShop} onOpenChange={(open) => {
        setShowCreateShop(open)
        if (!open) {
          setCreateShopStep(1)
          setError('')
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-500" />
              Create Shop
            </DialogTitle>
            <DialogDescription>
              Follow the steps to create a shop and assign a manager
            </DialogDescription>
          </DialogHeader>
          
          {/* Stepper */}
          <div className="flex items-center justify-between mb-6 mt-4">
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                createShopStep >= 1 ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {createShopStep > 1 ? (
                  <span className="text-white font-bold">✓</span>
                ) : (
                  <span className="font-bold">1</span>
                )}
              </div>
              <div className={`ml-3 ${createShopStep >= 1 ? 'text-amber-600' : 'text-gray-400'}`}>
                <p className="font-semibold text-sm">Create Shop</p>
                <p className="text-xs">Step 1 of 2</p>
              </div>
            </div>
            <div className="flex-1 mx-4">
              <div className={`h-0.5 ${createShopStep >= 2 ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                createShopStep >= 2 ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300 text-gray-400'
              }`}>
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
            <form onSubmit={(e) => {
              e.preventDefault()
              // Validate shop form, then move to step 2
              if (!formData.shopName) {
                setError('Shop name is required')
                return
              }
              setCreateShopStep(2)
            }} className="space-y-4">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Rate</label>
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
                  setError('')
                  setCreateShopStep(1)
                  setFormData({
                    ...formData,
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
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                Next: Create Manager
              </Button>
            </div>
          </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault()
              setError('')
              setSubmitting(true)

              try {
                // First create the manager
                const adminResponse = await fetch(`${B}/auth/register`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
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

                // Then create the shop with the new manager
                const shopResponse = await fetch(`${B}/shops`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
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

                toast({
                  title: 'Success',
                  description: 'Shop and manager created successfully',
                })
                setShowCreateShop(false)
                setCreateShopStep(1)
                setFormData({
                  ...formData,
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
                fetchData()
              } catch (error) {
                console.error('Error creating shop and manager:', error)
                setError('An error occurred. Please try again.')
              } finally {
                setSubmitting(false)
              }
            }} className="space-y-4">
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
                <Input
                  type="password"
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
                  onClick={() => {
                    setCreateShopStep(1)
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateShop(false)
                    setError('')
                    setCreateShopStep(1)
                    setFormData({
                      ...formData,
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
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Shop & Manager'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Existing Shops */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-500" />
            Existing Shops
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shops.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No shops created yet</p>
          ) : (
            <div className="space-y-4">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="border rounded-lg p-4 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{shop.name}</h3>
                      {shop.description && (
                        <p className="text-sm text-gray-600 mb-2">{shop.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{shop.admin.email}</span>
                        </div>
                        {shop.admin.name && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{shop.admin.name}</span>
                          </div>
                        )}
                        {shop.city && shop.country && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{shop.city}, {shop.country}</span>
                          </div>
                        )}
                        {shop._count && (
                          <>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              <span>{shop._count.products} products</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Store className="h-4 w-4" />
                              <span>{shop._count.orders} orders</span>
                            </div>
                          </>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${shop.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            shop.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {shop.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditShop(shop)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(shop.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Edit Shop Modal */}
      <Dialog open={showEditShop} onOpenChange={setShowEditShop}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-500" />
              Edit Shop
            </DialogTitle>
            <DialogDescription>
              Update shop information and manager details
            </DialogDescription>
          </DialogHeader>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              onClick={() => setEditShopTab('shop')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                editShopTab === 'shop'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Shop Details
            </button>
            <button
              type="button"
              onClick={() => setEditShopTab('manager')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                editShopTab === 'manager'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Manager Info
            </button>
          </div>

          {error && (
            <div className="border-2 border-red-200 bg-red-50 p-3 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {editShopTab === 'shop' ? (
            <form onSubmit={handleUpdateShopForSuperAdmin} className="space-y-4">
            {/* Shop Logo */}
            <div>
              <SingleImageUpload
                value={editShopData.logo}
                onChange={(url) => setEditShopData({ ...editShopData, logo: url })}
                folder="shops/logos"
                label="Shop Logo"
              />
            </div>

            {/* Shop Banner */}
            <div>
              <SingleImageUpload
                value={editShopData.banner}
                onChange={(url) => setEditShopData({ ...editShopData, banner: url })}
                folder="shops/banners"
                label="Shop Banner"
              />
            </div>

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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Rate</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={editShopData.commissionRate}
                  onChange={(e) => setEditShopData({ ...editShopData, commissionRate: e.target.value })}
                  placeholder="0.10 (10%)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  value={editShopData.status}
                  onChange={(e) => setEditShopData({ ...editShopData, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' })}
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
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Shop'}
              </Button>
            </div>
          </form>
          ) : (
            <form onSubmit={handleUpdateManager} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Change Manager</label>
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  value={editShopData.adminId}
                  onChange={(e) => setEditShopData({ ...editShopData, adminId: e.target.value })}
                >
                  <option value={editingShop?.adminId}>{editingShop?.admin.name || editingShop?.admin.email}</option>
                  {shopAdmins
                    .filter(admin => admin.id !== editingShop?.adminId && !shops.some(shop => shop.adminId === admin.id && shop.id !== editingShop?.id))
                    .map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name || admin.email}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Select a different manager for this shop</p>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Update Current Manager Information</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <Input
                    required
                    value={editManagerData.name}
                    onChange={(e) => setEditManagerData({ ...editManagerData, name: e.target.value })}
                    placeholder="Enter manager name"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <Input
                    type="email"
                    required
                    value={editManagerData.email}
                    onChange={(e) => setEditManagerData({ ...editManagerData, email: e.target.value })}
                    placeholder="manager@example.com"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={editManagerData.phone}
                    onChange={(e) => setEditManagerData({ ...editManagerData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
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
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Manager'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
    </div>
  )
}
