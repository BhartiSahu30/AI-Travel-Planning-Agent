import { Logo } from './Logo';

export function SplashLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-4">
        <Logo withText={false} className="animate-float" />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
          <div className="h-full w-1/2 animate-shimmer bg-brand-500" />
        </div>
        <p className="text-sm text-ink-500 dark:text-ink-400">Loading TravelGenie AI…</p>
      </div>
    </div>
  );
}
