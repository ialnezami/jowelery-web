'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { getGuestCart, getGuestCartCount, clearGuestCart } from '@/lib/guest-cart'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

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

  const apiToken = (session as any)?.apiToken as string | undefined

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
  })

  const refreshCart = async () => {
    if (!session || !apiToken) {
      setCartCount(getGuestCartCount())
      return
    }
    try {
      const res = await fetch(`${B}/cart`, { headers: authHeaders() })
      if (res.ok) {
        const body = await res.json()
        const items = body?.data ?? body
        setCartCount(
          Array.isArray(items)
            ? items.reduce((sum: number, item: any) => sum + item.quantity, 0)
            : 0
        )
      } else {
        setCartCount(0)
      }
    } catch {
      setCartCount(0)
    }
  }

  const mergeGuestCart = async () => {
    if (!session || status !== 'authenticated' || !apiToken) return

    const guestCart = getGuestCart()

    if (guestCart.length === 0) {
      await refreshCart()
      return
    }

    try {
      const res = await fetch(`${B}/cart/merge`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ items: guestCart }),
      })
      if (res.ok) {
        clearGuestCart()
      } else {
        // Merge failed — still clear guest cart so stale count doesn't persist
        clearGuestCart()
      }
    } catch {
      clearGuestCart()
    }
    await refreshCart()
  }

  useEffect(() => {
    if (status === 'loading') return

    if (session && apiToken) {
      mergeGuestCart()
    } else if (!session) {
      setCartCount(getGuestCartCount())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, apiToken])

  // Listen for localStorage changes for guest cart (same-tab updates)
  useEffect(() => {
    if (session) return

    const handleStorageChange = () => setCartCount(getGuestCartCount())
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(handleStorageChange, 500)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
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
