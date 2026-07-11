'use client';

import { useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export function OtpInput({
  value,
  onChange,
  error,
  length = 6,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, ' ').split('').slice(0, length);

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join('').replace(/\s/g, '');
    onChange(joined);
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    if (!char) return;
    setDigit(index, char);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index].trim()) {
        setDigit(index, ' ');
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setDigit(index - 1, ' ');
      }
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-center gap-2" dir="ltr">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={digits[i].trim()}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              'h-14 w-11 rounded-2xl border text-center text-xl font-semibold text-ink-900 focus-visible:focus-ring',
              error ? 'border-status-rejected' : 'border-border focus:border-primary-400'
            )}
          />
        ))}
      </div>
      {error && <span className="text-center text-xs text-status-rejected">{error}</span>}
    </div>
  );
}
