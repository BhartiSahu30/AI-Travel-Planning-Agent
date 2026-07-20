import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Logo } from '../components/Logo';

export function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-50 px-6 dark:bg-ink-950">
      <div className="absolute inset-0 bg-aurora" />
      <div className="absolute inset-0 bg-grid-light [background-size:32px_32px] opacity-60 dark:bg-grid-dark" />
      <div className="relative text-center">
        <Link to="/" className="mb-8 inline-flex">
          <Logo />
        </Link>
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <Compass className="h-10 w-10 animate-float" />
        </div>
        <p className="font-display text-6xl font-bold text-ink-900 dark:text-ink-50">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900 dark:text-ink-50">
          You've wandered off the map
        </h1>
        <p className="mx-auto mt-2 max-w-md text-ink-500 dark:text-ink-400">
          The page you're looking for doesn't exist or has been moved. Let's get you back on route.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/">
            <button className="btn-primary">
              <Home className="h-4 w-4" /> Back home
            </button>
          </Link>
          <Link to="/dashboard">
            <button className="btn-outline">Open dashboard</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
