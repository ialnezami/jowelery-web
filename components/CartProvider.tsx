'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { getGuestCart, getGuestCartCount, clearGuestCart } from '@/lib/guest-cart'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

const getToken = () => typeof window !== 'undefined' ? (window as any).__JWT as string | undefined : undefined
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

interface CartContextType {
  cartCount: number
  refreshCart: () => Promise<void>
  mergeGuestCart: () => Promise<void>
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  refreshCart: async () => {},
  mergeGuestCart: async () => {},
})

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [cartCount, setCartCount] = useState(0)

  const refreshCart = async () => {
    if (!session) {
      // For guest users, get count from localStorage
      const guestCount = getGuestCartCount()
      setCartCount(guestCount)
      return
    }

    try {
      const response = await fetch(`${B}/cart`, {
        headers: authHeaders(),
      })
      if (response.ok) {
        const cartItems = await response.json()
        const items = cartItems?.data ?? cartItems
        const totalItems = Array.isArray(items)
          ? items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          : 0
        setCartCount(totalItems)
      } else {
        setCartCount(0)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
      setCartCount(0)
    }
  }

  const mergeGuestCart = async () => {
    if (!session || status !== 'authenticated') return

    const guestCart = getGuestCart()
    if (guestCart.length === 0) {
      refreshCart()
      return
    }

    try {
      const response = await fetch(`${B}/cart/merge`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          items: guestCart,
        }),
      })

      if (response.ok) {
        clearGuestCart()
        await refreshCart()
      }
    } catch (error) {
      console.error('Error merging guest cart:', error)
    }
  }

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      // User is logged in - merge guest cart if exists, then refresh
      mergeGuestCart()
    } else {
      // Guest user - get count from localStorage
      const guestCount = getGuestCartCount()
      setCartCount(guestCount)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  // Also listen for localStorage changes (for guest cart updates)
  useEffect(() => {
    if (!session) {
      const handleStorageChange = () => {
        const guestCount = getGuestCartCount()
        setCartCount(guestCount)
      }

      window.addEventListener('storage', handleStorageChange)
      // Also check periodically for same-tab updates
      const interval = setInterval(handleStorageChange, 500)

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        clearInterval(interval)
      }
    }
  }, [session])

  return (
    <CartContext.Provider value={{ cartCount, refreshCart, mergeGuestCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
