import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { RequestForm, NoItemsAvailable } from '@/components/RequestForm';
import type { Book, Profile, Wilaya } from '@/lib/types';

export default async function BorrowBookPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: userRes } = await supabase.auth.getUser();
  const [{ data: profile }, { data: books }, { data: wilayas }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userRes.user!.id).single(),
    supabase.from('books').select('*').eq('type', 'book').order('title_fr'),
    supabase.from('wilayas').select('*').order('id'),
  ]);

  if (!books || books.length === 0) {
    return <NoItemsAvailable dict={dict} locale={locale} />;
  }

  return (
    <RequestForm
      locale={locale}
      dict={dict}
      type="book"
      profile={profile as Profile}
      books={books as Book[]}
      wilayas={(wilayas as Wilaya[]) ?? []}
    />
  );
}
