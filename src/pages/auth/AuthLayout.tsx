import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Sparkles, Waypoints } from 'lucide-react';
import { Logo } from '../../components/Logo';

const features = [
  { icon: Sparkles, title: 'AI that reasons', text: 'Asks the right questions before planning.' },
  { icon: Waypoints, title: 'End-to-end itineraries', text: 'Hotels, food, routes, packing — all in one plan.' },
  { icon: ShieldCheck, title: 'Private & secure', text: 'Your trips are yours. Row-level security on every table.' },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        <Link to="/" className="inline-flex">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-fade-in">{children}</div>
        </div>
        <p className="text-center text-xs text-ink-400">
          © {new Date().getFullYear()} TravelGenie AI
        </p>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <div className="absolute inset-0 bg-aurora" />
        <div className="absolute inset-0 bg-grid-dark [background-size:32px_32px] opacity-40" />
        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <div className="mb-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200 backdrop-blur">
            <Compass className="h-3.5 w-3.5" /> Autonomous AI travel agent
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight text-balance">
            Your next adventure, planned by an AI that actually thinks.
          </h2>
          <p className="mt-4 max-w-md text-ink-300">
            TravelGenie AI gathers your goals, asks follow-ups when needed, and builds a
            personalized itinerary with budgets, hotels, restaurants, weather, and packing lists.
          </p>
          <div className="mt-10 grid gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass flex items-start gap-3 rounded-2xl border-white/10 bg-white/5 p-4 text-white"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-ink-300">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
