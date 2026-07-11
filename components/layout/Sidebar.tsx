'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  LayoutGrid,
  BookMarked,
  PackageOpen,
  ClipboardList,
  Headphones,
  HeartHandshake,
  Settings,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

export function Sidebar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${locale}/dashboard`;

  const items = [
    { href: base, label: dict.nav.home, icon: Home },
    { href: `${base}/catalogue`, label: dict.nav.catalogue, icon: LayoutGrid },
    { href: `${base}/borrow-book`, label: dict.nav.borrowBook, icon: BookMarked },
    { href: `${base}/notebook-bundle`, label: dict.nav.notebookBundle, icon: PackageOpen },
    { href: `${base}/requests`, label: dict.nav.myRequests, icon: ClipboardList },
    { href: `${base}/podcasts`, label: dict.nav.podcasts, icon: Headphones },
    { href: `${base}/donate`, label: dict.nav.donate, icon: HeartHandshake },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-e border-border-soft bg-surface-0 px-4 py-6">
      <Link href={base} className="mb-8 flex justify-center">
        <Logo variant="sidebar" />
      </Link>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== base && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-pill px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-primary-100 text-primary-600' : 'text-ink-600 hover:bg-surface-50'
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-1.5 border-t border-border-soft pt-4">
        <Link
          href={`${base}/settings`}
          className={cn(
            'flex items-center gap-3 rounded-pill px-4 py-2.5 text-sm font-medium transition-colors',
            pathname === `${base}/settings` ? 'bg-primary-100 text-primary-600' : 'text-ink-600 hover:bg-surface-50'
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          <span>{dict.nav.settings}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-pill px-4 py-2.5 text-start text-sm font-medium text-status-rejected transition-colors hover:bg-status-rejected-bg"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>{dict.nav.logout}</span>
        </button>
      </div>
    </aside>
  );
}
