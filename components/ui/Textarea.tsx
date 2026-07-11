import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="font-heading text-sm font-semibold text-ink-600">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            'w-full rounded-3xl border bg-surface-0 px-5 py-4 text-sm text-ink-900 transition-colors',
            'placeholder:text-ink-400 focus-visible:focus-ring resize-none',
            error ? 'border-status-rejected' : 'border-border focus:border-primary-400',
            className
          )}
          {...props}
        />
        {hint && !error && <span className="px-1 text-xs text-ink-400">{hint}</span>}
        {error && <span className="px-1 text-xs text-status-rejected">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
