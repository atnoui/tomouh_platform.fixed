'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
import { initials, formatDateTime } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';
import type { NotificationRow } from '@/lib/types';

export function Topbar({
  locale,
  title,
  subtitle,
  fullName,
  roleLabel,
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  fullName: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load(userId: string) {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (active && data) {
        setNotifications(data);
        setUnread(data.filter((n) => !n.is_read).length);
      }
    }

    async function init() {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user || !active) return;
      const userId = userRes.user.id;
      await load(userId);

      channel = supabase
        .channel(`notifications-watch-${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => load(userId)
        )
        .subscribe();
    }
    init();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function markAllRead() {
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userRes.user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border-soft bg-surface-0 px-8 py-5">
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-ink-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher current={locale} />

        <div className="relative">
          <button
            onClick={() => {
              setOpen((o) => !o);
              if (!open && unread > 0) markAllRead();
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-0 text-ink-600 hover:bg-surface-50"
            aria-label="notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary-600 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute end-0 top-12 z-30 w-80 rounded-2xl border border-border-soft bg-surface-0 p-2 shadow-card">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-ink-400">—</p>
              ) : (
                <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.link ?? '#'}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl px-3 py-2.5 text-sm hover:bg-surface-50"
                      >
                        <p className="font-medium text-ink-900">{n.title}</p>
                        {n.body && <p className="mt-0.5 text-xs text-ink-400">{n.body}</p>}
                        <p className="mt-1 text-[11px] text-ink-300">{formatDateTime(n.created_at, locale)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 rounded-pill border border-border bg-surface-0 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
            {initials(fullName)}
          </div>
          <div className="hidden text-start sm:block">
            <p className="text-xs font-semibold leading-tight text-ink-900">{fullName}</p>
            <p className="text-[11px] leading-tight text-ink-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
