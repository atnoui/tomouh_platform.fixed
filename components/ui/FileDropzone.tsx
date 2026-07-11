'use client';

import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { UploadCloud, FileCheck2, X } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

export function FileDropzone({
  label,
  hint,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPTED.includes(file.type)) {
        setLocalError('PDF, JPG ou PNG uniquement.');
        return;
      }
      if (file.size > MAX_SIZE) {
        setLocalError('Fichier trop volumineux (5 Mo max).');
        return;
      }
      setLocalError(null);
      onChange(file);
    },
    [onChange]
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  const displayError = error ?? localError ?? undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-heading text-sm font-semibold text-ink-600">
        {label}
        {required && <span className="text-secondary-600"> *</span>}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragActive ? 'border-secondary-500 bg-secondary-50' : 'border-border bg-[#EFF4FF]/50 hover:bg-[#EFF4FF]',
          displayError && 'border-status-rejected'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />
        {value ? (
          <>
            <FileCheck2 className="h-8 w-8 text-status-approved" />
            <p className="text-sm font-medium text-ink-900">{value.name}</p>
            <p className="text-xs text-ink-400">{formatBytes(value.size)}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-status-rejected hover:underline"
            >
              <X className="h-3 w-3" /> Retirer
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-primary-500" />
            <p className="text-sm font-medium text-ink-600">Clique ou dépose un fichier ici</p>
            {hint && <p className="text-xs text-ink-400">{hint}</p>}
          </>
        )}
      </div>
      {displayError && <span className="px-1 text-xs text-status-rejected">{displayError}</span>}
    </div>
  );
}
