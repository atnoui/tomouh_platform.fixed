import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary, t } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import type { BookRequest, Profile, RequestStatusHistoryEntry } from '@/lib/types';
import { RequestDetailClient } from './RequestDetailClient';

async function signedUrlFor(supabase: ReturnType<typeof createClient>, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from('aid-documents').createSignedUrl(path, 60 * 15);
  return data?.signedUrl ?? null;
}

export default async function AdminRequestDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();

  const { data: request } = await supabase.from('book_requests').select('*').eq('id', params.id).single();
  if (!request) notFound();
  const r = request as BookRequest;

  const [{ data: profile }, { data: history }, idCardUrl, familyCardUrl] = await Promise.all([
    r.user_id ? supabase.from('profiles').select('*').eq('id', r.user_id).single() : Promise.resolve({ data: null }),
    supabase.from('request_status_history').select('*').eq('request_id', r.id).order('created_at', { ascending: false }),
    signedUrlFor(supabase, r.national_id_card_url),
    signedUrlFor(supabase, r.family_civil_status_card_url),
  ]);

  return (
    <RequestDetailClient
      locale={locale}
      dict={dict}
      request={r}
      profile={profile as Profile | null}
      history={(history as RequestStatusHistoryEntry[]) ?? []}
      idCardUrl={idCardUrl}
      familyCardUrl={familyCardUrl}
      title={t(dict.admin.requestDetailTitle, { number: r.request_number })}
    />
  );
}
