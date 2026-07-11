import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import type { BookRequest } from '@/lib/types';
import { RequestsClient } from './RequestsClient';

export default async function AdminRequestsPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: requests } = await supabase.from('book_requests').select('*').order('created_at', { ascending: false });

  return <RequestsClient locale={locale} dict={dict} requests={(requests as BookRequest[]) ?? []} />;
}
