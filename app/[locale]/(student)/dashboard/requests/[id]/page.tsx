import { notFound } from 'next/navigation';
import { FileText, Search, ShieldCheck, CheckCircle2, PackageCheck, HandHeart, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDictionary, t } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusTimeline, type TimelineStep } from '@/components/ui/Stepper';
import { STATUS_ORDER, STATUS_COLOR } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { BookRequest, RequestStatusHistoryEntry } from '@/lib/types';

const ICONS = {
  pending: FileText,
  under_review: Search,
  verified: ShieldCheck,
  approved: CheckCircle2,
  shipped: PackageCheck,
  disbursed: HandHeart,
} as const;

const STEP_TITLE_KEY = {
  pending: 'stepPending',
  under_review: 'stepUnderReview',
  verified: 'stepVerified',
  approved: 'stepApproved',
  rejected: 'stepRejected',
  shipped: 'stepShipped',
  disbursed: 'stepDisbursed',
} as const;

const STEP_DESC_KEY = {
  pending: 'stepPendingDesc',
  under_review: 'stepUnderReviewDesc',
  verified: 'stepVerifiedDesc',
  approved: 'stepApprovedDesc',
  rejected: 'stepRejectedDesc',
  shipped: 'stepShippedDesc',
  disbursed: 'stepDisbursedDesc',
} as const;

export default async function RequestDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: request } = await supabase.from('book_requests').select('*').eq('id', params.id).single();
  if (!request) notFound();
  const r = request as BookRequest;

  const { data: history } = await supabase
    .from('request_status_history')
    .select('*')
    .eq('request_id', r.id)
    .order('created_at', { ascending: false });

  let steps: TimelineStep[];
  if (r.status === 'rejected') {
    steps = [
      {
        key: 'pending',
        title: dict.requestStatus.stepPending,
        description: dict.requestStatus.stepPendingDesc,
        state: 'done',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        key: 'rejected',
        title: dict.requestStatus.stepRejected,
        description: r.rejection_reason
          ? t(dict.requestStatus.rejectionReason, { reason: r.rejection_reason })
          : dict.requestStatus.stepRejectedDesc,
        state: 'rejected',
        icon: <XCircle className="h-5 w-5" />,
      },
    ];
  } else {
    const currentIndex = STATUS_ORDER.indexOf(r.status);
    steps = STATUS_ORDER.map((status, i) => {
      const Icon = ICONS[status as keyof typeof ICONS];
      return {
        key: status,
        title: dict.requestStatus[STEP_TITLE_KEY[status as keyof typeof STEP_TITLE_KEY]],
        description: dict.requestStatus[STEP_DESC_KEY[status as keyof typeof STEP_DESC_KEY]],
        state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming',
        icon: <Icon className="h-5 w-5" />,
      };
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">{dict.requestStatus.requestNumber}</p>
            <p className="font-heading text-lg font-semibold text-ink-900">{r.request_number}</p>
          </div>
          <StatusBadge label={dict.status[r.status]} textClass={STATUS_COLOR[r.status].text} bgClass={STATUS_COLOR[r.status].bg} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border-soft pt-4 text-sm">
          <div>
            <p className="text-ink-300">{dict.requestStatus.type}</p>
            <p className="font-medium text-ink-900">
              {r.request_type === 'book' ? dict.requestStatus.typeBook : dict.requestStatus.typeBundle}
            </p>
          </div>
          <div>
            <p className="text-ink-300">{dict.admin.columnDate}</p>
            <p className="font-medium text-ink-900">{formatDate(r.created_at, locale)}</p>
          </div>
        </div>
        {r.expires_at && (
          <p className="mt-3 rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-600">
            {t(dict.requestStatus.loanDue, { date: formatDate(r.expires_at, locale) })}
          </p>
        )}
      </Card>

      <Card>
        <h3 className="mb-5 font-heading text-base font-semibold text-ink-900">{dict.requestStatus.title}</h3>
        <StatusTimeline steps={steps} />
        <p className="mt-2 rounded-xl bg-surface-50 px-4 py-3 text-xs text-ink-400">{dict.requestStatus.etaNote}</p>
      </Card>

      {history && history.length > 0 && (
        <Card>
          <h3 className="mb-3 font-heading text-base font-semibold text-ink-900">{dict.admin.statusHistory}</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {(history as RequestStatusHistoryEntry[]).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between border-b border-border-soft pb-2 last:border-0">
                <span className="text-ink-600">{dict.status[entry.new_status]}</span>
                <span className="text-xs text-ink-300">{formatDateTime(entry.created_at, locale)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
