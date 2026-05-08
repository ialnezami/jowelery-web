'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'
import { ShoppingCart, Sparkles, Plus, Minus, Heart } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/components/CartProvider'
import { addToGuestCart } from '@/lib/guest-cart'

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
  shop: {
    id: string
    name: string
    logo: string | null
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const { refreshCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
      if (session?.user?.role === 'CLIENT') {
        checkWishlistStatus()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, session])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${B}/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch product:', response.status, errorData)
        // Product not found or error
        setProduct(null)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const checkWishlistStatus = async () => {
    if (!session || session.user.role !== 'CLIENT') return
    
    try {
      const response = await fetch(`${B}/wishlist')
      if (response.ok) {
        const wishlist = await response.json()
        setIsInWishlist(wishlist.some((item: any) => item.productId === params.id))
      }
    } catch (error) {
      console.error('Error checking wishlist:', error)
    }
  }

  const handleToggleWishlist = async () => {
    if (!session) {
      toast({
        variant: 'default',
        title: 'Sign in required',
        description: 'Please sign in to add items to your wishlist',
      })
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/products/${params.id}`)}`)
      return
    }

    if (session.user.role !== 'CLIENT') {
      toast({
        variant: 'destructive',
        title: 'Access Restricted',
        description: 'Only customers can use wishlist',
      })
      return
    }

    setWishlistLoading(true)
    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`${B}/wishlist?productId=${params.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setIsInWishlist(false)
          toast({
            variant: 'success',
            title: 'Removed from Wishlist',
            description: 'Product removed from your wishlist',
          })
        } else {
          throw new Error('Failed to remove from wishlist')
        }
      } else {
        // Add to wishlist
        const response = await fetch(`${B}/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: params.id }),
        })
        if (response.ok) {
          setIsInWishlist(true)
          toast({
            variant: 'success',
            title: 'Added to Wishlist',
            description: 'Product added to your wishlist',
          })
        } else {
          throw new Error('Failed to add to wishlist')
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update wishlist. Please try again.',
      })
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (status === 'loading') {
      return // Still loading session
    }

    // If not logged in, add to guest cart (localStorage)
    if (!session) {
      addToGuestCart(product?.id || '', quantity)
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
      setAddingToCart(true)
      const response = await fetch(`${B}/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product?.id,
          quantity,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          variant: 'success',
          title: 'Success!',
          description: 'Product added to cart successfully!',
        })
        refreshCart()
      } else {
        const error = await response.json()
        if (response.status === 401) {
          toast({
            variant: 'destructive',
            title: 'Authentication Required',
            description: 'Please sign in to add items to cart',
          })
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/products/${params.id}`)}`)
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
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Product not found</p>
        <Link href="/products">
          <Button className="mt-4">Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[selectedImage] || product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Sparkles className="h-24 w-24" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {product.images.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square relative bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-amber-500 scale-105' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{product.name}</h1>
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6">
                ${product.finalPrice.toFixed(2)}
              </p>
            </div>
            {session?.user?.role === 'CLIENT' && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`${isInWishlist ? 'text-red-500 border-red-500' : 'text-gray-500'}`}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">Category</span>
                  <p className="font-semibold text-gray-900 mt-1">{product.category}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Karat</span>
                  <p className="font-semibold text-gray-900 mt-1">{product.karat}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Weight</span>
                  <p className="font-semibold text-gray-900 mt-1">{product.weight}g</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Making Charges</span>
                  <p className="font-semibold text-gray-900 mt-1">{product.makingCharges}%</p>
                </div>
                {product.basePricePerGram && (
                  <div>
                    <span className="text-gray-500 font-medium">Base Price/Gram</span>
                    <p className="font-semibold text-gray-900 mt-1">${product.basePricePerGram.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 font-medium">SKU</span>
                  <p className="font-semibold text-gray-900 mt-1">{product.sku}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <span className="text-gray-500 font-medium">Shop</span>
                <p className="font-semibold text-gray-900 mt-1">{product.shop.name}</p>
              </div>
              <div className="pt-4 border-t">
                <span className="text-gray-500 font-medium">Stock</span>
                <p className={`font-semibold mt-1 ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stockQuantity > 0 ? `${product.stockQuantity} available` : 'Out of Stock'}
                </p>
              </div>
            </CardContent>
          </Card>

          {product.description && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-3">Description</h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {product.stockQuantity > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-700">Quantity:</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setQuantity(Math.max(1, Math.min(val, product.stockQuantity)))
                    }}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full"
                size="lg"
              >
                {addingToCart ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600 font-semibold text-center">Out of Stock</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
