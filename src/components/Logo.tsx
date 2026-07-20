import { MapPinned, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <MapPinned className="h-5 w-5" />
        <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-accent-400" />
      </div>
      {withText && (
        <span className="font-display text-lg font-bold tracking-tight text-ink-900 dark:text-ink-50">
          TravelGenie<span className="text-brand-500"> AI</span>
        </span>
      )}
    </div>
  );
}
