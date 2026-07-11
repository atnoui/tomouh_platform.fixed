import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes an Algerian mobile number to E.164 (+213XXXXXXXXX).
 * Accepts input like "0551234567", "551234567", "+213551234567".
 */
export function toAlgerianE164(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('213')) return `+${digits}`;
  if (digits.startsWith('0')) return `+213${digits.slice(1)}`;
  return `+213${digits}`;
}

/** Validates a Algerian mobile number (5/6/7-prefixed, 9 digits after the leading 0/213). */
export function isValidAlgerianPhone(raw: string): boolean {
  const e164 = toAlgerianE164(raw);
  return /^\+213[5-7]\d{8}$/.test(e164);
}

export function formatPhoneDisplay(e164: string | null | undefined): string {
  if (!e164) return '—';
  const match = e164.match(/^\+213(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) return e164;
  return `+213 ${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
}

export function formatDate(iso: string | null | undefined, locale: 'fr' | 'ar'): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined, locale: 'fr' | 'ar'): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Generates a storage-safe random suffix to avoid filename collisions. */
export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 9);
}
