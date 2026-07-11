'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { isLocale, defaultLocale } from '@/lib/i18n/config';
import { useToast } from '@/components/ui/Toast';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import type { Profile, Wilaya } from '@/lib/types';

export default function SettingsPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);
  const supabase = createClient();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ next: '' });

  useEffect(() => {
    async function load() {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const [{ data: p }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userRes.user.id).single(),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setProfile(p as Profile);
      setWilayas((w as Wilaya[]) ?? []);
    }
    load();
  }, [supabase]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, parent_phone: profile.parent_phone, wilaya: profile.wilaya })
      .eq('id', profile.id);
    setSavingProfile(false);
    showToast(error ? dict.common.error : dict.settings.savedSuccess, error ? 'error' : 'success');
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.next.length < 8) return;
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    setSavingPassword(false);
    showToast(error ? dict.common.error : dict.settings.passwordUpdated, error ? 'error' : 'success');
    if (!error) setPasswords({ next: '' });
  }

  if (!profile) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.settings.title}</h2>

      <Card>
        <CardTitle className="mb-4">{dict.settings.profileSection}</CardTitle>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <Input
            label={dict.settings.fullName}
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          />
          <Input label={dict.settings.phone} value={profile.phone ?? ''} disabled />
          <Input
            label={dict.settings.parentPhone}
            value={profile.parent_phone ?? ''}
            onChange={(e) => setProfile({ ...profile, parent_phone: e.target.value })}
          />
          <Select
            label={dict.settings.wilaya}
            value={profile.wilaya ?? ''}
            onChange={(e) => setProfile({ ...profile, wilaya: e.target.value })}
          >
            <option value="">—</option>
            {wilayas.map((w) => (
              <option key={w.id} value={locale === 'ar' ? w.name_ar : w.name_fr}>
                {locale === 'ar' ? w.name_ar : w.name_fr}
              </option>
            ))}
          </Select>
          <Button type="submit" loading={savingProfile} className="self-start">
            {dict.settings.saveChanges}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-4">{dict.settings.accountSection}</CardTitle>
        <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
          <Input
            label={dict.settings.newPassword}
            type="password"
            minLength={8}
            value={passwords.next}
            onChange={(e) => setPasswords({ next: e.target.value })}
          />
          <Button type="submit" loading={savingPassword} className="self-start">
            {dict.settings.updatePassword}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-4">{dict.settings.languageSection}</CardTitle>
        <LanguageSwitcher current={locale} />
      </Card>
    </div>
  );
}
