import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="font-heading text-sm font-semibold text-ink-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-12 w-full rounded-[28px] border bg-surface-0 px-5 text-sm text-ink-900 transition-colors',
            'placeholder:text-ink-400 focus-visible:focus-ring',
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
Input.displayName = 'Input';
