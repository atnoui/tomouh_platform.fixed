import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import type { Book, Wilaya } from '@/lib/types';
import { CatalogueClient } from './CatalogueClient';

export default async function CataloguePage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const [{ data: books }, { data: wilayas }, { data: userRes }] = await Promise.all([
    supabase.from('books').select('*, wilayas(*)').order('created_at', { ascending: false }),
    supabase.from('wilayas').select('*').order('id'),
    supabase.auth.getUser(),
  ]);

  let myWilayaId: number | null = null;
  if (userRes.user) {
    const { data: profile } = await supabase.from('profiles').select('wilaya').eq('id', userRes.user.id).single();
    const match = (wilayas as Wilaya[] | null)?.find(
      (w) => w.name_fr === profile?.wilaya || w.name_ar === profile?.wilaya
    );
    myWilayaId = match?.id ?? null;
  }

  return (
    <CatalogueClient
      locale={locale}
      dict={dict}
      initialBooks={(books as Book[]) ?? []}
      wilayas={(wilayas as Wilaya[]) ?? []}
      myWilayaId={myWilayaId}
    />
  );
}
