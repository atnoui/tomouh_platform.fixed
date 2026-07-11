'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getDictionary, t } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { signupSchema } from '@/lib/validations';
import { toAlgerianE164, isValidAlgerianPhone } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { WizardSteps } from '@/components/ui/Stepper';
import type { Wilaya } from '@/lib/types';

type Step = 0 | 1 | 2 | 3;

export default function SignupPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    parentPhone: '',
    wilaya: '',
  });

  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const phoneE164 = toAlgerianE164(form.phone);

  useEffect(() => {
    supabase
      .from('wilayas')
      .select('*')
      .order('id')
      .then(({ data }) => setWilayas(data ?? []));
  }, [supabase]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message === 'invalidPhone' ? dict.auth.errorGeneric : dict.auth.errorGeneric);
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: toAlgerianE164(form.phone),
          parent_phone: toAlgerianE164(form.parentPhone),
          wilaya: form.wilaya,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || dict.auth.errorGeneric);
      return;
    }

    setResendCooldown(45);
    setStep(1);
  }

  async function handleEmailVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError(dict.auth.errorInvalidCode);
      return;
    }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email,
      token: code,
      type: 'signup',
    });
    setLoading(false);

    if (verifyError) {
      setError(dict.auth.errorInvalidCode);
      return;
    }

    setCode('');
    setLoading(true);
    // Now that we have a session, attach + verify the phone number.
    const { error: updateError } = await supabase.auth.updateUser({ phone: phoneE164 });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || dict.auth.errorGeneric);
      return;
    }

    setResendCooldown(45);
    setStep(2);
  }

  async function handlePhoneVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError(dict.auth.errorInvalidCode);
      return;
    }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: phoneE164,
      token: code,
      type: 'phone_change',
    });
    setLoading(false);

    if (verifyError) {
      setError(dict.auth.errorInvalidCode);
      return;
    }

    setStep(3);
  }

  async function resendEmailCode() {
    setError(null);
    setLoading(true);
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: form.email });
    setLoading(false);
    if (resendError) {
      setError(resendError.message || dict.auth.errorGeneric);
      return;
    }
    setResendCooldown(45);
  }

  async function resendPhoneCode() {
    setError(null);
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ phone: phoneE164 });
    setLoading(false);
    if (updateError) {
      setError(updateError.message || dict.auth.errorGeneric);
      return;
    }
    setResendCooldown(45);
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-ink-900">{dict.auth.signupTitle}</h1>
      <p className="mt-1 text-sm text-ink-400">{dict.auth.signupSubtitle}</p>

      <div className="mt-6 mb-8">
        <WizardSteps
          steps={[dict.auth.stepAccount, dict.auth.stepEmailCode, dict.auth.stepPhoneCode, dict.auth.stepDone]}
          currentIndex={step}
        />
      </div>

      {step === 0 && (
        <form onSubmit={handleAccountSubmit} className="flex flex-col gap-4">
          <Input
            label={dict.auth.fullNameLabel}
            placeholder={dict.auth.fullNamePlaceholder}
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
            label={dict.auth.passwordLabel}
            type="password"
            hint={dict.auth.passwordHint}
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <Input
            label={dict.auth.phoneLabel}
            placeholder={dict.auth.phonePlaceholder}
            required
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            error={form.phone && !isValidAlgerianPhone(form.phone) ? ' ' : undefined}
          />
          <Input
            label={dict.auth.parentPhoneLabel}
            placeholder={dict.auth.parentPhonePlaceholder}
            required
            value={form.parentPhone}
            onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
            error={form.parentPhone && !isValidAlgerianPhone(form.parentPhone) ? ' ' : undefined}
          />
          <Select
            label={dict.auth.wilayaLabel}
            required
            value={form.wilaya}
            onChange={(e) => setForm((f) => ({ ...f, wilaya: e.target.value }))}
          >
            <option value="">{dict.auth.wilayaPlaceholder}</option>
            {wilayas.map((w) => (
              <option key={w.id} value={locale === 'ar' ? w.name_ar : w.name_fr}>
                {locale === 'ar' ? w.name_ar : w.name_fr}
              </option>
            ))}
          </Select>
          {error && <p className="text-sm text-status-rejected">{error}</p>}
          <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
            <UserPlus className="h-4 w-4" />
            {dict.auth.createAccountButton}
          </Button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={handleEmailVerify} className="flex flex-col gap-5">
          <div className="text-center">
            <h2 className="font-heading text-lg font-semibold text-ink-900">{dict.auth.emailCodeTitle}</h2>
            <p className="mt-1 text-sm text-ink-400">{t(dict.auth.emailCodeBody, { email: form.email })}</p>
          </div>
          <OtpInput value={code} onChange={setCode} error={error ?? undefined} />
          <Button type="submit" loading={loading} fullWidth size="lg">
            {dict.auth.verifyButton}
          </Button>
          <button
            type="button"
            onClick={resendEmailCode}
            disabled={resendCooldown > 0}
            className="text-center text-sm font-medium text-primary-600 hover:underline disabled:text-ink-300 disabled:no-underline"
          >
            {resendCooldown > 0 ? t(dict.auth.resendIn, { seconds: resendCooldown }) : dict.auth.resendCode}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handlePhoneVerify} className="flex flex-col gap-5">
          <div className="text-center">
            <h2 className="font-heading text-lg font-semibold text-ink-900">{dict.auth.phoneCodeTitle}</h2>
            <p className="mt-1 text-sm text-ink-400">{t(dict.auth.phoneCodeBody, { phone: phoneE164 })}</p>
          </div>
          <OtpInput value={code} onChange={setCode} error={error ?? undefined} />
          <Button type="submit" loading={loading} fullWidth size="lg">
            {dict.auth.verifyButton}
          </Button>
          <button
            type="button"
            onClick={resendPhoneCode}
            disabled={resendCooldown > 0}
            className="text-center text-sm font-medium text-primary-600 hover:underline disabled:text-ink-300 disabled:no-underline"
          >
            {resendCooldown > 0 ? t(dict.auth.resendIn, { seconds: resendCooldown }) : dict.auth.resendCode}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-approved-bg text-status-approved">
            <UserPlus className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-ink-900">{dict.common.success}</h2>
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              router.push(`/${locale}/dashboard`);
              router.refresh();
            }}
          >
            {dict.nav.home}
          </Button>
        </div>
      )}

      {step < 3 && (
        <p className="mt-6 text-center text-sm text-ink-400">
          {dict.auth.haveAccount}{' '}
          <Link href={`/${locale}/login`} className="font-semibold text-primary-600 hover:underline">
            {dict.auth.loginLink}
          </Link>
        </p>
      )}
    </div>
  );
}
