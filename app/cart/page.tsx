'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, ShoppingCart as ShoppingCartIcon, Plus, Minus, LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/components/CartProvider'
import { getGuestCart, updateGuestCartItem, removeFromGuestCart, clearGuestCart } from '@/lib/guest-cart'

interface CartItem {
  id?: string
  quantity: number
  product: {
    id: string
    name: string
    images: string[]
    finalPrice: number
    stockQuantity: number
    shop?: {
      id: string
      name: string
    }
    shopId?: string
  }
}

interface GuestCartItem {
  productId: string
  quantity: number
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { refreshCart, mergeGuestCart } = useCart()
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isGuestCart, setIsGuestCart] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      // Load guest cart from localStorage
      loadGuestCart()
    } else {
      // Load authenticated user cart
      fetchCart()
    }
  }, [session, status])

  const loadGuestCart = async () => {
    try {
      setLoading(true)
      setIsGuestCart(true)
      const guestCart = getGuestCart()
      
      if (guestCart.length === 0) {
        setCartItems([])
        setLoading(false)
        return
      }

      // Fetch product details for guest cart items
      const productIds = guestCart.map(item => item.productId)
      const productsResponse = await fetch(`${B}/products?ids=${productIds.join(',')}`)
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        const products = productsData.products || []
        
        const items: CartItem[] = guestCart.map(item => {
          const product = products.find((p: any) => p.id === item.productId)
          if (product) {
            return {
              quantity: item.quantity,
              product: {
                id: product.id,
                name: product.name,
                images: product.images || [],
                finalPrice: product.finalPrice,
                stockQuantity: product.stockQuantity,
                shopId: product.shopId,
              },
            }
          }
          return null
        }).filter(Boolean) as CartItem[]
        
        setCartItems(items)
      } else {
        setCartItems([])
      }
    } catch (error) {
      console.error('Error loading guest cart:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCart = async () => {
    try {
      setLoading(true)
      setIsGuestCart(false)
      const response = await fetch(`${B}/cart`)
      if (response.ok) {
        const data = await response.json()
        setCartItems(data)
      } else {
        console.error('Failed to fetch cart:', response.statusText)
        setCartItems([])
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }



  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    if (!session) {
      // Update guest cart
      updateGuestCartItem(productId, newQuantity)
      loadGuestCart()
      refreshCart()
      return
    }
    
    try {
      setUpdating(productId)
      const response = await fetch(`${B}/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity,
        }),
      })

      if (response.ok) {
        fetchCart()
        refreshCart()
      } else {
        const errorData = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorData.error || 'Failed to update quantity',
        })
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while updating quantity.',
      })
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (productId: string) => {
    if (!session) {
      // Remove from guest cart
      removeFromGuestCart(productId)
      loadGuestCart()
      refreshCart()
      toast({
        variant: 'success',
        title: 'Item Removed',
        description: 'Item has been removed from your cart.',
      })
      return
    }

    try {
      setUpdating(productId)
      const response = await fetch(`${B}/cart?productId=${productId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchCart()
        refreshCart()
        toast({
          variant: 'success',
          title: 'Item Removed',
          description: 'Item has been removed from your cart.',
        })
      } else {
        const errorData = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorData.error || 'Failed to remove item from cart',
        })
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while removing the item.',
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleCheckout = () => {
    if (!session) {
      // Redirect to login with cart merge
      router.push(`/auth/login?callbackUrl=${encodeURIComponent('/checkout')}`)
      return
    }
    router.push('/checkout')
  }

  const total = cartItems.reduce((sum, item) => {
    return sum + (item.product.finalPrice * item.quantity)
  }, 0)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-muted-foreground">{tCommon('loading')}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
        {t('title')}
      </h1>

      {cartItems.length === 0 ? (
        <Card className="text-center py-12 shadow-md border-0">
          <CardContent className="p-0">
            <ShoppingCartIcon className="h-20 w-20 text-amber-400 mx-auto mb-6" />
            <p className="text-lg text-gray-600 mb-6">{t('empty')}</p>
            <Link href="/products">
              <Button size="lg">{t('browseProducts')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {!session && (
            <Card className="mb-6 border-amber-200 bg-amber-50 border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogIn className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Sign in to checkout</p>
                      <p className="text-sm text-gray-600">Your cart will be saved when you sign in</p>
                    </div>
                  </div>
                  <Link href={`/auth/login?callbackUrl=${encodeURIComponent('/checkout')}`}>
                    <Button>Sign In</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <Card key={item.id || item.product.id || index} className="p-4 sm:p-6 shadow-sm border-0 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-24 h-24 relative bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs text-center">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <Link href={`/products/${item.product.id}`}>
                        <h3 className="font-semibold text-lg mb-2 hover:text-amber-600 transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{tCommon('quantity')}:</span>
                          <div className="flex items-center gap-2 border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updating === item.product.id}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stockQuantity || updating === item.product.id}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-xl font-bold text-amber-600">
                            ${(item.product.finalPrice * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.product.id)}
                            disabled={updating === item.product.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            aria-label={`Remove ${item.product.name} from cart`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-card sticky top-24 shadow-lg border-0">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl font-semibold">{t('orderSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{tCommon('subtotal')} ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>{tCommon('total')}</span>
                      <span className="text-amber-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                  >
                    {session ? t('proceedToCheckout') : 'Sign In to Checkout'}
                  </Button>
                  <Link href="/products" className="block">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
