'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn, randomSuffix } from '@/lib/utils';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * Lets an admin pick an image straight from their device's gallery (laptop
 * file browser or phone photo library) instead of pasting a link. The file
 * is uploaded directly to the public "public-media" Supabase Storage bucket
 * and the resulting public URL is reported back through `onChange`.
 */
export function ImageUpload({
  label,
  hint,
  value,
  onChange,
  folder,
  error,
  required,
  chooseLabel = 'Choisir depuis la galerie',
  changeLabel = 'Changer l’image',
  removeLabel = 'Retirer',
  uploadingLabel = 'Envoi en cours…',
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  error?: string;
  required?: boolean;
  chooseLabel?: string;
  changeLabel?: string;
  removeLabel?: string;
  uploadingLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setLocalError('Image JPG, PNG ou WEBP uniquement.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setLocalError('Image trop volumineuse (5 Mo max).');
      return;
    }
    setLocalError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${folder}/${randomSuffix()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('public-media')
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('public-media').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setLocalError('Échec de l’envoi de l’image. Réessaie.');
    } finally {
      setUploading(false);
    }
  }

  const displayError = error ?? localError ?? undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-heading text-sm font-semibold text-ink-600">
        {label}
        {required && <span className="text-secondary-600"> *</span>}
      </label>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            'relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-[#EFF4FF]/50',
            displayError ? 'border-status-rejected' : 'border-border'
          )}
        >
          {value ? (
            <Image src={value} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-primary-400" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-0/70">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-0 px-4 py-2 text-xs font-semibold text-ink-700 transition-colors hover:bg-surface-50 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {uploading ? uploadingLabel : value ? changeLabel : chooseLabel}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="inline-flex items-center gap-1 self-start text-xs font-medium text-status-rejected hover:underline"
            >
              <X className="h-3 w-3" /> {removeLabel}
            </button>
          )}
        </div>
      </div>

      {hint && !displayError && <span className="px-1 text-xs text-ink-400">{hint}</span>}
      {displayError && <span className="px-1 text-xs text-status-rejected">{displayError}</span>}
    </div>
  );
}
