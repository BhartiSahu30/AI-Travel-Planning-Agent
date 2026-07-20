import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Compass,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useTrips } from '../hooks/useTrips';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../contexts/ToastContext';
import { deleteTrip, updateTrip } from '../lib/api';
import { cn, daysBetween, formatCurrency, formatDate } from '../lib/utils';
import type { Trip } from '../types';

const filters = ['all', 'planned', 'saved', 'archived'] as const;
type Filter = (typeof filters)[number];

export function SavedTrips() {
  const { trips, loading, setTrips, refresh } = useTrips();
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const debounced = useDebounce(query, 200);

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (!debounced) return true;
      const q = debounced.toLowerCase();
      return (
        (t.title ?? '').toLowerCase().includes(q) ||
        (t.destination ?? '').toLowerCase().includes(q) ||
        (t.departure_city ?? '').toLowerCase().includes(q)
      );
    });
  }, [trips, filter, debounced]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this trip?')) return;
    setTrips((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTrip(id);
      push({ title: 'Trip deleted', variant: 'success' });
    } catch (e) {
      push({ title: 'Delete failed', description: e instanceof Error ? e.message : '', variant: 'error' });
      void refresh();
    }
  }

  async function handleRename(t: Trip) {
    const next = prompt('Rename trip', t.title ?? '');
    if (next === null || next === t.title) return;
    try {
      const updated = await updateTrip(t.id, { title: next });
      setTrips((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
    } catch (e) {
      push({ title: 'Rename failed', description: e instanceof Error ? e.message : '', variant: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Saved trips</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">All your TravelGenie plans in one place.</p>
        </div>
        <Link to="/trips/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New trip</Button>
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by destination, title, or origin…"
            className="pl-10"
          />
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'chip',
                filter === f
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-200'
              )}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={trips.length === 0 ? 'No trips yet' : 'No matching trips'}
          description={
            trips.length === 0
              ? 'Plan your first trip with TravelGenie AI and it will show up here.'
              : 'Try a different search or filter.'
          }
          actionLabel={trips.length === 0 ? 'Plan a trip' : undefined}
          actionTo={trips.length === 0 ? '/trips/new' : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Card hover className="group h-full">
                <Link to={`/trips/${t.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
                        {t.destination ?? 'Untitled trip'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                        <MapPin className="h-3 w-3" /> From {t.departure_city ?? '—'}
                      </p>
                    </div>
                    <Badge variant={t.status === 'saved' ? 'success' : 'default'}>{t.status}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-600 dark:text-ink-300">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
                      {formatDate(t.start_date)} – {formatDate(t.end_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-ink-400" />
                      {formatCurrency(t.budget ?? 0, t.currency)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-ink-400" />
                      {daysBetween(t.start_date, t.end_date)} days
                    </span>
                  </div>
                </Link>
                <div className="mt-4 flex gap-2 border-t border-ink-200/60 pt-3 dark:border-ink-800">
                  <Button variant="ghost" size="sm" onClick={() => handleRename(t)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(t.id)}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
