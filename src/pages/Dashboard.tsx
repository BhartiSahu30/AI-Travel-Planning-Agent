import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Globe2,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../hooks/useTrips';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { cn, daysBetween, formatCurrency, formatDate } from '../lib/utils';

const quickActions = [
  { to: '/trips/new', label: 'Plan a new trip', icon: Sparkles, accent: 'bg-brand-500' },
  { to: '/trips', label: 'Browse saved trips', icon: Compass, accent: 'bg-accent-500' },
  { to: '/profile', label: 'Edit your profile', icon: Users, accent: 'bg-ink-700' },
];

export function Dashboard() {
  const { profile } = useAuth();
  const { trips, loading } = useTrips();

  const totalTrips = trips.length;
  const destinations = new Set(trips.map((t) => t.destination).filter(Boolean)).size;
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget ?? 0), 0);
  const upcoming = trips
    .filter((t) => t.start_date && new Date(t.start_date) >= new Date(new Date().toDateString()))
    .length;

  const stats = [
    { label: 'Total trips', value: totalTrips, icon: Compass, accent: 'text-brand-600' },
    { label: 'Destinations', value: destinations, icon: Globe2, accent: 'text-accent-600' },
    { label: 'Upcoming', value: upcoming, icon: CalendarDays, accent: 'text-emerald-600' },
    { label: 'Planned budget', value: formatCurrency(totalBudget, profile?.currency), icon: Wallet, accent: 'text-ink-700' },
  ];

  const recent = trips.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:p-8"
      >
        <div className="absolute inset-0 bg-grid-dark [background-size:24px_24px] opacity-20" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-brand-100">Welcome back,</p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {profile?.full_name || 'Traveler'}
            </h1>
            <p className="mt-2 max-w-md text-sm text-brand-100">
              Let's plan your next adventure. TravelGenie AI is ready when you are.
            </p>
          </div>
          <Link to="/trips/new">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50">
              <Sparkles className="h-4 w-4" /> Plan a new trip
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{s.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-ink-50">{s.value}</p>
                </div>
                <div className={cn('grid h-11 w-11 place-items-center rounded-xl bg-ink-100 dark:bg-ink-800', s.accent)}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card hover className="flex items-center gap-4">
              <div className={cn('grid h-11 w-11 place-items-center rounded-xl text-white', a.accent)}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-900 dark:text-ink-50">{a.label}</p>
                <p className="text-sm text-ink-500 dark:text-ink-400">Tap to open</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-400" />
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent trips */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">Recent trips</h2>
          <Link to="/trips" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No trips yet"
            description="Plan your first trip with TravelGenie AI and it'll appear here."
            actionLabel="Plan a trip"
            actionTo="/trips/new"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map((t) => (
              <Link key={t.id} to={`/trips/${t.id}`}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
                        {t.destination ?? 'Untitled trip'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400">
                        <MapPin className="h-3.5 w-3.5" /> From {t.departure_city ?? '—'}
                      </p>
                    </div>
                    <Badge variant={t.status === 'saved' ? 'success' : 'default'}>
                      {t.status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600 dark:text-ink-300">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-ink-400" />
                      {formatDate(t.start_date)} – {formatDate(t.end_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-ink-400" />
                      {daysBetween(t.start_date, t.end_date)} days
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-ink-400" />
                      {formatCurrency(t.budget ?? 0, t.currency)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
