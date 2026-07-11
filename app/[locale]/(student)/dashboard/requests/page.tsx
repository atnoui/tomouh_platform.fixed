import Link from 'next/link';
import { BookMarked, PackageOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { STATUS_COLOR } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { BookRequest } from '@/lib/types';

export default async function RequestsListPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: userRes } = await supabase.auth.getUser();
  const { data: requests } = await supabase
    .from('book_requests')
    .select('*')
    .eq('user_id', userRes.user!.id)
    .order('created_at', { ascending: false });

  const items = (requests as BookRequest[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.nav.myRequests}</h2>
      </div>

      {items.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-sm text-ink-400">{dict.requestStatus.noRequests}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <Link key={r.id} href={`/${locale}/dashboard/requests/${r.id}`}>
              <Card className="flex items-center justify-between gap-4 transition-shadow hover:shadow-none">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    {r.request_type === 'book' ? <BookMarked className="h-5 w-5" /> : <PackageOpen className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-heading text-sm font-semibold text-ink-900">
                      {r.book_title ?? r.bundle_name ?? r.request_number}
                    </p>
                    <p className="text-xs text-ink-400">
                      {r.request_number} · {formatDate(r.created_at, locale)}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  label={dict.status[r.status]}
                  textClass={STATUS_COLOR[r.status].text}
                  bgClass={STATUS_COLOR[r.status].bg}
                />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
