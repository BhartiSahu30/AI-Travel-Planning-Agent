import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../contexts/ToastContext';
import { planTrip } from '../lib/api';
import { createTrip } from '../lib/api';
import { cn, sleep } from '../lib/utils';
import type { PlanTripRequest, PlanTripResponse } from '../types';

interface Step {
  label: string;
  status: 'pending' | 'active' | 'done';
}

const baseSteps: Step[] = [
  { label: 'Analyzing your request', status: 'pending' },
  { label: 'Checking weather', status: 'pending' },
  { label: 'Estimating budget', status: 'pending' },
  { label: 'Optimizing routes', status: 'pending' },
  { label: 'Recommending hotels', status: 'pending' },
  { label: 'Recommending attractions', status: 'pending' },
  { label: 'Recommending restaurants', status: 'pending' },
  { label: 'Building itinerary', status: 'pending' },
  { label: 'Creating packing list', status: 'pending' },
];

export function PlanningProgress() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [steps, setSteps] = useState<Step[]>(baseSteps);
  const [error, setError] = useState<string | null>(null);
  const [needsMore, setNeedsMore] = useState<string[] | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    const raw = sessionStorage.getItem('tg-pending-trip');
    if (!raw) {
      navigate('/trips/new', { replace: true });
      return;
    }
    const req = JSON.parse(raw) as PlanTripRequest;

    // Animate steps while waiting for the agent
    setSteps((s) => s.map((x, i) => (i === 0 ? { ...x, status: 'active' } : x)));

    const stepPromise = (async () => {
      for (let i = 0; i < baseSteps.length; i++) {
        await sleep(450 + Math.random() * 350);
        setSteps((s) =>
          s.map((x, idx) =>
            idx === i ? { ...x, status: 'done' } : idx === i + 1 ? { ...x, status: 'active' } : x
          )
        );
      }
    })();

    try {
      const res: PlanTripResponse = await planTrip(req);
      await stepPromise.catch(() => undefined);

      if (res.needs_more_info && res.missing_fields?.length) {
        setNeedsMore(res.missing_fields);
        setSteps((s) => s.map((x) => ({ ...x, status: 'pending' })));
        return;
      }

      if (res.error || !res.plan) {
        throw new Error(res.error ?? 'No plan returned');
      }

      // Persist the trip
      const trip = await createTrip({
        title: `${req.destination ?? 'Trip'} (${req.start_date ?? ''})`,
        departure_city: req.departure_city ?? null,
        destination: req.destination ?? null,
        start_date: req.start_date ?? null,
        end_date: req.end_date ?? null,
        budget: req.budget ?? null,
        currency: req.currency ?? 'USD',
        travelers: req.travelers ?? { adults: 1, children: 0 },
        style: req.style ?? null,
        preferences: req.preferences ?? {},
        status: 'planned',
        plan: res.plan,
      });

      sessionStorage.removeItem('tg-pending-trip');
      sessionStorage.setItem(`tg-trip-${trip.id}`, JSON.stringify(res.plan));
      navigate(`/trips/${trip.id}`, { replace: true });
    } catch (e) {
      await stepPromise.catch(() => undefined);
      const msg = e instanceof Error ? e.message : 'Planning failed';
      setError(msg);
      push({ title: 'Planning failed', description: msg, variant: 'error' });
    }
  }

  function handleRetry() {
    setError(null);
    setSteps(baseSteps);
    started.current = false;
    void run();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <Sparkles className="h-7 w-7 animate-pulse" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">
          TravelGenie is planning your trip
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Reasoning, calling tools, and assembling your itinerary.
        </p>
      </div>

      <Card className="p-6">
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full border transition',
                  s.status === 'done'
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : s.status === 'active'
                    ? 'border-brand-400 bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'border-ink-200 bg-white text-ink-300 dark:border-ink-700 dark:bg-ink-900/40'
                )}
              >
                {s.status === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : s.status === 'active' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  'text-sm transition',
                  s.status === 'done'
                    ? 'text-ink-900 dark:text-ink-100'
                    : s.status === 'active'
                    ? 'font-medium text-ink-900 dark:text-ink-50'
                    : 'text-ink-400'
                )}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <AnimatePresence>
        {needsMore && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl border-amber-300 p-5"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-semibold text-ink-900 dark:text-ink-50">More info needed</p>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                  Please provide: {needsMore.map((f) => f.replace(/_/g, ' ')).join(', ')}.
                </p>
                <Button className="mt-4" onClick={() => navigate('/trips/new')}>
                  Update trip details
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl border-red-300 p-5"
          >
            <div className="flex items-start gap-3">
              <X className="mt-0.5 h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold text-ink-900 dark:text-ink-50">Something went wrong</p>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{error}</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleRetry}>Retry</Button>
                  <Button variant="outline" onClick={() => navigate('/trips/new')}>
                    Edit inputs
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
