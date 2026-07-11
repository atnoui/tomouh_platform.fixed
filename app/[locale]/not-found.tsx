import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export default function NotFound({ params }: { params?: { locale?: string } }) {
  const locale = isLocale(params?.locale ?? '') ? (params!.locale as 'fr' | 'ar') : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo variant="sidebar" />
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink-900">{dict.notFound.title}</h1>
        <p className="mt-2 text-sm text-ink-400">{dict.notFound.body}</p>
      </div>
      <Link href={`/${locale}`}>
        <Button>{dict.notFound.backHome}</Button>
      </Link>
    </main>
  );
}
