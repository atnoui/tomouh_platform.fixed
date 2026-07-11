import Link from 'next/link';
import type { ReactNode } from 'react';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;

  return (
    <main className="flex min-h-screen flex-col bg-surface-50">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href={`/${locale}`}>
          <Logo variant="compact" />
        </Link>
        <LanguageSwitcher current={locale} />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-card border border-border-soft bg-surface-0 p-8 shadow-card">
          {children}
        </div>
      </div>
    </main>
  );
}
