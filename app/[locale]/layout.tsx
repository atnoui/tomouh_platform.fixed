import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Poppins, Inter, Noto_Kufi_Arabic, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { locales, isLocale, dirFor, defaultLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { ToastProvider } from '@/components/ui/Toast';
import '../globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const notoKufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-kufi',
  display: 'swap',
});

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-arabic',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  return {
    title: `${dict.common.appName} — ${dict.landing.heroEyebrow}`,
    description: dict.landing.heroSubtitle,
  };
}

export default function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dir = dirFor(locale);

  return (
    <html lang={locale} dir={dir} className={`${poppins.variable} ${inter.variable} ${notoKufi.variable} ${ibmArabic.variable}`}>
      <body className="font-body">
        <ToastProvider>
          <SplashScreen>{children}</SplashScreen>
        </ToastProvider>
      </body>
    </html>
  );
}
