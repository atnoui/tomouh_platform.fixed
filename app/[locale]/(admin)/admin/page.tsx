import Link from 'next/link';
import { ClipboardList, Users, HeartHandshake, Library } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { STATUS_COLOR } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { BookRequest } from '@/lib/types';

export default async function AdminOverviewPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const [pendingCount, studentsCount, indigentCount, stockSum, recentRequests] = await Promise.all([
    supabase.from('book_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_indigent', true),
    supabase.from('books').select('stock_quantity'),
    supabase.from('book_requests').select('*').order('created_at', { ascending: false }).limit(6),
  ]);

  const totalStock = (stockSum.data ?? []).reduce((sum, b) => sum + (b.stock_quantity ?? 0), 0);

  const stats = [
    { label: dict.admin.statPending, value: pendingCount.count ?? 0, icon: ClipboardList, color: 'text-status-pending', bg: 'bg-status-pending-bg' },
    { label: dict.admin.statStudents, value: studentsCount.count ?? 0, icon: Users, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: dict.admin.statIndigent, value: indigentCount.count ?? 0, icon: HeartHandshake, color: 'text-secondary-600', bg: 'bg-secondary-50' },
    { label: dict.admin.statBooksInStock, value: totalStock, icon: Library, color: 'text-status-approved', bg: 'bg-status-approved-bg' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.admin.overviewTitle}</h2>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-ink-900">{stat.value}</p>
                <p className="text-xs text-ink-400">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.admin.recentRequests}</CardTitle>
          <Link href={`/${locale}/admin/requests`} className="text-sm font-medium text-primary-600 hover:underline">
            {dict.common.viewAll}
          </Link>
        </CardHeader>
        <div className="flex flex-col divide-y divide-border-soft">
          {((recentRequests.data as BookRequest[]) ?? []).map((r) => (
            <Link
              key={r.id}
              href={`/${locale}/admin/requests/${r.id}`}
              className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 hover:opacity-80"
            >
              <div>
                <p className="text-sm font-semibold text-ink-900">{r.student_full_name}</p>
                <p className="text-xs text-ink-400">
                  {r.request_number} · {formatDate(r.created_at, locale)}
                </p>
              </div>
              <StatusBadge label={dict.status[r.status]} textClass={STATUS_COLOR[r.status].text} bgClass={STATUS_COLOR[r.status].bg} />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
