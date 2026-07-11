'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, BookMarked, PackageOpen } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CONDITION_LABEL_KEY, CATALOG_TYPE_LABEL_KEY, SUBJECTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Book, Wilaya } from '@/lib/types';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

export function CatalogueClient({
  locale,
  dict,
  initialBooks,
  wilayas,
  myWilayaId,
}: {
  locale: Locale;
  dict: Dictionary;
  initialBooks: Book[];
  wilayas: Wilaya[];
  myWilayaId: number | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [wilayaId, setWilayaId] = useState('');
  const [condition, setCondition] = useState('');
  const [type, setType] = useState('');
  const [nearestOnly, setNearestOnly] = useState(false);

  const wilayaName = (w: Wilaya) => (locale === 'ar' ? w.name_ar : w.name_fr);
  const bookTitle = (b: Book) => (locale === 'ar' ? b.title_ar : b.title_fr || b.title_ar);

  const filtered = useMemo(() => {
    return initialBooks.filter((b) => {
      if (search && !bookTitle(b).toLowerCase().includes(search.toLowerCase()) && !b.subject.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (subject && b.subject !== subject) return false;
      if (condition && b.condition !== condition) return false;
      if (type && b.type !== type) return false;
      if (nearestOnly && myWilayaId && b.wilaya_id !== myWilayaId) return false;
      if (!nearestOnly && wilayaId && b.wilaya_id !== Number(wilayaId)) return false;
      return true;
    });
  }, [initialBooks, search, subject, condition, type, nearestOnly, wilayaId, myWilayaId, locale]);

  function requestItem(book: Book) {
    const target = book.type === 'book' ? 'borrow-book' : 'notebook-bundle';
    router.push(`/${locale}/dashboard/${target}?book=${book.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink-900">{dict.catalogue.title}</h2>
        <p className="text-sm text-ink-400">{dict.catalogue.subtitle}</p>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder={dict.catalogue.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-11"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">{dict.catalogue.allSubjects}</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{dict.catalogue.allTypes}</option>
            <option value="book">{dict.catalogue.typeBook}</option>
            <option value="notebook_bundle">{dict.catalogue.typeBundle}</option>
          </Select>
          <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="">{dict.catalogue.allConditions}</option>
            <option value="new">{dict.catalogue.conditionNew}</option>
            <option value="good">{dict.catalogue.conditionGood}</option>
            <option value="fair">{dict.catalogue.conditionFair}</option>
          </Select>
          <Select value={wilayaId} disabled={nearestOnly} onChange={(e) => setWilayaId(e.target.value)}>
            <option value="">{dict.catalogue.allWilayas}</option>
            {wilayas.map((w) => (
              <option key={w.id} value={w.id}>
                {wilayaName(w)}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          variant={nearestOnly ? 'secondary' : 'outline'}
          size="sm"
          className="self-start"
          disabled={!myWilayaId}
          onClick={() => setNearestOnly((v) => !v)}
        >
          <MapPin className="h-4 w-4" />
          {dict.catalogue.nearestToMe}
        </Button>
      </Card>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-400">{dict.catalogue.noResults}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <Card key={book.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  {book.type === 'book' ? <BookMarked className="h-5 w-5" /> : <PackageOpen className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    'rounded-pill px-3 py-1 text-xs font-semibold',
                    book.is_available && book.stock_quantity > 0
                      ? 'bg-status-approved-bg text-status-approved'
                      : 'bg-status-rejected-bg text-status-rejected'
                  )}
                >
                  {book.is_available && book.stock_quantity > 0 ? dict.catalogue.available : dict.catalogue.unavailable}
                </span>
              </div>
              <div>
                <p className="font-heading text-base font-semibold text-ink-900">{bookTitle(book)}</p>
                <p className="text-sm text-ink-400">
                  {book.subject} · {book.school_level}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
                <span className="rounded-pill bg-surface-50 px-2.5 py-1">{dict.catalogue[CONDITION_LABEL_KEY[book.condition]]}</span>
                <span className="rounded-pill bg-surface-50 px-2.5 py-1">{dict.catalogue[CATALOG_TYPE_LABEL_KEY[book.type]]}</span>
                <span className="rounded-pill bg-surface-50 px-2.5 py-1">
                  {dict.catalogue.stockLabel.replace('{count}', String(book.stock_quantity))}
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-ink-400">
                <MapPin className="h-3.5 w-3.5" /> {book.pickup_location}
                {book.wilayas ? ` — ${wilayaName(book.wilayas)}` : ''}
              </p>
              <Button
                size="sm"
                disabled={!book.is_available || book.stock_quantity <= 0}
                onClick={() => requestItem(book)}
              >
                {dict.catalogue.requestThis}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
