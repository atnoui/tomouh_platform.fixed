'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { adminSignupAction } from './actions';

export default function AdminRegisterPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', adminKey: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.set(key, value));

    startTransition(async () => {
      const result = await adminSignupAction(formData);
      if (!result.ok) {
        setError(
          result.code === 'invalid_key'
            ? dict.auth.errorAdminKey
            : result.code === 'email_exists'
              ? dict.auth.errorInvalidCredentials
              : dict.auth.errorGeneric
        );
        return;
      }

      setSigningIn(true);
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      setSigningIn(false);

      if (signInError) {
        setError(dict.auth.errorGeneric);
        return;
      }

      router.push(`/${locale}/admin`);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-secondary-600">
        <ShieldCheck className="h-5 w-5" />
        <span className="text-xs font-bold uppercase tracking-wide">Admin</span>
      </div>
      <h1 className="font-heading text-2xl font-semibold text-ink-900">{dict.auth.adminRegisterTitle}</h1>
      <p className="mt-1 text-sm text-ink-400">{dict.auth.adminRegisterSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          label={dict.auth.fullNameLabel}
          required
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
        />
        <Input
          label={dict.auth.emailLabel}
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          label={dict.auth.phoneLabel}
          placeholder={dict.auth.phonePlaceholder}
          required
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <Input
          label={dict.auth.passwordLabel}
          type="password"
          hint={dict.auth.passwordHint}
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <Input
          label={dict.auth.adminKeyLabel}
          placeholder={dict.auth.adminKeyPlaceholder}
          hint={dict.auth.adminKeyHint}
          type="password"
          required
          value={form.adminKey}
          onChange={(e) => setForm((f) => ({ ...f, adminKey: e.target.value }))}
        />
        {error && <p className="text-sm text-status-rejected">{error}</p>}
        <Button type="submit" loading={pending || signingIn} fullWidth size="lg" className="mt-2">
          <ShieldCheck className="h-4 w-4" />
          {dict.auth.adminRegisterButton}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        {dict.auth.haveAccount}{' '}
        <Link href={`/${locale}/login`} className="font-semibold text-primary-600 hover:underline">
          {dict.auth.loginLink}
        </Link>
      </p>
    </div>
  );
}
