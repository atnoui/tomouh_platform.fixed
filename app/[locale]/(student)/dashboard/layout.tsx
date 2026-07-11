import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  if (!profile) redirect(`/${locale}/login`);
  if (profile.role === 'admin' || profile.role === 'super_admin') redirect(`/${locale}/admin`);

  return (
    <div className="flex">
      <Sidebar locale={locale} dict={dict} />
      <div className="min-h-screen flex-1 bg-surface-50">
        <Topbar
          locale={locale}
          title={dict.dashboard.welcomeBack.replace('{name}', profile.full_name?.split(' ')[0] ?? '').replace(' 👋', '')}
          fullName={profile.full_name}
          roleLabel={dict.admin.roleStudent}
        />
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
