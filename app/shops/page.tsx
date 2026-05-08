'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Store, Sparkles, MapPin, Phone, Mail, TrendingUp, Star, ArrowRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Shop {
  id: string
  name: string
  logo: string | null
  description: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  _count: {
    products: number
    orders: number
  }
}

export default function ShopsPage() {
  const t = useTranslations('shops')
  const tCommon = useTranslations('common')
  const [shops, setShops] = useState<Shop[]>([])
  const [filteredShops, setFilteredShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchShops()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredShops(shops)
    } else {
      const filtered = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredShops(filtered)
    }
  }, [searchQuery, shops])

  const fetchShops = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${B}/shops?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setShops(data)
        setFilteredShops(data)
      }
    } catch (error) {
      console.error('Error fetching shops:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50 py-12 sm:py-16 border-b border-amber-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-amber-200 mb-6">
              <Store className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">{t('verifiedShops')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              {t('subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('searchShops') || 'Search shops...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full bg-white border-2 border-amber-200 rounded-full focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shops Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 shadow-md animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-20 w-20 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <Card className="border-0 shadow-lg text-center py-16">
            <CardContent>
              <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="h-12 w-12 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('noShopsFound') || 'No Shops Found'}</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? t('tryDifferentSearch') || 'Try a different search term' : t('noShops')}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} variant="outline">
                  {tCommon('clearFilters') || 'Clear Search'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                {t('shopsFound', { count: filteredShops.length }) || `${filteredShops.length} shops found`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop, index) => (
                <Link key={shop.id} href={`/shops/${shop.id}`}>
                  <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift h-full group overflow-hidden bg-white">
                    <CardContent className="p-0">
                      {/* Shop Header with Logo */}
                      <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 p-6">
                        <div className="flex items-center gap-4 mb-4">
                          {shop.logo ? (
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                              <Image
                                src={shop.logo}
                                alt={shop.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Store className="h-10 w-10 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                              {shop.name}
                            </h3>
                            {shop.city && shop.country && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{shop.city}, {shop.country}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Rating Badge */}
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold text-gray-700">4.8</span>
                        </div>
                      </div>

                      {/* Shop Content */}
                      <div className="p-6">
                        {shop.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                            {shop.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{shop._count.products}</p>
                              <p className="text-xs text-gray-500">{t('products')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{shop._count.orders}</p>
                              <p className="text-xs text-gray-500">{t('orders')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        {(shop.phone || shop.email) && (
                          <div className="space-y-2 mb-4">
                            {shop.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4 text-amber-500" />
                                <span className="truncate">{shop.phone}</span>
                              </div>
                            )}
                            {shop.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4 text-amber-500" />
                                <span className="truncate">{shop.email}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* View Shop Button */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-sm font-semibold text-amber-600 group-hover:text-amber-700 transition-colors">
                            {t('viewShop') || 'View Shop'}
                          </span>
                          <ArrowRight className="h-5 w-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
