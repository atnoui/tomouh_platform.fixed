'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { t } from '@/lib/i18n/get-dictionary';
import { toAlgerianE164, isValidAlgerianPhone, randomSuffix } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Card } from '@/components/ui/Card';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Book, Profile, RequestType, Wilaya } from '@/lib/types';

export function RequestForm({
  locale,
  dict,
  type,
  profile,
  books,
  wilayas,
}: {
  locale: Locale;
  dict: Dictionary;
  type: RequestType;
  profile: Profile;
  books: Book[];
  wilayas: Wilaya[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const preselected = searchParams.get('book') ?? '';

  const [form, setForm] = useState({
    studentFullName: profile.full_name ?? '',
    parentPhone: profile.parent_phone ?? '',
    wilaya: profile.wilaya ?? '',
    commune: '',
    detailedAddress: '',
    proofOfNeedDescription: '',
    bookId: preselected,
  });
  const [idCard, setIdCard] = useState<File | null>(null);
  const [familyCard, setFamilyCard] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; number: string } | null>(null);

  const bookTitle = (b: Book) => (locale === 'ar' ? b.title_ar : b.title_fr || b.title_ar);
  const wilayaName = (w: Wilaya) => (locale === 'ar' ? w.name_ar : w.name_fr);

  const availableItems = useMemo(() => books.filter((b) => b.is_available && b.stock_quantity > 0), [books]);
  const selectedBook = availableItems.find((b) => b.id === form.bookId) ?? null;

  useEffect(() => {
    if (preselected) setForm((f) => ({ ...f, bookId: preselected }));
  }, [preselected]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.studentFullName.trim().length < 3) next.studentFullName = dict.common.required;
    if (!isValidAlgerianPhone(form.parentPhone)) next.parentPhone = dict.common.required;
    if (!form.wilaya) next.wilaya = dict.common.required;
    if (!form.commune.trim()) next.commune = dict.common.required;
    if (form.detailedAddress.trim().length < 5) next.detailedAddress = dict.common.required;
    if (form.proofOfNeedDescription.trim().length < 10) next.proofOfNeedDescription = dict.common.required;
    if (!form.bookId) next.bookId = dict.requestForm.missingBook;
    if (!idCard) next.idCard = dict.requestForm.missingIdCard;
    if (type === 'notebook_bundle' && !familyCard) next.familyCard = dict.requestForm.missingFamilyCard;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function uploadDoc(file: File, userId: string, label: 'national-id' | 'family-card') {
    const ext = file.name.split('.').pop() ?? 'pdf';
    const path = `${userId}/${randomSuffix()}/${label}.${ext}`;
    const { error } = await supabase.storage.from('aid-documents').upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !selectedBook) return;

    setSubmitting(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error('not authenticated');
      const userId = userRes.user.id;

      const idCardPath = await uploadDoc(idCard!, userId, 'national-id');
      const familyCardPath = familyCard ? await uploadDoc(familyCard, userId, 'family-card') : null;

      const { data: inserted, error } = await supabase
        .from('book_requests')
        .insert({
          user_id: userId,
          student_full_name: form.studentFullName,
          parent_phone: toAlgerianE164(form.parentPhone),
          wilaya: form.wilaya,
          commune: form.commune,
          detailed_address: form.detailedAddress,
          proof_of_need_description: form.proofOfNeedDescription,
          national_id_card_url: idCardPath,
          family_civil_status_card_url: familyCardPath,
          request_type: type,
          requested_items: [{ book_id: selectedBook.id, title: bookTitle(selectedBook), quantity: 1 }],
          status: 'pending',
          book_id: selectedBook.id,
          book_title: type === 'book' ? bookTitle(selectedBook) : null,
          bundle_name: type === 'notebook_bundle' ? bookTitle(selectedBook) : null,
        })
        .select('id, request_number')
        .single();

      if (error) throw error;
      setSubmitted({ id: inserted.id, number: inserted.request_number });
    } catch {
      setErrors({ form: dict.auth.errorGeneric });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-approved-bg text-status-approved">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.requestForm.successTitle}</h2>
        <p className="text-sm text-ink-400">{t(dict.requestForm.successBody, { number: submitted.number })}</p>
        <Button onClick={() => router.push(`/${locale}/dashboard/requests/${submitted.id}`)}>
          {dict.requestForm.backToRequests}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <h2 className="font-heading text-xl font-semibold text-ink-900">
        {type === 'book' ? dict.requestForm.bookTitle : dict.requestForm.bundleTitle}
      </h2>
      <p className="mt-1 text-sm text-ink-400">
        {type === 'book' ? dict.requestForm.bookSubtitle : dict.requestForm.bundleSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Select
          label={dict.requestForm.selectBookLabel}
          value={form.bookId}
          error={errors.bookId}
          onChange={(e) => setForm((f) => ({ ...f, bookId: e.target.value }))}
        >
          <option value="">
            {type === 'book' ? dict.requestForm.selectBookPlaceholder : dict.requestForm.selectBundlePlaceholder}
          </option>
          {availableItems.map((b) => (
            <option key={b.id} value={b.id}>
              {bookTitle(b)} — {b.subject} ({b.school_level})
            </option>
          ))}
        </Select>

        <Input
          label={dict.requestForm.fullNameLabel}
          required
          value={form.studentFullName}
          error={errors.studentFullName}
          onChange={(e) => setForm((f) => ({ ...f, studentFullName: e.target.value }))}
        />
        <Input
          label={dict.requestForm.phoneLabel}
          placeholder={dict.requestForm.phonePlaceholder}
          required
          value={form.parentPhone}
          error={errors.parentPhone}
          onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
        />
        <Select
          label={dict.requestForm.wilayaLabel}
          required
          value={form.wilaya}
          error={errors.wilaya}
          onChange={(e) => setForm((f) => ({ ...f, wilaya: e.target.value }))}
        >
          <option value="">{dict.requestForm.wilayaPlaceholder}</option>
          {wilayas.map((w) => (
            <option key={w.id} value={wilayaName(w)}>
              {wilayaName(w)}
            </option>
          ))}
        </Select>
        <Input
          label={dict.requestForm.communeLabel}
          placeholder={dict.requestForm.communePlaceholder}
          required
          value={form.commune}
          error={errors.commune}
          onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))}
        />
        <Textarea
          label={dict.requestForm.addressLabel}
          placeholder={dict.requestForm.addressPlaceholder}
          required
          value={form.detailedAddress}
          error={errors.detailedAddress}
          onChange={(e) => setForm((f) => ({ ...f, detailedAddress: e.target.value }))}
        />
        <Textarea
          label={dict.requestForm.proofLabel}
          placeholder={dict.requestForm.proofPlaceholder}
          required
          value={form.proofOfNeedDescription}
          error={errors.proofOfNeedDescription}
          onChange={(e) => setForm((f) => ({ ...f, proofOfNeedDescription: e.target.value }))}
        />

        <FileDropzone
          label={dict.requestForm.idCardLabel}
          hint={dict.requestForm.idCardHint}
          value={idCard}
          onChange={setIdCard}
          error={errors.idCard}
          required
        />

        {type === 'notebook_bundle' && (
          <FileDropzone
            label={dict.requestForm.familyCardLabel}
            hint={dict.requestForm.familyCardHint}
            value={familyCard}
            onChange={setFamilyCard}
            error={errors.familyCard}
            required
          />
        )}

        {errors.form && <p className="text-sm text-status-rejected">{errors.form}</p>}

        <Button type="submit" loading={submitting} size="lg" fullWidth className="mt-2">
          <Send className="h-4 w-4" />
          {submitting ? dict.requestForm.submitting : dict.requestForm.submitButton}
        </Button>
      </form>
    </Card>
  );
}

export function NoItemsAvailable({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <Card className="mx-auto max-w-lg py-10 text-center">
      <p className="text-sm text-ink-400">{dict.catalogue.noResults}</p>
      <Link href={`/${locale}/dashboard/catalogue`} className="mt-3 inline-block text-sm font-semibold text-primary-600 hover:underline">
        {dict.dashboard.exploreCatalogue}
      </Link>
    </Card>
  );
}
