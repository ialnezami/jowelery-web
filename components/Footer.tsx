'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('common')

  return (
    <footer className="border-t border-amber-100 bg-gradient-to-b from-white to-amber-50/30">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
              <div className="relative h-8 w-8 flex-shrink-0">
                <Image
                  src="/logo-gold.jpg"
                  alt="Levant Co."
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Levant Co.
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your trusted platform for buying authentic gold products from verified shops.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('shops')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/products" className="text-gray-600 hover:text-amber-600 transition-colors">
                  {t('products')}
                </Link>
              </li>
              <li>
                <Link href="/shops" className="text-gray-600 hover:text-amber-600 transition-colors">
                  {t('shops')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">About</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-amber-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-amber-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-amber-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-amber-600 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-amber-100 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Levant Co. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
