'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useCart } from './CartProvider'
import { CurrencySwitcher } from './CurrencySwitcher'

export function Header() {
  const { data: session } = useSession()
  const { cartCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const isShopAdmin = session?.user?.role === 'SHOP_ADMIN'
  const onDashboard = pathname?.startsWith('/dashboard')

  const [sellerMode, setSellerMode] = useState(false)
  useEffect(() => {
    setSellerMode(localStorage.getItem('jowelery:sellerMode') === 'true')
  }, [])

  const toggleSellerMode = useCallback(() => {
    const next = !sellerMode
    localStorage.setItem('jowelery:sellerMode', String(next))
    setSellerMode(next)
    router.push(next ? '/dashboard/seller' : '/dashboard')
  }, [sellerMode, router])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse group">
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image
                src="/logo-gold.jpg"
                alt="Levant Co."
                fill
                className="object-contain transition-transform group-hover:scale-110"
                sizes="40px"
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Levant Co.
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/shops"
              className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors relative group"
            >
              {t('shops')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/products"
              className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors relative group"
            >
              {t('products')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isShopAdmin && onDashboard && (
              <button
                onClick={toggleSellerMode}
                className="hidden sm:flex items-center gap-0 rounded-full border border-amber-300 bg-amber-50 text-xs font-semibold overflow-hidden"
                title="Switch mode"
              >
                <span className={`px-3 py-1.5 transition-colors ${!sellerMode ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-100'}`}>
                  Admin
                </span>
                <span className={`px-3 py-1.5 transition-colors ${sellerMode ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-100'}`}>
                  Seller
                </span>
              </button>
            )}
            <CurrencySwitcher />
            <LanguageSwitcher />

            {session ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2 text-gray-700 hover:text-amber-600 transition-colors hover:bg-amber-50 rounded-lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard"
                  className="p-2 text-gray-700 hover:text-amber-600 transition-colors hover:bg-amber-50 rounded-lg"
                >
                  <User className="h-5 w-5" />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden sm:flex"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="sm:hidden"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/auth/register" className="hidden sm:block">
                  <Button size="sm">
                    {t('register')}
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-amber-600 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-amber-100 bg-white animate-slide-up">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {isShopAdmin && onDashboard && (
              <button
                onClick={() => { toggleSellerMode(); setMobileMenuOpen(false) }}
                className="flex items-center gap-0 rounded-full border border-amber-300 bg-amber-50 text-xs font-semibold overflow-hidden mx-4 my-2 w-fit"
              >
                <span className={`px-3 py-1.5 transition-colors ${!sellerMode ? 'bg-amber-600 text-white' : 'text-amber-700'}`}>
                  Admin
                </span>
                <span className={`px-3 py-1.5 transition-colors ${sellerMode ? 'bg-amber-600 text-white' : 'text-amber-700'}`}>
                  Seller
                </span>
              </button>
            )}
            <Link
              href="/shops"
              className="block px-4 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('shops')}
            </Link>
            <Link
              href="/products"
              className="block px-4 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('products')}
            </Link>
            {!session && (
              <>
                <Link
                  href="/auth/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-4 py-2 text-amber-600 font-semibold hover:bg-amber-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
