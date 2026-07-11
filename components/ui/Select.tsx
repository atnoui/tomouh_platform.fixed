import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="font-heading text-sm font-semibold text-ink-600">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'h-12 w-full appearance-none rounded-[28px] border bg-surface-0 px-5 pe-10 text-sm text-ink-900',
              'focus-visible:focus-ring',
              error ? 'border-status-rejected' : 'border-border focus:border-primary-400',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        </div>
        {error && <span className="px-1 text-xs text-status-rejected">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';
