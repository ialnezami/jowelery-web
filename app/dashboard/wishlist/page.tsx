'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/components/CartProvider'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    images: string[]
    finalPrice: number
    stockQuantity: number
    shop: {
      id: string
      name: string
      logo: string | null
    }
  }
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { refreshCart } = useCart()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (session?.user?.role === 'CLIENT') {
      fetchWishlist()
    } else if (session) {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${B}/wishlist`)
      if (response.ok) {
        const data = await response.json()
        setWishlistItems(data)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (itemId: string, productId: string) => {
    setRemoving(itemId)
    try {
      const response = await fetch(`${B}/wishlist?productId=${productId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setWishlistItems(items => items.filter(item => item.id !== itemId))
        toast({
          variant: 'success',
          title: 'Removed',
          description: 'Item removed from wishlist',
        })
      } else {
        throw new Error('Failed to remove')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove item from wishlist',
      })
    } finally {
      setRemoving(null)
    }
  }

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId)
    try {
      const response = await fetch(`${B}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      if (response.ok) {
        await refreshCart()
        toast({
          variant: 'success',
          title: 'Added to Cart',
          description: 'Product added to your cart',
        })
      } else {
        throw new Error('Failed to add to cart')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add product to cart',
      })
    } finally {
      setAddingToCart(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          My Wishlist
        </h1>
      </div>

      {wishlistItems.length === 0 ? (
        <Card className="border-0 shadow-lg text-center py-12">
          <CardContent>
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Your wishlist is empty</p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <Link href={`/products/${item.product.id}`}>
                <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
                  {item.product.images && item.product.images.length > 0 ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <Heart className="h-16 w-16" />
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <Link href={`/products/${item.product.id}`}>
                  <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 hover:text-amber-600 transition-colors">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-3">
                  ${item.product.finalPrice.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-500">{item.product.shop.name}</span>
                  {item.product.stockQuantity === 0 && (
                    <span className="text-xs text-red-600 font-semibold">Out of Stock</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddToCart(item.product.id)}
                    disabled={addingToCart === item.product.id || item.product.stockQuantity === 0}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {addingToCart === item.product.id ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(item.id, item.product.id)}
                    disabled={removing === item.id}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}




