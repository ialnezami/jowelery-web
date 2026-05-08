'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search,
  ShoppingCart,
  Package,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Phone,
  Mail,
  FileText
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

export default function HelpPage() {
  const t = useTranslations('help')
  const tCommon = useTranslations('common')
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    {
      icon: ShoppingCart,
      title: t('orderingTitle'),
      color: 'from-blue-500 to-blue-600',
      key: 'ordering'
    },
    {
      icon: Package,
      title: t('shippingTitle'),
      color: 'from-green-500 to-green-600',
      key: 'shipping'
    },
    {
      icon: CreditCard,
      title: t('paymentTitle'),
      color: 'from-amber-500 to-yellow-600',
      key: 'payment'
    },
    {
      icon: Shield,
      title: t('securityTitle'),
      color: 'from-purple-500 to-purple-600',
      key: 'security'
    },
  ]

  const faqs: FAQItem[] = [
    { question: t('faq1Question'), answer: t('faq1Answer') },
    { question: t('faq2Question'), answer: t('faq2Answer') },
    { question: t('faq3Question'), answer: t('faq3Answer') },
    { question: t('faq4Question'), answer: t('faq4Answer') },
    { question: t('faq5Question'), answer: t('faq5Answer') },
    { question: t('faq6Question'), answer: t('faq6Answer') },
    { question: t('faq7Question'), answer: t('faq7Answer') },
    { question: t('faq8Question'), answer: t('faq8Answer') },
  ]

  const filteredFaqs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs

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
              <HelpCircle className="h-5 w-5 text-amber-300" />
              <span className="text-sm font-semibold text-white">{t('supportCenter')}</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6">
              {t('title')}
            </h1>
            <p className="text-xl sm:text-2xl text-amber-100 leading-relaxed mb-8">
              {t('subtitle')}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full h-16 pl-14 pr-4 rounded-2xl border-0 shadow-2xl focus:ring-4 focus:ring-amber-300 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">{t('browseByCategory')}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Card 
                  key={index}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift cursor-pointer group bg-white"
                >
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${category.color} rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-b from-white via-amber-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('faqTitle')}</h2>
              <p className="text-xl text-gray-600">{t('faqSubtitle')}</p>
            </div>

            {filteredFaqs.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">{t('noResultsFound')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <Card 
                    key={index}
                    className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow"
                  >
                    <CardContent className="p-0">
                      <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-amber-50/50 transition-colors"
                      >
                        <span className="text-lg font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </span>
                        {openIndex === index ? (
                          <ChevronUp className="h-6 w-6 text-amber-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-6 w-6 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {openIndex === index && (
                        <div className="px-8 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-6">
                          {faq.answer}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('stillNeedHelp')}</h2>
              <p className="text-xl text-gray-600">{t('contactSupport')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('liveChat')}</h3>
                  <p className="text-gray-600 mb-4">{t('liveChatDesc')}</p>
                  <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    {t('startChat')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('phoneSupport')}</h3>
                  <p className="text-gray-600 mb-4">{t('phoneSupportDesc')}</p>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    {t('callNow')}
                  </Button>
                </CardContent>
              </Card>

              <Link href="/contact" className="block">
                <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow h-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('emailSupport')}</h3>
                    <p className="text-gray-600 mb-4">{t('emailSupportDesc')}</p>
                    <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700">
                      {t('sendEmail')}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-20 bg-gradient-to-b from-white via-amber-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">{t('additionalResources')}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/terms">
                <Button variant="outline" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-50 h-12 px-6">
                  <FileText className="mr-2 h-5 w-5" />
                  {t('viewTerms')}
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-50 h-12 px-6">
                  {t('aboutUs')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

