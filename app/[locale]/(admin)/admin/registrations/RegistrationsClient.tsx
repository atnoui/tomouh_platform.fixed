'use client';

import { useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { formatPhoneDisplay, formatDate, initials } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { AdminUserRow } from './page';

export function RegistrationsClient({
  locale,
  dict,
  users,
}: {
  locale: Locale;
  dict: Dictionary;
  users: AdminUserRow[];
}) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (role && u.role !== role) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, search, role]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.admin.registrationsTitle}</h2>
        <p className="text-sm text-ink-400">{dict.admin.registrationsSubtitle}</p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input placeholder={dict.common.search} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-11" />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-56">
          <option value="">{dict.common.all}</option>
          <option value="student">{dict.admin.roleStudent}</option>
          <option value="admin">{dict.admin.roleAdmin}</option>
        </Select>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-soft text-start text-xs uppercase tracking-wide text-ink-300">
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnName}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnEmail}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnPhone}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnParentPhone}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnRole}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnWilaya}</th>
              <th className="px-5 py-3 text-center font-semibold">{dict.admin.columnIndigent}</th>
              <th className="px-5 py-3 text-center font-semibold">{dict.admin.columnVerified}</th>
              <th className="px-5 py-3 text-start font-semibold">{dict.admin.columnJoined}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border-soft last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                      {initials(u.full_name)}
                    </div>
                    <span className="font-medium text-ink-900">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-600">{u.email}</td>
                <td className="px-5 py-3 text-ink-600">{formatPhoneDisplay(u.phone)}</td>
                <td className="px-5 py-3 text-ink-600">{formatPhoneDisplay(u.parent_phone)}</td>
                <td className="px-5 py-3">
                  <span className="rounded-pill bg-surface-50 px-2.5 py-1 text-xs font-semibold text-ink-600">
                    {u.role === 'student' ? dict.admin.roleStudent : dict.admin.roleAdmin}
                  </span>
                </td>
                <td className="px-5 py-3 text-ink-600">{u.wilaya ?? '—'}</td>
                <td className="px-5 py-3 text-center">
                  {u.is_indigent ? (
                    <CheckCircle2 className="mx-auto h-4 w-4 text-status-approved" />
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {u.email_confirmed && u.phone_confirmed ? (
                    <CheckCircle2 className="mx-auto h-4 w-4 text-status-approved" />
                  ) : (
                    <XCircle className="mx-auto h-4 w-4 text-status-pending" />
                  )}
                </td>
                <td className="px-5 py-3 text-ink-600">{formatDate(u.created_at, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-ink-400">{dict.catalogue.noResults}</p>}
      </Card>
    </div>
  );
}
