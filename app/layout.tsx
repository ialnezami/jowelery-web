export const dynamic = 'force-dynamic'

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster'
import { ChatBubble } from '@/components/chat/ChatBubble';
import { GoldPriceTicker } from '@/components/GoldPriceTicker';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'Levant Co. - Gold Selling Platform',
  description: 'Multi-shop gold selling platform',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' || locale === 'ordo' ? 'rtl' : 'ltr'}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
            <ChatBubble />
            <GoldPriceTicker />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
