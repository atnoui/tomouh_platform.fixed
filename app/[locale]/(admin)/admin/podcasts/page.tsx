import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import type { Podcast } from '@/lib/types';
import { PodcastsClient } from './PodcastsClient';

export default async function AdminPodcastsPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: podcasts } = await supabase.from('podcasts').select('*').order('created_at', { ascending: false });

  return <PodcastsClient locale={locale} dict={dict} initialPodcasts={(podcasts as Podcast[]) ?? []} />;
}
