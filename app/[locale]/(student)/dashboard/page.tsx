import Link from 'next/link';
import { BookMarked, PackageOpen, LayoutGrid, Clock, ArrowRight, Headphones } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDictionary, t } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { STATUS_COLOR } from '@/lib/constants';
import { daysBetween, formatDate } from '@/lib/utils';
import type { BookRequest, Podcast } from '@/lib/types';

export default async function DashboardHomePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user!.id;

  const [{ data: activeLoan }, { data: recentRequests }, { data: podcasts }] = await Promise.all([
    supabase
      .from('book_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('request_type', 'book')
      .eq('status', 'disbursed')
      .not('expires_at', 'is', null)
      .order('expires_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from('book_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('podcasts').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(3),
  ]);

  const loan = activeLoan as BookRequest | null;
  const daysLeft = loan?.expires_at ? daysBetween(new Date(), new Date(loan.expires_at)) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dict.dashboard.activeLoanTitle}</CardTitle>
            <Clock className="h-5 w-5 text-ink-300" />
          </CardHeader>
          {loan ? (
            <div className="flex items-center justify-between rounded-2xl bg-primary-50 p-5">
              <div>
                <p className="font-heading text-base font-semibold text-ink-900">{loan.book_title ?? '—'}</p>
                <p className="mt-1 text-sm text-ink-400">
                  {t(dict.requestStatus.loanDue, { date: formatDate(loan.expires_at, locale) })}
                </p>
              </div>
              <span className="rounded-pill bg-primary-600 px-4 py-1.5 text-sm font-semibold text-white">
                {daysLeft !== null && daysLeft >= 0
                  ? t(dict.dashboard.daysLeft, { count: daysLeft })
                  : t(dict.dashboard.overdue, { count: Math.abs(daysLeft ?? 0) })}
              </span>
            </div>
          ) : (
            <p className="text-sm text-ink-400">{dict.dashboard.noActiveLoan}</p>
          )}
        </Card>

        <Card>
          <CardTitle>{dict.dashboard.quickActions}</CardTitle>
          <div className="mt-4 flex flex-col gap-2.5">
            <Link href={`/${locale}/dashboard/catalogue`}>
              <Button variant="outline" fullWidth className="justify-start">
                <LayoutGrid className="h-4 w-4" /> {dict.dashboard.exploreCatalogue}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/borrow-book`}>
              <Button variant="outline" fullWidth className="justify-start">
                <BookMarked className="h-4 w-4" /> {dict.dashboard.requestBook}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/notebook-bundle`}>
              <Button variant="outline" fullWidth className="justify-start">
                <PackageOpen className="h-4 w-4" /> {dict.dashboard.requestBundle}
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.dashboard.myRequestsTitle}</CardTitle>
          <Link href={`/${locale}/dashboard/requests`} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
            {dict.common.viewAll} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </CardHeader>
        {!recentRequests || recentRequests.length === 0 ? (
          <p className="text-sm text-ink-400">{dict.requestStatus.noRequests}</p>
        ) : (
          <div className="flex flex-col divide-y divide-border-soft">
            {(recentRequests as BookRequest[]).map((r) => (
              <Link
                key={r.id}
                href={`/${locale}/dashboard/requests/${r.id}`}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{r.book_title ?? r.bundle_name ?? r.request_number}</p>
                  <p className="text-xs text-ink-400">{r.request_number}</p>
                </div>
                <StatusBadge
                  label={dict.status[r.status]}
                  textClass={STATUS_COLOR[r.status].text}
                  bgClass={STATUS_COLOR[r.status].bg}
                />
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.dashboard.recentPodcasts}</CardTitle>
          <Link href={`/${locale}/dashboard/podcasts`} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
            {dict.common.viewAll} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </CardHeader>
        {!podcasts || podcasts.length === 0 ? (
          <p className="text-sm text-ink-400">{dict.podcasts.noPodcasts}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {(podcasts as Podcast[]).map((p) => (
              <div key={p.id} className="rounded-2xl border border-border-soft p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-50 text-secondary-600">
                  <Headphones className="h-4 w-4" />
                </div>
                <p className="mt-3 line-clamp-1 font-heading text-sm font-semibold text-ink-900">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-400">{p.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
