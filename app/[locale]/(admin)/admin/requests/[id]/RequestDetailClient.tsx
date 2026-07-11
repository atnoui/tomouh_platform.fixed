'use client';

import { useState, useTransition } from 'react';
import { FileText, ShieldCheck, HeartHandshake, ExternalLink } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { STATUS_COLOR, NEXT_STATUS_OPTIONS } from '@/lib/constants';
import { formatDate, formatDateTime, formatPhoneDisplay } from '@/lib/utils';
import { updateRequestStatusAction } from './actions';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { BookRequest, Profile, RequestStatus, RequestStatusHistoryEntry } from '@/lib/types';

const TARGET_LABEL_KEY: Record<RequestStatus, keyof Dictionary['admin']> = {
  pending: 'markUnderReview',
  under_review: 'markVerified',
  verified: 'markApproved',
  approved: 'markShipped',
  shipped: 'markDisbursed',
  disbursed: 'markDisbursed',
  rejected: 'markRejected',
};

export function RequestDetailClient({
  locale,
  dict,
  request,
  profile,
  history,
  idCardUrl,
  familyCardUrl,
  title,
}: {
  locale: Locale;
  dict: Dictionary;
  request: BookRequest;
  profile: Profile | null;
  history: RequestStatusHistoryEntry[];
  idCardUrl: string | null;
  familyCardUrl: string | null;
  title: string;
}) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? '');
  const [rejectionReason, setRejectionReason] = useState(request.rejection_reason ?? '');
  const [confirmIndigent, setConfirmIndigent] = useState(profile?.is_indigent ?? false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextOptions = NEXT_STATUS_OPTIONS[request.status];
  const isTerminal = nextOptions.length === 0;

  function applyTransition(target: RequestStatus) {
    setError(null);
    if (target === 'rejected' && !rejectionReason.trim()) {
      setShowRejectBox(true);
      setError(dict.common.required);
      return;
    }
    startTransition(async () => {
      const result = await updateRequestStatusAction({
        requestId: request.id,
        newStatus: target,
        studentId: request.user_id,
        adminNotes,
        rejectionReason: target === 'rejected' ? rejectionReason : undefined,
        confirmIndigent,
        locale,
      });
      showToast(result.ok ? dict.admin.statusUpdated : dict.common.error, result.ok ? 'success' : 'error');
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold text-ink-900">{title}</h2>
        <StatusBadge
          label={dict.status[request.status]}
          textClass={STATUS_COLOR[request.status].text}
          bgClass={STATUS_COLOR[request.status].bg}
        />
      </div>

      <Card>
        <CardTitle className="mb-4">{dict.admin.studentInfo}</CardTitle>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Info label={dict.admin.columnName} value={request.student_full_name} />
          <Info label={dict.admin.columnParentPhone} value={formatPhoneDisplay(request.parent_phone)} />
          <Info label={dict.requestForm.wilayaLabel} value={request.wilaya} />
          <Info label={dict.requestForm.communeLabel} value={request.commune ?? '—'} />
          <Info label={dict.admin.columnDate} value={formatDate(request.created_at, locale)} />
          <Info label={dict.requestStatus.type} value={request.request_type === 'book' ? dict.requestStatus.typeBook : dict.requestStatus.typeBundle} />
        </div>
        <div className="mt-4 border-t border-border-soft pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">{dict.requestForm.addressLabel}</p>
          <p className="mt-1 text-sm text-ink-700">{request.detailed_address}</p>
        </div>
        <div className="mt-4 border-t border-border-soft pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">{dict.requestForm.proofLabel}</p>
          <p className="mt-1 text-sm text-ink-700">{request.proof_of_need_description}</p>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">{dict.admin.documents}</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          {idCardUrl ? (
            <a
              href={idCardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface-50 px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              <FileText className="h-4 w-4" /> {dict.admin.viewIdCard} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <p className="flex-1 rounded-2xl bg-surface-50 px-4 py-3 text-center text-sm text-ink-300">—</p>
          )}
          {familyCardUrl ? (
            <a
              href={familyCardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface-50 px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              <FileText className="h-4 w-4" /> {dict.admin.viewFamilyCard} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <p className="flex-1 rounded-2xl bg-surface-50 px-4 py-3 text-center text-sm text-ink-300">{dict.admin.noFamilyCard}</p>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">{dict.admin.adminNotesLabel}</CardTitle>
        <Textarea
          placeholder={dict.admin.adminNotesPlaceholder}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
        />

        {request.request_type === 'notebook_bundle' && (
          <label className="mt-4 flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={confirmIndigent}
              onChange={(e) => setConfirmIndigent(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary-600 focus-visible:focus-ring"
            />
            <HeartHandshake className="h-4 w-4 text-secondary-600" />
            {dict.admin.confirmIndigent}
          </label>
        )}

        {(showRejectBox || request.status === 'rejected') && (
          <div className="mt-4">
            <Textarea
              label={dict.admin.rejectionReasonLabel}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={isTerminal}
            />
          </div>
        )}

        {error && <p className="mt-2 text-sm text-status-rejected">{error}</p>}

        {!isTerminal && (
          <div className="mt-5 flex flex-wrap gap-2.5 border-t border-border-soft pt-5">
            {nextOptions.map((target) => (
              <Button
                key={target}
                size="sm"
                variant={target === 'rejected' ? 'danger' : 'primary'}
                loading={pending}
                onClick={() => applyTransition(target)}
              >
                <ShieldCheck className="h-4 w-4" />
                {dict.admin[TARGET_LABEL_KEY[target]]}
              </Button>
            ))}
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <Card>
          <CardTitle className="mb-3">{dict.admin.statusHistory}</CardTitle>
          <ul className="flex flex-col gap-2 text-sm">
            {history.map((entry) => (
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">{label}</p>
      <p className="mt-0.5 font-medium text-ink-900">{value}</p>
    </div>
  );
}
