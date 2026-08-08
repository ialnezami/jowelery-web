'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ImageUpload } from '@/components/ImageUpload'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () => typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

interface Product {
  id: string
  name: string
  category: string
  karat: string
  weight: number
  makingCharges: number
  finalPrice: number
  basePricePerGram: number | null
  images: string[]
  description: string | null
  stockQuantity: number
  sku: string
  isActive: boolean
  shop: {
    id: string
    name: string
    logo: string | null
  }
}

interface Shop {
  id: string
  name: string
}

interface ProductFormData {
  name: string
  category: string
  karat: string
  weight: string
  makingCharges: string
  images: string[]
  description: string
  stockQuantity: string
  sku: string
  shopId: string
}

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [goldRates, setGoldRates] = useState<Record<string, number>>({})
  const [shops, setShops] = useState<Shop[]>([])
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'RINGS',
    karat: 'K24',
    weight: '',
    makingCharges: '0',
    images: [],
    description: '',
    stockQuantity: '0',
    sku: '',
    shopId: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (session && (session.user.role === 'SHOP_ADMIN' || session.user.role === 'SUPER_ADMIN')) {
      fetchProducts()
      fetchGoldRates()
      if (session.user.role === 'SUPER_ADMIN') fetchShops()
    } else if (session) {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchShops = async () => {
    try {
      const response = await fetch(`${B}/shops`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        setShops(Array.isArray(data) ? data : data.shops || [])
      }
    } catch (error) {
      console.error('Error fetching shops:', error)
    }
  }

  const fetchGoldRates = async () => {
    try {
      const response = await fetch(`${B}/gold-rates`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        const rates: Record<string, number> = {}
        if (Array.isArray(data)) {
          data.forEach((rate: any) => {
            rates[rate.karat] = rate.rate
          })
        }
        setGoldRates(rates)
      }
    } catch (error) {
      console.error('Error fetching gold rates:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      // Include inactive products for dashboard management
      const response = await fetch(`${B}/products?limit=100&includeInactive=true`, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch products',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      category: 'RINGS',
      karat: 'K24',
      weight: '',
      makingCharges: '0',
      images: [],
      description: '',
      stockQuantity: '0',
      sku: '',
      shopId: shops[0]?.id || '',
    })
    setShowForm(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      karat: product.karat,
      weight: product.weight.toString(),
      makingCharges: product.makingCharges.toString(),
      images: product.images || [],
      description: product.description || '',
      stockQuantity: product.stockQuantity.toString(),
      sku: product.sku,
      shopId: product.shop?.id || '',
    })
    setShowForm(true)
  }

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`${B}/products/${productToDelete}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
        })
        fetchProducts()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to delete product',
        })
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete product',
      })
    } finally {
      setProductToDelete(null)
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await fetch(`${B}/products/${product.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          isActive: !product.isActive,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`,
        })
        fetchProducts()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to update product',
        })
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update product',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload: Record<string, any> = {
        name: formData.name,
        category: formData.category,
        karat: formData.karat,
        weight: parseFloat(formData.weight),
        makingCharges: parseFloat(formData.makingCharges),
        images: formData.images,
        description: formData.description || undefined,
        stockQuantity: parseInt(formData.stockQuantity),
        sku: formData.sku,
      }
      if (formData.shopId) payload.shopId = formData.shopId

      let response
      if (editingProduct) {
        response = await fetch(`${B}/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      } else {
        // Create new product
        response = await fetch(`${B}/products`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      }

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingProduct ? 'Product updated successfully' : 'Product created successfully',
        })
        setShowForm(false)
        fetchProducts()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || (editingProduct ? 'Failed to update product' : 'Failed to create product'),
        })
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: editingProduct ? 'Failed to update product' : 'Failed to create product',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Products Management
          </h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button onClick={handleCreate} size="lg" className="w-full sm:w-auto">
          <Plus className="h-5 w-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search products by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card className="border-0 shadow-md text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {searchQuery ? 'No products found matching your search' : 'No products yet'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-yellow-50">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Package className="h-16 w-16" />
                  </div>
                )}
                {!product.isActive && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Inactive
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p><span className="font-semibold">SKU:</span> {product.sku}</p>
                  <p><span className="font-semibold">Category:</span> {product.category}</p>
                  <p><span className="font-semibold">Karat:</span> {product.karat}</p>
                  <p><span className="font-semibold">Weight:</span> {product.weight}g</p>
                  <p><span className="font-semibold">Stock:</span> {product.stockQuantity}</p>
                  {product.shop && <p><span className="font-semibold">Shop:</span> {product.shop.name}</p>}
                </div>
                <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-4">
                  ${product.finalPrice.toFixed(2)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/products/${product.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(product)}
                    className={product.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                  >
                    {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
            <CardHeader className="sticky top-0 bg-white z-10 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shop Selector — SUPER_ADMIN only */}
                {shops.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Shop *</label>
                    <select
                      required
                      value={formData.shopId}
                      onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                      className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <option value="">Select a shop...</option>
                      {shops.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Gold Ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU *
                    </label>
                    <Input
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g., GR-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <option value="RINGS">Rings</option>
                      <option value="NECKLACES">Necklaces</option>
                      <option value="BRACELETS">Bracelets</option>
                      <option value="EARRINGS">Earrings</option>
                      <option value="BARS">Bars</option>
                      <option value="COINS">Coins</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Karat *
                    </label>
                    <select
                      required
                      value={formData.karat}
                      onChange={(e) => setFormData({ ...formData, karat: e.target.value })}
                      className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <option value="K24">24K</option>
                      <option value="K22">22K</option>
                      <option value="K21">21K</option>
                      <option value="K18">18K</option>
                      <option value="K14">14K</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Weight (grams) *
                    </label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="e.g., 5.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Making Charges (per gram, USD) *
                    </label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.makingCharges}
                      onChange={(e) => setFormData({ ...formData, makingCharges: e.target.value })}
                      placeholder="e.g., 5.50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Fixed amount per gram (not percentage)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <Input
                      required
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                {/* Price Preview */}
                {formData.weight && formData.karat && formData.makingCharges && goldRates[formData.karat] && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-2">Price Preview:</p>
                    <p className="text-2xl font-bold text-amber-900">
                      ${((goldRates[formData.karat] + parseFloat(formData.makingCharges || '0')) * parseFloat(formData.weight || '0')).toFixed(2)}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Gold Rate ({formData.karat}): ${goldRates[formData.karat].toFixed(2)}/g + 
                      Making Charges: ${parseFloat(formData.makingCharges || '0').toFixed(2)}/g × 
                      Weight: {formData.weight}g
                    </p>
                    <p className="text-xs text-amber-600 mt-1 italic">
                      Formula: (Gold Rate per gram + Making Charges per gram) × Weight
                    </p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="flex w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    placeholder="Product description..."
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Images * (at least 1 required)
                  </label>
                  <ImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData({ ...formData, images: urls })}
                    maxImages={5}
                    folder="products"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || formData.images.length === 0}
                    className="flex-1"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {editingProduct ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      editingProduct ? 'Update Product' : 'Create Product'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  )
}

