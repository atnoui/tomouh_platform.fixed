import { HeartHandshake, Mail } from 'lucide-react';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Card } from '@/components/ui/Card';

export default function DonatePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-xl">
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
          <HeartHandshake className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.donate.title}</h2>
        <p className="text-sm leading-relaxed text-ink-400">{dict.donate.body}</p>
        <a
          href={`mailto:${dict.donate.contactEmail}`}
          className="inline-flex items-center gap-2 rounded-pill bg-secondary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-secondary-600"
        >
          <Mail className="h-4 w-4" />
          {dict.donate.contact}
        </a>
      </Card>
    </div>
  );
}
