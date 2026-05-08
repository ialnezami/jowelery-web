'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Shield, 
  TrendingUp, 
  Star, 
  Award,
  Users,
  Heart,
  Target,
  Gem,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

export default function AboutPage() {
  const t = useTranslations('about')
  const tCommon = useTranslations('common')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6">
              {t('title')}
            </h1>
            <p className="text-xl sm:text-2xl text-amber-100 leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full mb-6">
                <Heart className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">{t('ourStory')}</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                {t('storyTitle')}
              </h2>
            </div>
            
            <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-6">
              <p>{t('storyParagraph1')}</p>
              <p>{t('storyParagraph2')}</p>
              <p>{t('storyParagraph3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 bg-gradient-to-b from-white via-amber-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-amber-50">
              <CardContent className="p-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('mission')}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {t('missionDescription')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-amber-50">
              <CardContent className="p-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Gem className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('vision')}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {t('visionDescription')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t('coreValues')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('coreValuesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: Shield,
                title: t('valueAuthenticityTitle'),
                description: t('valueAuthenticityDesc'),
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Star,
                title: t('valueQualityTitle'),
                description: t('valueQualityDesc'),
                color: 'from-amber-500 to-yellow-600',
              },
              {
                icon: Users,
                title: t('valueTrustTitle'),
                description: t('valueTrustDesc'),
                color: 'from-green-500 to-green-600',
              },
              {
                icon: TrendingUp,
                title: t('valueTransparencyTitle'),
                description: t('valueTransparencyDesc'),
                color: 'from-purple-500 to-purple-600',
              },
            ].map((value, index) => (
              <Card 
                key={index}
                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift group bg-white"
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${value.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <value.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-black mb-2">10K+</div>
              <div className="text-amber-200">{t('happyCustomers')}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">5+</div>
              <div className="text-amber-200">{t('verifiedShops')}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">28+</div>
              <div className="text-amber-200">{t('premiumProducts')}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">100%</div>
              <div className="text-amber-200">{t('authentic')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-b from-white via-amber-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                {t('whyChooseUs')}
              </h2>
            </div>

            <div className="space-y-6">
              {[
                { title: t('reason1Title'), description: t('reason1Desc') },
                { title: t('reason2Title'), description: t('reason2Desc') },
                { title: t('reason3Title'), description: t('reason3Desc') },
                { title: t('reason4Title'), description: t('reason4Desc') },
              ].map((reason, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{reason.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{reason.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-50 to-white overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Image/Icon Side */}
                  <div className="bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-600 p-12 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/30">
                        <Users className="h-16 w-16 text-white" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                          {t('founderLabel')}
                        </div>
                        <div className="text-white text-3xl font-black">
                          Ibrahim Alnezami
                        </div>
                        <div className="text-white/90 text-lg font-medium">
                          {t('founderTitle')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="p-12 flex flex-col justify-center">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      {t('meetFounder')}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {t('founderDescription')}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-gray-700">{t('founderRole1')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-gray-700">{t('founderRole2')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-gray-700">{t('founderRole3')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              {t('ctaTitle')}
            </h2>
            <p className="text-xl text-amber-100 mb-10 max-w-2xl mx-auto">
              {t('ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-white text-amber-900 hover:bg-amber-50 h-14 px-8 text-lg font-bold shadow-2xl">
                  {t('browseProducts')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-amber-900 h-14 px-8 text-lg font-bold backdrop-blur-sm transition-colors">
                  {t('contactUs')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

