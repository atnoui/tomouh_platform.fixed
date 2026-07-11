'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { RequestStatus } from '@/lib/types';

export async function updateRequestStatusAction(input: {
  requestId: string;
  newStatus: RequestStatus;
  studentId: string | null;
  adminNotes?: string;
  rejectionReason?: string;
  confirmIndigent?: boolean;
  locale: string;
}): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false };

  const updates: Record<string, unknown> = {
    status: input.newStatus,
    reviewed_by: userRes.user.id,
    reviewed_at: new Date().toISOString(),
  };
  if (input.adminNotes !== undefined) updates.admin_notes = input.adminNotes || null;
  if (input.newStatus === 'rejected') updates.rejection_reason = input.rejectionReason || null;
  if (input.newStatus === 'shipped') updates.shipped_at = new Date().toISOString();

  const { error } = await supabase.from('book_requests').update(updates).eq('id', input.requestId);
  if (error) return { ok: false };

  if (input.confirmIndigent && input.studentId) {
    await supabase.from('profiles').update({ is_indigent: true }).eq('id', input.studentId);
  }

  revalidatePath(`/${input.locale}/admin/requests/${input.requestId}`);
  revalidatePath(`/${input.locale}/admin/requests`);
  revalidatePath(`/${input.locale}/admin`);
  return { ok: true };
}
