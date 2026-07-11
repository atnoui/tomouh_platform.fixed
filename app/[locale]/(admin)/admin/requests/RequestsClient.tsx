'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { STATUS_COLOR, STATUS_ORDER } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { BookRequest } from '@/lib/types';

export function RequestsClient({
  locale,
  dict,
  requests,
}: {
  locale: Locale;
  dict: Dictionary;
  requests: BookRequest[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (status && r.status !== status) return false;
      if (type && r.request_type !== type) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.student_full_name.toLowerCase().includes(q) && !r.request_number.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [requests, search, status, type]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.admin.requestsTitle}</h2>
        <p className="text-sm text-ink-400">{dict.admin.requestsSubtitle}</p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input placeholder={dict.common.search} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-11" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-52">
          <option value="">{dict.admin.filterAllStatuses}</option>
          {[...STATUS_ORDER, 'rejected'].map((s) => (
            <option key={s} value={s}>
              {dict.status[s as keyof typeof dict.status]}
            </option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-52">
          <option value="">{dict.admin.filterAllTypes}</option>
          <option value="book">{dict.requestStatus.typeBook}</option>
          <option value="notebook_bundle">{dict.requestStatus.typeBundle}</option>
        </Select>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-300">
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnRequestNumber}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnStudent}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnType}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnStatus}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnDate}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border-soft last:border-0 hover:bg-surface-50">
                <td className="px-5 py-3">
                  <Link href={`/${locale}/admin/requests/${r.id}`} className="font-medium text-primary-600 hover:underline">
                    {r.request_number}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-900">{r.student_full_name}</td>
                <td className="px-5 py-3 text-ink-600">
                  {r.request_type === 'book' ? dict.requestStatus.typeBook : dict.requestStatus.typeBundle}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge label={dict.status[r.status]} textClass={STATUS_COLOR[r.status].text} bgClass={STATUS_COLOR[r.status].bg} />
                </td>
                <td className="px-5 py-3 text-ink-600">{formatDate(r.created_at, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-ink-400">{dict.catalogue.noResults}</p>}
      </Card>
    </div>
  );
}
