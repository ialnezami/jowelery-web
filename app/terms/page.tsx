'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Scale
} from 'lucide-react'

export default function TermsPage() {
  const t = useTranslations('terms')
  const tCommon = useTranslations('common')

  const sections = [
    {
      id: 'acceptance',
      icon: CheckCircle2,
      title: t('section1Title'),
      content: t('section1Content')
    },
    {
      id: 'user-accounts',
      icon: ShieldCheck,
      title: t('section2Title'),
      content: t('section2Content')
    },
    {
      id: 'products-pricing',
      icon: FileText,
      title: t('section3Title'),
      content: t('section3Content')
    },
    {
      id: 'orders-payments',
      icon: Scale,
      title: t('section4Title'),
      content: t('section4Content')
    },
    {
      id: 'shipping-delivery',
      icon: CheckCircle2,
      title: t('section5Title'),
      content: t('section5Content')
    },
    {
      id: 'returns-refunds',
      icon: AlertCircle,
      title: t('section6Title'),
      content: t('section6Content')
    },
    {
      id: 'intellectual-property',
      icon: ShieldCheck,
      title: t('section7Title'),
      content: t('section7Content')
    },
    {
      id: 'limitation-liability',
      icon: Scale,
      title: t('section8Title'),
      content: t('section8Content')
    },
    {
      id: 'privacy',
      icon: ShieldCheck,
      title: t('section9Title'),
      content: t('section9Content')
    },
    {
      id: 'changes',
      icon: FileText,
      title: t('section10Title'),
      content: t('section10Content')
    },
  ]

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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <FileText className="h-5 w-5 text-amber-300" />
              <span className="text-sm font-semibold text-white">{t('legalDocument')}</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6">
              {t('title')}
            </h1>
            <p className="text-xl sm:text-2xl text-amber-100 leading-relaxed">
              {t('subtitle')}
            </p>
            <p className="text-lg text-amber-200 mt-4">
              {t('lastUpdated')}
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-gradient-to-b from-white to-amber-50/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-amber-200 shadow-lg bg-amber-50">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('importantNotice')}</h2>
                    <p className="text-gray-700 leading-relaxed">
                      {t('introductionText')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Terms Sections */}
      <section className="py-12 bg-gradient-to-b from-amber-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <Card key={section.id} className="border-0 shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
                        <section.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-amber-600 mb-2">
                        {t('section')} {index + 1}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <div className="pl-16 text-gray-600 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-amber-50">
              <CardContent className="p-10 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('questionsTitle')}</h2>
                <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                  {t('questionsText')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button size="lg" className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 h-12 px-8">
                      {t('contactUs')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/help">
                    <Button size="lg" variant="outline" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-50 h-12 px-8">
                      {t('visitHelpCenter')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

