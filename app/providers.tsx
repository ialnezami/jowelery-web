'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/components/CartProvider'
import SessionSync from '@/components/SessionSync'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      <CartProvider>
        {children}
      </CartProvider>
    </SessionProvider>
  )
}

