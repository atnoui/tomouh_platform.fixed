import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { RegistrationsClient } from './RegistrationsClient';

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  parent_phone: string | null;
  role: 'student' | 'admin' | 'super_admin';
  wilaya: string | null;
  is_indigent: boolean;
  is_active: boolean;
  email_confirmed: boolean;
  phone_confirmed: boolean;
  created_at: string;
}

export default async function RegistrationsPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: users } = await supabase.rpc('admin_list_users');

  return <RegistrationsClient locale={locale} dict={dict} users={(users as AdminUserRow[]) ?? []} />;
}
