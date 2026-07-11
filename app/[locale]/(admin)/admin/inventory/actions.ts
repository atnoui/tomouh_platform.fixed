'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { bookFormSchema, type BookFormInput } from '@/lib/validations';

export async function upsertBookAction(
  input: BookFormInput & { id?: string },
  locale: string
): Promise<{ ok: boolean }> {
  const parsed = bookFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false };

  const payload = {
    title_ar: parsed.data.titleAr,
    title_fr: parsed.data.titleFr || null,
    subject: parsed.data.subject,
    school_level: parsed.data.schoolLevel,
    type: parsed.data.type,
    condition: parsed.data.condition,
    stock_quantity: parsed.data.stockQuantity,
    pickup_location: parsed.data.pickupLocation,
    wilaya_id: parsed.data.wilayaId ?? null,
    cover_image_url: parsed.data.coverImageUrl || null,
    is_available: parsed.data.isAvailable,
  };

  const { error } = input.id
    ? await supabase.from('books').update(payload).eq('id', input.id)
    : await supabase.from('books').insert({ ...payload, created_by: userRes.user.id });

  if (error) return { ok: false };

  revalidatePath(`/${locale}/admin/inventory`);
  revalidatePath(`/${locale}/dashboard/catalogue`);
  return { ok: true };
}

export async function deleteBookAction(id: string, locale: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) return { ok: false };

  revalidatePath(`/${locale}/admin/inventory`);
  revalidatePath(`/${locale}/dashboard/catalogue`);
  return { ok: true };
}
