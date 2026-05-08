'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Star, 
  Sparkles, 
  CheckCircle2,
  Clock,
  Users,
  Award,
  ShoppingBag,
  Gem,
  Zap,
  Heart
} from 'lucide-react'

interface Product {
  id: string
  name: string
  finalPrice: number
  images: string[]
  shop: {
    name: string
  }
}

interface GoldRate {
  karat: string
  rate: number
}

export default function Home() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [goldRates, setGoldRates] = useState<GoldRate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    // Refresh gold rates every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'
      const [productsRes, ratesRes] = await Promise.all([
        fetch(`${API}/products?limit=8`),
        fetch(`${API}/gold-rates`),
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        const list = productsData?.data?.products || productsData?.products || []
        setFeaturedProducts(list)
      }

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json()
        const raw = ratesData?.data || ratesData
        setGoldRates(Object.values(raw).filter(Boolean) as GoldRate[])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Enhanced */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-300/10 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8 animate-fade-in hover:bg-white/20 transition-all">
              <Sparkles className="h-5 w-5 text-amber-300 animate-spin-slow" />
              <span className="text-sm font-semibold text-white">{t('trustedPlatform')}</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black mb-6 text-white leading-tight animate-slide-up">
              <span className="block mb-2">Authentic</span>
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent animate-gradient">
                Gold Excellence
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl lg:text-3xl text-amber-100 mb-12 max-w-3xl leading-relaxed font-light animate-slide-up">
              {t('subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-scale-in">
              <Link href="/products">
                <Button size="lg" className="group bg-white text-amber-900 hover:bg-amber-50 shadow-2xl hover:shadow-amber-500/50 h-16 px-8 text-lg font-bold">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {t('browseProducts')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/shops">
                <Button size="lg" variant="outline" className="border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 h-16 px-8 text-lg font-bold">
                  {t('exploreShops')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 animate-fade-in">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">5+</div>
                <div className="text-sm text-amber-200">Verified Shops</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">28+</div>
                <div className="text-sm text-amber-200">Premium Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">24K</div>
                <div className="text-sm text-amber-200">Pure Gold</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">100%</div>
                <div className="text-sm text-amber-200">Authentic</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Live Gold Rates - Enhanced */}
      {goldRates.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-white via-amber-50/50 to-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent)]"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full mb-6">
                <Zap className="h-4 w-4 text-amber-600 animate-pulse" />
                <span className="text-sm font-semibold text-amber-700">Live Rates</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                {t('liveGoldRates')}
              </h2>
              <p className="text-gray-600 text-lg">{t('perGram')}</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Updated every 30 seconds</span>
              </div>
            </div>

            <div className="max-w-xl mx-auto mb-12">
              {(() => {
                const k24Rate = goldRates.find((rate) => rate.karat === 'K24')
                const pricePerOunce = k24Rate ? k24Rate.rate * 31.1034768 : null

                if (!pricePerOunce) {
                  return null
                }

                return (
                  <Card className="text-center border-2 border-amber-200 hover:border-amber-400 bg-gradient-to-br from-white to-amber-50/50 hover-lift hover-glow transition-all duration-300 animate-fade-in shadow-lg hover:shadow-xl">
                    <CardContent className="p-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Gem className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">
                        {t('goldOunceTitle')}
                      </div>
                      <div className="text-5xl font-black bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent mb-4">
                        ${pricePerOunce.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">{t('goldOunceSubtitle')}</div>
                    </CardContent>
                  </Card>
                )
              })()}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              {goldRates.map((rate, index) => (
                <Card 
                  key={rate.karat} 
                  className="text-center border-2 border-amber-200 hover:border-amber-400 bg-gradient-to-br from-white to-amber-50/50 hover-lift hover-glow transition-all duration-300 animate-fade-in shadow-lg hover:shadow-xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Gem className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                      {rate.karat}
                    </div>
                    <div className="text-3xl font-black bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
                      ${rate.rate.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{t('perGram')}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Enhanced */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Levant Co.?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the finest in gold trading with unmatched quality and service
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: Shield,
                title: t('verifiedShops'),
                description: t('verifiedShopsDesc'),
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: TrendingUp,
                title: t('livePricing'),
                description: t('livePricingDesc'),
                color: 'from-green-500 to-green-600',
              },
              {
                icon: Star,
                title: t('premiumQuality'),
                description: t('premiumQualityDesc'),
                color: 'from-amber-500 to-yellow-600',
              },
              {
                icon: Award,
                title: 'Certified Authenticity',
                description: 'All products come with certification and guarantee',
                color: 'from-purple-500 to-purple-600',
              },
            ].map((feature, index) => (
              <Card 
                key={index}
                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift group bg-gradient-to-br from-white to-gray-50"
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section - Enhanced */}
      <section className="py-24 bg-gradient-to-b from-white via-amber-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">Featured Collection</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t('featuredProducts')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('handpickedSelection')}
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">{tCommon('loading')}</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No products available yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
                {featuredProducts.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover-lift bg-white animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-125 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Sparkles className="h-20 w-20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                            <Heart className="h-5 w-5 text-amber-600" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                            <span className="text-xs font-bold text-amber-600">View Details</span>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2 flex-1">
                            {product.name}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-2xl font-black bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                              ${product.finalPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-semibold text-gray-600">4.9</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-500 font-medium">{product.shop.name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              
              <div className="text-center">
                <Link href="/products">
                  <Button variant="outline" size="lg" className="group h-14 px-8 text-lg font-bold border-2 border-amber-500 text-amber-600 hover:bg-amber-50">
                    {t('viewAllProducts')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-amber-300" />
              </div>
              <div className="text-4xl font-black mb-2">10K+</div>
              <div className="text-amber-200">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-amber-300" />
              </div>
              <div className="text-4xl font-black mb-2">100%</div>
              <div className="text-amber-200">Authentic Guarantee</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-amber-300" />
              </div>
              <div className="text-4xl font-black mb-2">24/7</div>
              <div className="text-amber-200">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Ready to Start Your Gold Journey?
            </h2>
            <p className="text-xl text-amber-100 mb-10 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust Levant Co. for authentic gold products
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-white text-amber-900 hover:bg-amber-50 h-14 px-8 text-lg font-bold shadow-2xl">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Shop Now
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-amber-900 h-14 px-8 text-lg font-bold backdrop-blur-sm transition-colors">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
