'use server';

import { adminSignupSchema } from '@/lib/validations';
import { toAlgerianE164 } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';

export type AdminSignupResult =
  | { ok: true }
  | { ok: false; code: 'invalid_input' | 'invalid_key' | 'email_exists' | 'unknown' };

export async function adminSignupAction(formData: FormData): Promise<AdminSignupResult> {
  const raw = {
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    adminKey: String(formData.get('adminKey') ?? ''),
  };

  const parsed = adminSignupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: 'invalid_input' };
  }

  const expectedKey = process.env.ADMIN_SIGNUP_KEY;
  if (!expectedKey || parsed.data.adminKey !== expectedKey) {
    return { ok: false, code: 'invalid_key' };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      phone: toAlgerianE164(parsed.data.phone),
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
        role: 'admin',
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        return { ok: false, code: 'email_exists' };
      }
      return { ok: false, code: 'unknown' };
    }

    return { ok: true };
  } catch {
    return { ok: false, code: 'unknown' };
  }
}
