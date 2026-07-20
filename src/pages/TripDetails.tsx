import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Download,
  MapPin,
  Pencil,
  RefreshCw,
  Share2,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { TripPlanView } from '../components/TripPlanView';
import { useToast } from '../contexts/ToastContext';
import { deleteTrip, getTrip, updateTrip } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Trip, TripPlan } from '../types';

export function TripDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const t = await getTrip(id);
        if (!active) return;
        if (!t) {
          setError('Trip not found.');
          return;
        }
        setTrip(t);
        setTitle(t.title ?? `${t.destination ?? 'Trip'}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load trip');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSave() {
    if (!trip || !id) return;
    try {
      const updated = await updateTrip(id, { title, status: 'saved' });
      setTrip(updated);
      setEditing(false);
      push({ title: 'Trip saved', variant: 'success' });
    } catch (e) {
      push({
        title: 'Could not save',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'error',
      });
    }
  }

  async function handleDelete() {
    if (!trip || !id) return;
    if (!confirm('Delete this trip? This cannot be undone.')) return;
    try {
      await deleteTrip(id);
      push({ title: 'Trip deleted', variant: 'success' });
      navigate('/trips', { replace: true });
    } catch (e) {
      push({
        title: 'Could not delete',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'error',
      });
    }
  }

  async function handleShare() {
    if (!trip) return;
    const url = `${window.location.origin}/trips/${trip.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: trip.title ?? 'My TravelGenie trip', url });
      } else {
        await navigator.clipboard.writeText(url);
        push({ title: 'Link copied', description: url, variant: 'success' });
      }
    } catch {
      /* user dismissed */
    }
  }

  function handleDownloadPDF() {
    if (!trip) return;
    window.print();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">
          {error ?? 'Trip not found'}
        </h2>
        <Link to="/trips" className="btn-primary mt-6">
          Back to saved trips
        </Link>
      </div>
    );
  }

  const plan: TripPlan | null = trip.plan ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/trips"
            className="mt-1 rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input h-9 max-w-xs"
                  autoFocus
                />
                <Button size="sm" onClick={handleSave} leftIcon={<Check className="h-4 w-4" />}>
                  Save
                </Button>
              </div>
            ) : (
              <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">
                {trip.title || trip.destination}
              </h1>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500 dark:text-ink-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {trip.departure_city ?? '—'} → {trip.destination ?? '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {(trip.travelers?.adults ?? 0) + (trip.travelers?.children ?? 0)} travelers
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                {formatCurrency(trip.budget ?? 0, trip.currency)}
              </span>
              <Badge variant={trip.status === 'saved' ? 'success' : 'default'}>{trip.status}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)} leftIcon={<Pencil className="h-4 w-4" />}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} leftIcon={<Download className="h-4 w-4" />}>
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} leftIcon={<Share2 className="h-4 w-4" />}>
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} leftIcon={<Trash2 className="h-4 w-4" />}>
            Delete
          </Button>
          <Link to="/trips/new">
            <Button size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>Plan again</Button>
          </Link>
        </div>
      </div>

      {plan ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <TripPlanView plan={plan} currency={trip.currency} />
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-700">
          <p className="text-ink-500">This trip has no AI plan yet.</p>
          <Link to="/trips/new" className="btn-primary mt-4">
            Generate a plan
          </Link>
        </div>
      )}
    </div>
  );
}
