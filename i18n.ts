import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

// Can be imported from a shared config
export const locales = ['en', 'ar', 'fr', 'ordo'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  // Get locale from header (set by middleware) or cookie or use default
  const headersList = await headers();
  const headerLocale = headersList.get('x-next-intl-locale');
  
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  
  let locale = headerLocale || cookieLocale || 'en';
  
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
