import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Download,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { orchestrateUrl, orchestrateHeaders, createTrip } from '../lib/api';
import { generateTripPdf } from '../lib/pdf';
import { cn } from '../lib/utils';
import type { PlanTripRequest, TripPlan } from '../types';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  detail?: string;
}

const AGENT_STEPS: Step[] = [
  { id: 'understand', label: 'Understanding Request', status: 'pending' },
  { id: 'collect', label: 'Collecting Missing Information', status: 'pending' },
  { id: 'weather', label: 'Checking Weather', status: 'pending' },
  { id: 'hotels', label: 'Finding Hotels', status: 'pending' },
  { id: 'attractions', label: 'Finding Attractions', status: 'pending' },
  { id: 'route', label: 'Optimizing Route', status: 'pending' },
  { id: 'budget', label: 'Calculating Budget', status: 'pending' },
  { id: 'itinerary', label: 'Generating Itinerary', status: 'pending' },
  { id: 'packing', label: 'Creating Packing List', status: 'pending' },
  { id: 'pdf', label: 'Creating PDF', status: 'pending' },
  { id: 'save', label: 'Saving Trip', status: 'pending' },
];

export function PlanningProgress() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [steps, setSteps] = useState<Step[]>(AGENT_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [needsInfo, setNeedsInfo] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(extra?: Partial<PlanTripRequest>) {
    const raw = sessionStorage.getItem('tg-pending-trip');
    if (!raw) {
      navigate('/trips/new', { replace: true });
      return;
    }
    const baseReq = JSON.parse(raw) as PlanTripRequest;
    const req = { ...baseReq, ...extra } as PlanTripRequest;

    setSteps(AGENT_STEPS.map((s) => ({ ...s, status: 'pending' })));
    setError(null);
    setNeedsInfo(null);
    setPlan(null);
    setTripId(null);

    const url = await orchestrateUrl();
    const headers = await orchestrateHeaders();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'orchestrate', ...req }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Agent failed to start (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const lines = evt.split('\n');
          let eventType = '';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7);
            else if (line.startsWith('data: ')) dataStr = line.slice(6);
          }
          if (!eventType || !dataStr) continue;
          const data = JSON.parse(dataStr);
          handleEvent(eventType, data, req);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Agent failed';
      setError(msg);
      push({ title: 'Agent failed', description: msg, variant: 'error' });
    }
  }

  function handleEvent(eventType: string, data: Record<string, unknown>, req: PlanTripRequest) {
    if (eventType === 'step') {
      const id = data.id as string;
      const status = data.status as Step['status'];
      const detail = data.detail as unknown;
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          let detailStr: string | undefined;
          if (typeof detail === 'string') detailStr = detail;
          else if (detail && typeof detail === 'object') {
            const d = detail as Record<string, unknown>;
            if ('count' in d) detailStr = `${d.count} found`;
            else if ('days' in d) detailStr = `${d.days} days`;
            else if ('km' in d) detailStr = `${d.km} km route`;
            else if ('items' in d) detailStr = `${d.items} items`;
            else if ('total' in d) detailStr = `$${d.total}`;
            else if ('missing' in d) {
              const m = d.missing as string[];
              detailStr = m.length > 0 ? `${m.length} fields needed` : 'All info collected';
            }
          }
          return { ...s, status, detail: detailStr };
        })
      );
    } else if (eventType === 'needs_info') {
      setNeedsInfo(data.missing_fields as string[]);
    } else if (eventType === 'complete') {
      const completedPlan = data.plan as TripPlan;
      setPlan(completedPlan);
      // Save trip to Supabase
      createTrip({
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
        plan: completedPlan,
      })
        .then((trip) => {
          setTripId(trip.id);
          sessionStorage.removeItem('tg-pending-trip');
          sessionStorage.setItem(`tg-trip-${trip.id}`, JSON.stringify(completedPlan));
          push({ title: 'Trip saved', description: 'Your itinerary is ready.', variant: 'success' });
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : 'Failed to save trip';
          push({ title: 'Save failed', description: msg, variant: 'error' });
        });
    } else if (eventType === 'error') {
      setError(data.message as string);
    }
  }

  function handleRetry() {
    void run();
  }

  function handleSubmitAnswers() {
    const extra: Partial<PlanTripRequest> = {};
    if (needsInfo) {
      for (const field of needsInfo) {
        const val = answers[field];
        if (val) {
          if (field === 'budget') extra.budget = Number(val);
          else if (field === 'start_date') extra.start_date = val;
          else if (field === 'end_date') extra.end_date = val;
          else if (field === 'departure_city') extra.departure_city = val;
          else if (field === 'destination') extra.destination = val;
          else if (field === 'travelers.adults') {
            extra.travelers = { adults: Number(val), children: 0 };
          }
        }
      }
    }
    // Merge into session storage
    const raw = sessionStorage.getItem('tg-pending-trip');
    if (raw) {
      const base = JSON.parse(raw) as PlanTripRequest;
      const merged = { ...base, ...extra };
      sessionStorage.setItem('tg-pending-trip', JSON.stringify(merged));
    }
    void run();
  }

  const allDone = steps.every((s) => s.status === 'done');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <Sparkles className={cn('h-7 w-7', !allDone && !error && 'animate-pulse')} />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">
          {allDone ? 'Your trip is ready' : error ? 'Agent encountered an issue' : 'TravelGenie AI is working'}
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {allDone ? 'All tasks completed successfully.' : 'Autonomously reasoning, calling tools, and assembling your itinerary.'}
        </p>
      </div>

      <Card className="p-6">
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-300',
                  s.status === 'done'
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : s.status === 'active'
                    ? 'border-brand-400 bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300'
                    : s.status === 'error'
                    ? 'border-red-400 bg-red-50 text-red-500 dark:bg-red-900/40'
                    : 'border-ink-200 bg-white text-ink-300 dark:border-ink-700 dark:bg-ink-900/40'
                )}
              >
                {s.status === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : s.status === 'active' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : s.status === 'error' ? (
                  <X className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </span>
              <div className="flex-1">
                <span
                  className={cn(
                    'text-sm transition',
                    s.status === 'done'
                      ? 'text-ink-900 dark:text-ink-100'
                      : s.status === 'active'
                      ? 'font-medium text-ink-900 dark:text-ink-50'
                      : s.status === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-ink-400'
                  )}
                >
                  {s.label}
                </span>
                {s.detail && (
                  <span className="ml-2 text-xs text-ink-400 dark:text-ink-500">{s.detail}</span>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </Card>

      <AnimatePresence>
        {needsInfo && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl border-amber-300 p-5"
          >
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-semibold text-ink-900 dark:text-ink-50">The agent needs more information</p>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                  Please answer these questions so the agent can continue planning:
                </p>
                <div className="mt-4 space-y-3">
                  {needsInfo.map((field) => (
                    <div key={field}>
                      <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">
                        {field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                      <Input
                        type={field.includes('date') ? 'date' : field.includes('budget') || field.includes('adults') ? 'number' : 'text'}
                        placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                        value={answers[field] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <Button className="mt-4" onClick={handleSubmitAnswers} leftIcon={<Sparkles className="h-4 w-4" />}>
                  Continue planning
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
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold text-ink-900 dark:text-ink-50">Agent error</p>
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

        {allDone && plan && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 dark:border-brand-900/40 dark:from-brand-900/20 dark:to-ink-900">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-50">Itinerary generated successfully</p>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    {plan.itinerary?.length ?? 0} days · {plan.budget ? `$${plan.budget.total}` : ''} estimated
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => generateTripPdf(plan, {
                    destination: (JSON.parse(sessionStorage.getItem('tg-pending-trip') ?? '{}') as PlanTripRequest).destination ?? 'Trip',
                    startDate: (JSON.parse(sessionStorage.getItem('tg-pending-trip') ?? '{}') as PlanTripRequest).start_date,
                    endDate: (JSON.parse(sessionStorage.getItem('tg-pending-trip') ?? '{}') as PlanTripRequest).end_date,
                    currency: (JSON.parse(sessionStorage.getItem('tg-pending-trip') ?? '{}') as PlanTripRequest).currency ?? 'USD',
                  })}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Download PDF
                </Button>
                {tripId && (
                  <Button variant="outline" onClick={() => navigate(`/trips/${tripId}`)} leftIcon={<MapPin className="h-4 w-4" />}>
                    View trip
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
