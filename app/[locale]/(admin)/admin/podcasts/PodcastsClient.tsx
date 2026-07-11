'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Headphones, Video } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { upsertPodcastAction, deletePodcastAction } from './actions';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Podcast } from '@/lib/types';
import type { PodcastFormInput } from '@/lib/validations';

const EMPTY_FORM: PodcastFormInput = {
  title: '',
  description: '',
  mediaUrl: '',
  mediaType: 'audio',
  thumbnailUrl: '',
  isPublished: true,
};

export function PodcastsClient({
  locale,
  dict,
  initialPodcasts,
}: {
  locale: Locale;
  dict: Dictionary;
  initialPodcasts: Podcast[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PodcastFormInput>(EMPTY_FORM);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(podcast: Podcast) {
    setEditingId(podcast.id);
    setForm({
      title: podcast.title,
      description: podcast.description ?? '',
      mediaUrl: podcast.media_url,
      mediaType: podcast.media_type,
      thumbnailUrl: podcast.thumbnail_url ?? '',
      isPublished: podcast.is_published,
    });
    setModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertPodcastAction({ ...form, id: editingId ?? undefined }, locale);
      showToast(result.ok ? dict.admin.podcastSaved : dict.common.error, result.ok ? 'success' : 'error');
      if (result.ok) {
        setModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm(dict.admin.deleteConfirm)) return;
    startTransition(async () => {
      const result = await deletePodcastAction(id, locale);
      showToast(result.ok ? dict.admin.podcastDeleted : dict.common.error, result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{dict.admin.podcastsTitle}</CardTitle>
            <p className="mt-1 text-sm text-ink-400">{dict.admin.podcastsSubtitle}</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> {dict.admin.addPodcast}
          </Button>
        </CardHeader>

        <div className="flex flex-col divide-y divide-border-soft">
          {initialPodcasts.map((podcast) => (
            <div key={podcast.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-50 text-secondary-600">
                  {podcast.media_type === 'audio' ? <Headphones className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{podcast.title}</p>
                  <p className="text-xs text-ink-400">
                    {formatDate(podcast.created_at, locale)} {!podcast.is_published && `· ${dict.common.none}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(podcast)} className="rounded-lg p-2 text-ink-400 hover:bg-surface-50 hover:text-primary-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(podcast.id)} className="rounded-lg p-2 text-ink-400 hover:bg-status-rejected-bg hover:text-status-rejected">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? dict.admin.editPodcast : dict.admin.addPodcast}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label={dict.admin.podcastTitle} required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea
            label={dict.admin.podcastDescription}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={dict.admin.mediaType}
              value={form.mediaType}
              onChange={(e) => setForm((f) => ({ ...f, mediaType: e.target.value as PodcastFormInput['mediaType'] }))}
            >
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </Select>
            <label className="flex items-center gap-2.5 self-end pb-3 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary-600"
              />
              {dict.admin.published}
            </label>
          </div>
          <Input
            label={dict.admin.mediaUrl}
            placeholder="https://…"
            required
            value={form.mediaUrl}
            onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
          />
          <ImageUpload
            label={dict.admin.thumbnail}
            value={form.thumbnailUrl ?? ''}
            onChange={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
            folder="thumbnails"
            chooseLabel={dict.admin.chooseFromGallery}
            changeLabel={dict.admin.changeImage}
            removeLabel={dict.admin.removeImage}
            uploadingLabel={dict.admin.uploadingImage}
          />
          <Button type="submit" loading={pending} fullWidth>
            {dict.admin.save}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
