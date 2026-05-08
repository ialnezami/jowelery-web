'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Store, MapPin, Phone, Mail, Sparkles, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Shop {
  id: string
  name: string
  logo: string | null
  banner: string | null
  description: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  commissionRate: number
  status: string
  _count: {
    products: number
    orders: number
  }
}

interface Product {
  id: string
  name: string
  images: string[]
  finalPrice: number
  karat: string
  weight: number
  category: string
}

export default function ShopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('shops')
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchShop()
      fetchProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchShop = async () => {
    try {
      const response = await fetch(`${B}/shops/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setShop(data)
      } else if (response.status === 404) {
        setShop(null)
      }
    } catch (error) {
      console.error('Error fetching shop:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${B}/products?shopId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 mb-4">Shop not found</p>
        <Link href="/shops">
          <Button>Back to Shops</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20">
      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/shops" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Shops
        </Link>
      </div>

      {/* Shop Header */}
      <section className="bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50 border-b border-amber-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {shop.logo && (
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
                <Image
                  src={shop.logo}
                  alt={shop.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
                {shop.name}
              </h1>
              {shop.description && (
                <p className="text-lg text-gray-700 mb-4 max-w-2xl">{shop.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {shop.city && shop.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span>{shop.city}, {shop.country}</span>
                  </div>
                )}
                {shop.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-500" />
                    <span>{shop.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">
          Products from {shop.name}
        </h2>

        {products.length === 0 ? (
          <Card className="text-center py-12 border-0 shadow-md">
            <CardContent>
              <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products available from this shop yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover-lift h-full">
                  <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
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
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {product.karat} • {product.weight}g • {product.category}
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                      ${product.finalPrice.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

