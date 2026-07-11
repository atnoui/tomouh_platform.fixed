'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, BookMarked, PackageOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { SUBJECTS, SCHOOL_LEVELS, CONDITION_LABEL_KEY, CATALOG_TYPE_LABEL_KEY } from '@/lib/constants';
import { upsertBookAction, deleteBookAction } from './actions';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Book, Wilaya } from '@/lib/types';
import type { BookFormInput } from '@/lib/validations';

const EMPTY_FORM: BookFormInput = {
  titleAr: '',
  titleFr: '',
  subject: SUBJECTS[0],
  schoolLevel: SCHOOL_LEVELS[0],
  type: 'book',
  condition: 'good',
  stockQuantity: 1,
  pickupLocation: '',
  wilayaId: undefined,
  coverImageUrl: '',
  isAvailable: true,
};

export function InventoryClient({
  locale,
  dict,
  initialBooks,
  wilayas,
}: {
  locale: Locale;
  dict: Dictionary;
  initialBooks: Book[];
  wilayas: Wilaya[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BookFormInput>(EMPTY_FORM);

  const wilayaName = (w: Wilaya) => (locale === 'ar' ? w.name_ar : w.name_fr);
  const bookTitle = (b: Book) => (locale === 'ar' ? b.title_ar : b.title_fr || b.title_ar);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(book: Book) {
    setEditingId(book.id);
    setForm({
      titleAr: book.title_ar,
      titleFr: book.title_fr ?? '',
      subject: book.subject,
      schoolLevel: book.school_level,
      type: book.type,
      condition: book.condition,
      stockQuantity: book.stock_quantity,
      pickupLocation: book.pickup_location,
      wilayaId: book.wilaya_id ?? undefined,
      coverImageUrl: book.cover_image_url ?? '',
      isAvailable: book.is_available,
    });
    setModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertBookAction({ ...form, id: editingId ?? undefined }, locale);
      showToast(result.ok ? dict.admin.itemSaved : dict.common.error, result.ok ? 'success' : 'error');
      if (result.ok) {
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm(dict.admin.deleteConfirm)) return;
    startTransition(async () => {
      const result = await deleteBookAction(id, locale);
      showToast(result.ok ? dict.admin.itemDeleted : dict.common.error, result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{dict.admin.inventoryTitle}</CardTitle>
            <p className="mt-1 text-sm text-ink-400">{dict.admin.inventorySubtitle}</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> {dict.admin.addItem}
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-300">
                <th className="px-3 py-3 text-start font-semibold">{dict.admin.titleFr}</th>
                <th className="px-3 py-3 text-start font-semibold">{dict.admin.subject}</th>
                <th className="px-3 py-3 text-start font-semibold">{dict.admin.type}</th>
                <th className="px-3 py-3 text-start font-semibold">{dict.admin.condition}</th>
                <th className="px-3 py-3 text-start font-semibold">{dict.admin.stock}</th>
                <th className="px-3 py-3 text-start font-semibold">{dict.admin.pickupLocation}</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {initialBooks.map((book) => (
                <tr key={book.id} className="border-b border-border-soft last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        {book.type === 'book' ? <BookMarked className="h-4 w-4" /> : <PackageOpen className="h-4 w-4" />}
                      </div>
                      <span className="font-medium text-ink-900">{bookTitle(book)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-ink-600">{book.subject}</td>
                  <td className="px-3 py-3 text-ink-600">{dict.catalogue[CATALOG_TYPE_LABEL_KEY[book.type]]}</td>
                  <td className="px-3 py-3 text-ink-600">{dict.catalogue[CONDITION_LABEL_KEY[book.condition]]}</td>
                  <td className="px-3 py-3 text-ink-600">{book.stock_quantity}</td>
                  <td className="px-3 py-3 text-ink-600">{book.pickup_location}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(book)} className="rounded-lg p-2 text-ink-400 hover:bg-surface-50 hover:text-primary-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(book.id)} className="rounded-lg p-2 text-ink-400 hover:bg-status-rejected-bg hover:text-status-rejected">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? dict.admin.editItem : dict.admin.addItem}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={dict.admin.titleAr} required value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} />
            <Input label={dict.admin.titleFr} value={form.titleFr} onChange={(e) => setForm((f) => ({ ...f, titleFr: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label={dict.admin.subject} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select label={dict.admin.schoolLevel} value={form.schoolLevel} onChange={(e) => setForm((f) => ({ ...f, schoolLevel: e.target.value }))}>
              {SCHOOL_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={dict.admin.type}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BookFormInput['type'] }))}
            >
              <option value="book">{dict.catalogue.typeBook}</option>
              <option value="notebook_bundle">{dict.catalogue.typeBundle}</option>
            </Select>
            <Select
              label={dict.admin.condition}
              value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as BookFormInput['condition'] }))}
            >
              <option value="new">{dict.catalogue.conditionNew}</option>
              <option value="good">{dict.catalogue.conditionGood}</option>
              <option value="fair">{dict.catalogue.conditionFair}</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={dict.admin.stock}
              type="number"
              min={0}
              value={form.stockQuantity}
              onChange={(e) => setForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))}
            />
            <Select
              label={dict.admin.wilaya}
              value={form.wilayaId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, wilayaId: e.target.value ? Number(e.target.value) : undefined }))}
            >
              <option value="">—</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.id}>
                  {wilayaName(w)}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label={dict.admin.pickupLocation}
            required
            value={form.pickupLocation}
            onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
          />
          <ImageUpload
            label={dict.admin.coverImage}
            value={form.coverImageUrl ?? ''}
            onChange={(url) => setForm((f) => ({ ...f, coverImageUrl: url }))}
            folder="covers"
            chooseLabel={dict.admin.chooseFromGallery}
            changeLabel={dict.admin.changeImage}
            removeLabel={dict.admin.removeImage}
            uploadingLabel={dict.admin.uploadingImage}
          />
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary-600"
            />
            {dict.catalogue.available}
          </label>
          <Button type="submit" loading={pending} fullWidth>
            {dict.admin.save}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
