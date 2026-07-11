'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WizardSteps({
  steps,
  currentIndex,
}: {
  steps: string[];
  currentIndex: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-1 items-center gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i < currentIndex && 'bg-status-approved text-white',
                i === currentIndex && 'bg-primary-600 text-white',
                i > currentIndex && 'bg-surface-100 text-ink-400'
              )}
            >
              {i < currentIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'hidden text-center text-[11px] font-medium sm:block',
                i === currentIndex ? 'text-ink-900' : 'text-ink-400'
              )}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('h-0.5 flex-1 rounded-full', i < currentIndex ? 'bg-status-approved' : 'bg-surface-100')} />
          )}
        </div>
      ))}
    </div>
  );
}

export interface TimelineStep {
  key: string;
  title: string;
  description: string;
  state: 'done' | 'current' | 'upcoming' | 'rejected';
  icon: ReactNode;
}

export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={step.key} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2',
                step.state === 'done' && 'border-status-approved bg-status-approved-bg text-status-approved',
                step.state === 'current' && 'border-primary-600 bg-primary-50 text-primary-600',
                step.state === 'upcoming' && 'border-border bg-surface-50 text-ink-300',
                step.state === 'rejected' && 'border-status-rejected bg-status-rejected-bg text-status-rejected'
              )}
            >
              {step.icon}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'my-1 w-0.5 flex-1 rounded-full',
                  step.state === 'done' ? 'bg-status-approved' : 'bg-border-soft'
                )}
                style={{ minHeight: '32px' }}
              />
            )}
          </div>
          <div className={cn('pb-8', i === steps.length - 1 && 'pb-0')}>
            <p
              className={cn(
                'font-heading text-sm font-semibold',
                step.state === 'upcoming' ? 'text-ink-300' : 'text-ink-900'
              )}
            >
              {step.title}
            </p>
            <p className={cn('mt-0.5 text-sm', step.state === 'upcoming' ? 'text-ink-300' : 'text-ink-400')}>
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
