import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck,
  CloudSun,
  Hotel,
  MapPinned,
  PackageCheck,
  Play,
  Sparkles,
  Star,
  Wallet,
  Waypoints,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const features = [
  { icon: Waypoints, title: 'Personalized itineraries', text: 'Day-by-day plans tuned to your style, budget, and interests.' },
  { icon: Wallet, title: 'Budget estimation', text: 'Realistic cost breakdowns across flights, stays, food, and activities.' },
  { icon: Hotel, title: 'Hotel & restaurant picks', text: 'Curated stays and dining recommendations with reasons why.' },
  { icon: CloudSun, title: 'Weather-aware planning', text: 'Forecasts folded into your trip so you pack and plan right.' },
  { icon: PackageCheck, title: 'Smart packing lists', text: 'Auto-generated checklists based on destination and season.' },
  { icon: CalendarCheck, title: 'Save & export trips', text: 'Keep every plan, export to PDF, and revisit anytime.' },
];

const steps = [
  { title: 'Tell us your trip', text: 'Destination, dates, budget, style, and interests.' },
  { title: 'AI asks follow-ups', text: 'TravelGenie reasons about missing info before planning.' },
  { title: 'Get a full plan', text: 'Itinerary, hotels, food, weather, packing, and tips.' },
];

const testimonials = [
  {
    name: 'Amara O.',
    role: 'Solo traveler',
    quote: 'It felt like having a real travel agent. The follow-up questions caught details I would have missed.',
  },
  {
    name: 'Daniel K.',
    role: 'Family planner',
    quote: 'The budget breakdown was spot on for a family of four. Packing list alone saved me hours.',
  },
  {
    name: 'Priya S.',
    role: 'Backpacker',
    quote: 'Backpacking through Vietnam — the route optimization and local food picks were unreal.',
  },
];

export function Landing() {
  const { session } = useAuth();
  const ctaTo = session ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-ink-200/60 bg-white/70 backdrop-blur-xl dark:border-ink-800/70 dark:bg-ink-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-600 dark:text-ink-300 md:flex">
            <a href="#features" className="hover:text-ink-900 dark:hover:text-ink-50">Features</a>
            <a href="#how" className="hover:text-ink-900 dark:hover:text-ink-50">How it works</a>
            <a href="#testimonials" className="hover:text-ink-900 dark:hover:text-ink-50">Testimonials</a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Link to="/dashboard">
                <Button size="sm">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-aurora" />
        <div className="absolute inset-0 bg-grid-light [background-size:32px_32px] opacity-60 dark:bg-grid-dark" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800/60 dark:bg-brand-900/30 dark:text-brand-200">
              <Sparkles className="h-3.5 w-3.5" /> Powered by Google Gemini
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink-900 text-balance dark:text-ink-50 sm:text-5xl lg:text-6xl">
              Plan Smarter with <span className="text-brand-500">AI</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600 dark:text-ink-300">
              Your autonomous AI travel assistant that creates personalized itineraries in seconds.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={ctaTo}>
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>Get Started</Button>
              </Link>
              <a href="#how">
                <Button variant="outline" size="lg" leftIcon={<Play className="h-4 w-4" />}>Watch Demo</Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-ink-400">No credit card required · Free to start</p>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="glass-strong overflow-hidden rounded-3xl">
              <div className="flex items-center gap-2 border-b border-ink-200/60 px-4 py-3 dark:border-ink-800">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-ink-400">travelgenie.ai / plan</span>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-3">
                {[
                  { icon: MapPinned, label: 'Destination', value: 'Kyoto, Japan' },
                  { icon: CalendarCheck, label: 'Dates', value: 'Apr 2 – Apr 7' },
                  { icon: Wallet, label: 'Budget', value: '$2,400' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-ink-200/60 bg-white/60 p-4 dark:border-ink-800 dark:bg-ink-900/40">
                    <div className="flex items-center gap-2 text-brand-600 dark:text-brand-300">
                      <s.icon className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{s.label}</span>
                    </div>
                    <p className="mt-1 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{s.value}</p>
                  </div>
                ))}
                <div className="sm:col-span-3 rounded-2xl border border-ink-200/60 bg-white/60 p-4 dark:border-ink-800 dark:bg-ink-900/40">
                  <p className="text-sm text-ink-600 dark:text-ink-300">
                    <span className="font-semibold text-brand-600 dark:text-brand-300">TravelGenie:</span> Got it — 5 nights in Kyoto,
                    cherry blossom season. I'll plan a mix of temples, food markets, and a day trip to Nara. Generating your itinerary…
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50">Everything you need to plan a trip</h2>
          <p className="mt-3 text-ink-500 dark:text-ink-400">One AI agent that handles the whole planning workflow.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white/60 py-20 dark:bg-ink-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50">How it works</h2>
            <p className="mt-3 text-ink-500 dark:text-ink-400">Three steps from idea to itinerary.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative card">
                <span className="absolute -top-3 left-5 grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink-900 dark:text-ink-50">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50">Loved by travelers</h2>
          <p className="mt-3 text-ink-500 dark:text-ink-400">Real plans, real trips.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card">
              <div className="flex gap-0.5 text-accent-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-3 text-sm text-ink-700 dark:text-ink-200">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{t.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-center text-white sm:p-16">
          <div className="absolute inset-0 bg-grid-dark [background-size:24px_24px] opacity-20" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Your next trip, planned by AI.</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              Join TravelGenie AI and turn your travel ideas into ready-to-go itineraries.
            </p>
            <Link to={ctaTo} className="mt-8 inline-block">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-200/60 bg-white/60 dark:border-ink-800 dark:bg-ink-950/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-6 text-sm text-ink-500 dark:text-ink-400">
            <a href="#features" className="hover:text-ink-900 dark:hover:text-ink-100">Features</a>
            <a href="#how" className="hover:text-ink-900 dark:hover:text-ink-100">How it works</a>
            <Link to="/login" className="hover:text-ink-900 dark:hover:text-ink-100">Sign in</Link>
          </div>
          <p className="text-xs text-ink-400">© {new Date().getFullYear()} TravelGenie AI</p>
        </div>
      </footer>
    </div>
  );
}
