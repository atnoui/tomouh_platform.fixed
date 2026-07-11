import { Headphones, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Card } from '@/components/ui/Card';
import type { Podcast } from '@/lib/types';

export default async function PodcastsPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const items = (podcasts as Podcast[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.podcasts.title}</h2>
        <p className="text-sm text-ink-400">{dict.podcasts.subtitle}</p>
      </div>

      {items.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-sm text-ink-400">{dict.podcasts.noPodcasts}</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((podcast) => (
            <Card key={podcast.id} className="flex flex-col gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-600">
                {podcast.media_type === 'audio' ? <Headphones className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-heading text-base font-semibold text-ink-900">{podcast.title}</p>
                {podcast.description && <p className="mt-1 line-clamp-3 text-sm text-ink-400">{podcast.description}</p>}
              </div>
              {podcast.media_type === 'audio' ? (
                <audio controls className="w-full" src={podcast.media_url} />
              ) : (
                <video controls className="w-full rounded-xl" src={podcast.media_url} poster={podcast.thumbnail_url ?? undefined} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
