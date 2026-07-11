import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  children,
  className,
  textClassName,
}: {
  children: ReactNode;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold',
        className
      )}
    >
      <span className={textClassName}>{children}</span>
    </span>
  );
}

export function StatusBadge({
  label,
  textClass,
  bgClass,
}: {
  label: string;
  textClass: string;
  bgClass: string;
}) {
  return (
    <span className={cn('inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold', bgClass, textClass)}>
      {label}
    </span>
  );
}
