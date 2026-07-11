'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { locales } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

const LABELS: Record<Locale, string> = { fr: 'FR', ar: 'AR' };

export function LanguageSwitcher({ current, className }: { current: Locale; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(locale: Locale) {
    const segments = pathname.split('/');
    segments[1] = locale;
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.push(segments.join('/') || `/${locale}`);
    router.refresh();
  }

  return (
    <div className={cn('flex items-center gap-1 rounded-pill border border-border bg-surface-0 p-1', className)}>
      <Languages className="ms-2 h-4 w-4 text-ink-400" />
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchTo(locale)}
          className={cn(
            'rounded-pill px-3 py-1 text-xs font-semibold transition-colors',
            current === locale ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-surface-50'
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
