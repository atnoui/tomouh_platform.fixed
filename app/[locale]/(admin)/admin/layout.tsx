import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Topbar } from '@/components/layout/Topbar';

export default async function AdminLayout({
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
  if (profile.role !== 'admin' && profile.role !== 'super_admin') redirect(`/${locale}/dashboard`);

  return (
    <div className="flex">
      <AdminSidebar locale={locale} dict={dict} />
      <div className="min-h-screen flex-1 bg-surface-50">
        <Topbar locale={locale} title={dict.adminNav.overview} fullName={profile.full_name} roleLabel={dict.admin.roleAdmin} />
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
