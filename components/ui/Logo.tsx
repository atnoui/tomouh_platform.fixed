import { cn } from '@/lib/utils';

/** The torch/goblet "T+U" monogram with the flame, as a standalone icon. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('h-10 w-10', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M60 6c7 12 16 19 16 30 0 9-7 16-16 16s-16-7-16-16c0-11 9-18 16-30Z"
        className="fill-secondary-600"
      />
      <path d="M50 52h20v16h12a4 4 0 0 1 4 4v6a26 26 0 0 1-52 0v-6a4 4 0 0 1 4-4h12V52Z" className="fill-primary-700" />
      <rect x="50" y="40" width="20" height="20" rx="3" className="fill-primary-700" />
      <path
        d="M30 78a26 26 0 0 0 52 0"
        className="stroke-primary-700"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

interface LogoProps {
  variant?: 'splash' | 'sidebar' | 'compact';
  className?: string;
  iconClassName?: string;
  /** Use on dark backgrounds (e.g. the admin sidebar) so the wordmark stays legible. */
  light?: boolean;
}

/**
 * Full bilingual lockup — Arabic "طموح" stacked above (or beside) the Latin
 * "Tomouh", paired with the icon mark. Composition mirrors the two layouts
 * found in the Figma file: horizontal (splash) and stacked (sidebar).
 */
export function Logo({ variant = 'sidebar', className, iconClassName, light = false }: LogoProps) {
  if (variant === 'splash') {
    return (
      <div className={cn('flex items-center gap-6', className)}>
        <div className="flex flex-col items-start gap-1">
          <span className="font-arabic text-5xl leading-none text-secondary-500">طموح</span>
          <span className="font-heading text-3xl font-semibold leading-none text-primary-100">
            Tomouh
          </span>
        </div>
        <LogoMark className={cn('h-20 w-20', iconClassName)} />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <LogoMark className={cn('h-8 w-8', iconClassName)} />
        <span className={cn('font-heading text-lg font-semibold', light ? 'text-white' : 'text-primary-700')}>
          Tomouh
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <LogoMark className={cn('h-12 w-12', iconClassName)} />
      <div className="flex flex-col items-center leading-none">
        <span className={cn('font-arabic text-xl', light ? 'text-secondary-400' : 'text-secondary-600')}>طموح</span>
        <span className={cn('font-heading text-sm font-semibold', light ? 'text-white' : 'text-primary-700')}>
          Tomouh
        </span>
      </div>
    </div>
  );
}
