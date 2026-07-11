import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import type { Book, Wilaya } from '@/lib/types';
import { InventoryClient } from './InventoryClient';

export default async function InventoryPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const [{ data: books }, { data: wilayas }] = await Promise.all([
    supabase.from('books').select('*, wilayas(*)').order('created_at', { ascending: false }),
    supabase.from('wilayas').select('*').order('id'),
  ]);

  return (
    <InventoryClient
      locale={locale}
      dict={dict}
      initialBooks={(books as Book[]) ?? []}
      wilayas={(wilayas as Wilaya[]) ?? []}
    />
  );
}
