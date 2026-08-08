'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Filter, SlidersHorizontal, ShoppingCart, Heart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCurrency } from '@/hooks/useCurrency'
import { useCart } from '@/components/CartProvider'
import { addToGuestCart } from '@/lib/guest-cart'

export const dynamic = 'force-dynamic'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

function getToken(): string | undefined {
  return typeof window !== 'undefined' ? (window as any).__JWT : undefined
}

interface Product {
  id: string
  name: string
  category: string
  karat: string
  weight: number
  finalPrice: number
  images: string[]
  shop: {
    id: string
    name: string
    logo: string | null
  }
}

export default function ProductsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const { refreshCart } = useCart()
  const { format } = useCurrency()
  const t = useTranslations('products')
  const tCommon = useTranslations('common')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set())
  const [togglingWishlist, setTogglingWishlist] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    category: '',
    karat: '',
    minPrice: '',
    maxPrice: '',
  })

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    if (session?.user?.role === 'CLIENT') {
      fetchWishlist()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchWishlist = async () => {
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${B}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setWishlistedIds(new Set((data as { productId: string }[]).map((w) => w.productId)))
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    }
  }

  const handleToggleWishlist = async (productId: string) => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent('/products')}`)
      return
    }

    const token = getToken()
    const isWishlisted = wishlistedIds.has(productId)

    // Optimistic update
    setWishlistedIds((prev) => {
      const next = new Set(prev)
      if (isWishlisted) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })

    setTogglingWishlist(productId)
    try {
      let response: Response
      if (isWishlisted) {
        response = await fetch(`${B}/wishlist/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        response = await fetch(`${B}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        })
      }

      if (!response.ok) {
        // Revert optimistic update on error
        setWishlistedIds((prev) => {
          const next = new Set(prev)
          if (isWishlisted) {
            next.add(productId)
          } else {
            next.delete(productId)
          }
          return next
        })
        throw new Error('Failed to update wishlist')
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update wishlist. Please try again.',
      })
    } finally {
      setTogglingWishlist(null)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.karat) params.append('karat', filters.karat)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)

      const response = await fetch(`${B}/products?${params}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Check if user is authenticated
    if (status === 'loading') {
      return
    }

    // If not logged in, add to guest cart (localStorage)
    if (!session) {
      addToGuestCart(productId, 1)
      toast({
        variant: 'success',
        title: 'Added to Cart!',
        description: 'Product added to cart. Sign in to checkout.',
      })
      refreshCart()
      return
    }

    // Check if user has CLIENT role
    if (session.user.role !== 'CLIENT') {
      toast({
        variant: 'warning',
        title: 'Access Restricted',
        description: 'Only customers can add items to cart. Please sign in with a customer account.',
      })
      return
    }

    try {
      setAddingToCart(productId)
      const token = getToken()
      const response = await fetch(`${B}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      })

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Success!',
          description: 'Product added to cart successfully!',
        })
        refreshCart()
      } else {
        const error = await response.json()
        if (response.status === 401) {
          router.push(`/auth/login?callbackUrl=${encodeURIComponent('/products')}`)
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.error || 'Failed to add to cart',
          })
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add to cart. Please try again.',
      })
    } finally {
      setAddingToCart(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-gray-600 text-lg">{t('subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Filters Sidebar */}
        <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card className="sticky top-24 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-bold text-gray-900">{tCommon('filter')}</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('category')}</label>
                  <select
                    className="w-full h-11 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <option value="">{t('allCategories')}</option>
                    <option value="RINGS">Rings</option>
                    <option value="NECKLACES">Necklaces</option>
                    <option value="BRACELETS">Bracelets</option>
                    <option value="EARRINGS">Earrings</option>
                    <option value="BARS">Bars</option>
                    <option value="COINS">Coins</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('karat')}</label>
                  <select
                    className="w-full h-11 rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                    value={filters.karat}
                    onChange={(e) => setFilters({ ...filters, karat: e.target.value })}
                  >
                    <option value="">{t('allKarats')}</option>
                    <option value="K24">24K</option>
                    <option value="K22">22K</option>
                    <option value="K21">21K</option>
                    <option value="K18">18K</option>
                    <option value="K14">14K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('minPrice')}</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('maxPrice')}</label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFilters({ category: '', karat: '', minPrice: '', maxPrice: '' })}
                >
                  {t('clearFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">{t('productsFound', { count: products.length })}</p>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {tCommon('filter')}
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-t-2xl" />
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="border-0 shadow-lg text-center py-12">
              <CardContent>
                <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t('noProducts')}</p>
                <p className="text-gray-400 text-sm mt-2">{t('tryFilters')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="group"
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover-lift animate-fade-in h-full flex flex-col"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
                      <Link href={`/products/${product.id}`} className="block h-full w-full">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Sparkles className="h-16 w-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      {(session?.user?.role === 'CLIENT' || !session) && (
                        <button
                          onClick={(e) => { e.preventDefault(); handleToggleWishlist(product.id) }}
                          disabled={togglingWishlist === product.id}
                          className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow hover:bg-white transition-colors"
                          aria-label={wishlistedIds.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <Heart
                            size={18}
                            className={wishlistedIds.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                          />
                        </button>
                      )}
                    </div>
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {product.karat} • {product.weight}g
                        </p>
                        <div className="flex items-baseline justify-between mb-4">
                          <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                            {format(product.finalPrice)}
                          </p>
                          <p className="text-sm text-gray-500">{product.shop.name}</p>
                        </div>
                      </Link>
                      <div className="flex gap-2 mt-auto pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-10"
                          onClick={(e) => {
                            e.preventDefault()
                            router.push(`/products/${product.id}`)
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={(e) => handleAddToCart(e, product.id)}
                          disabled={addingToCart === product.id}
                          size="sm"
                          className="flex-1 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                        >
                          {addingToCart === product.id ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
