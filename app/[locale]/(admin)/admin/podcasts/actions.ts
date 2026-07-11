'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { podcastFormSchema, type PodcastFormInput } from '@/lib/validations';

export async function upsertPodcastAction(
  input: PodcastFormInput & { id?: string },
  locale: string
): Promise<{ ok: boolean }> {
  const parsed = podcastFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false };

  const payload = {
    title: parsed.data.title,
    description: parsed.data.description || null,
    media_url: parsed.data.mediaUrl,
    media_type: parsed.data.mediaType,
    thumbnail_url: parsed.data.thumbnailUrl || null,
    is_published: parsed.data.isPublished,
  };

  const { error } = input.id
    ? await supabase.from('podcasts').update(payload).eq('id', input.id)
    : await supabase.from('podcasts').insert({ ...payload, created_by: userRes.user.id });

  if (error) return { ok: false };

  revalidatePath(`/${locale}/admin/podcasts`);
  revalidatePath(`/${locale}/dashboard/podcasts`);
  return { ok: true };
}

export async function deletePodcastAction(id: string, locale: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const { error } = await supabase.from('podcasts').delete().eq('id', id);
  if (error) return { ok: false };

  revalidatePath(`/${locale}/admin/podcasts`);
  revalidatePath(`/${locale}/dashboard/podcasts`);
  return { ok: true };
}
