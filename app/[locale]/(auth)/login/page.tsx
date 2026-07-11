'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { loginSchema } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage({ params }: { params: { locale: string } }) {
  return (
    <Suspense fallback={null}>
      <LoginForm params={params} />
    </Suspense>
  );
}

function LoginForm({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(dict.auth.errorInvalidCredentials);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setLoading(false);
      setError(dict.auth.errorInvalidCredentials);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    const next = searchParams.get('next');

    setLoading(false);
    router.push(next || `/${locale}/${isAdmin ? 'admin' : 'dashboard'}`);
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-ink-900">{dict.auth.loginTitle}</h1>
      <p className="mt-1 text-sm text-ink-400">{dict.auth.loginSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          label={dict.auth.emailLabel}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label={dict.auth.passwordLabel}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-status-rejected">{error}</p>}
        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
          <LogIn className="h-4 w-4" />
          {dict.auth.loginButton}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <p className="text-ink-400">
          {dict.auth.noAccount}{' '}
          <Link href={`/${locale}/signup`} className="font-semibold text-primary-600 hover:underline">
            {dict.auth.signupLink}
          </Link>
        </p>
        <p className="text-ink-300">
          {dict.auth.accountAsAdmin}{' '}
          <Link href={`/${locale}/admin-register`} className="font-semibold text-ink-600 hover:underline">
            {dict.auth.registerAsAdmin}
          </Link>
        </p>
      </div>
    </div>
  );
}
