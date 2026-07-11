'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ClipboardCheck, Library, Headphones, LogOut } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

export function AdminSidebar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${locale}/admin`;

  const items = [
    { href: base, label: dict.adminNav.overview, icon: LayoutDashboard },
    { href: `${base}/registrations`, label: dict.adminNav.registrations, icon: Users },
    { href: `${base}/requests`, label: dict.adminNav.requests, icon: ClipboardCheck },
    { href: `${base}/inventory`, label: dict.adminNav.inventory, icon: Library },
    { href: `${base}/podcasts`, label: dict.adminNav.podcasts, icon: Headphones },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-e border-border-soft bg-primary-700 px-4 py-6">
      <Link href={base} className="mb-8 flex items-center justify-center gap-2">
        <Logo variant="compact" light />
        <span className="rounded-pill bg-secondary-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Admin
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1.5">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== base && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-pill px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-white text-primary-700' : 'text-primary-100 hover:bg-primary-800'
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-primary-500/40 pt-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-pill px-4 py-2.5 text-start text-sm font-medium text-primary-100 transition-colors hover:bg-primary-800"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>{dict.adminNav.logout}</span>
        </button>
      </div>
    </aside>
  );
}
