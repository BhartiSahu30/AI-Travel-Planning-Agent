import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CloudSun,
  Hotel,
  Lightbulb,
  MapPin,
  PackageCheck,
  Phone,
  Plane,
  UtensilsCrossed,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import type { TripPlan } from '../types';

export function TripPlanView({ plan, currency }: { plan: TripPlan; currency: string }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/20 dark:to-ink-900/40">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Trip summary</h3>
            <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">{plan.summary}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-brand-600 dark:text-brand-300" />
              <CardTitle>Budget</CardTitle>
            </div>
          </CardHeader>
          <p className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50">
            {formatCurrency(plan.budget?.total ?? 0, plan.budget?.currency ?? currency)}
          </p>
          <div className="mt-4 space-y-2">
            {(plan.budget?.breakdown ?? []).map((b) => (
              <div key={b.category} className="flex items-center justify-between text-sm">
                <span className="text-ink-500 dark:text-ink-400">{b.category}</span>
                <span className="font-medium text-ink-900 dark:text-ink-100">
                  {formatCurrency(b.amount, plan.budget?.currency ?? currency)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Weather */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-accent-500" />
              <CardTitle>Weather forecast</CardTitle>
            </div>
          </CardHeader>
          {(plan.weather ?? []).length === 0 ? (
            <p className="text-sm text-ink-500">No forecast available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(plan.weather ?? []).map((w) => (
                <div key={w.date} className="rounded-xl border border-ink-200/60 bg-white/60 p-3 text-center dark:border-ink-800 dark:bg-ink-900/40">
                  <p className="text-xs text-ink-500">{formatDate(w.date)}</p>
                  <p className="mt-1 text-sm font-medium text-ink-900 dark:text-ink-50">{w.condition}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {w.high}° / {w.low}°
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Transportation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-brand-600 dark:text-brand-300" />
            <CardTitle>Transportation</CardTitle>
          </div>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-400">To destination</p>
            <p className="mt-1 text-sm text-ink-900 dark:text-ink-100">{plan.transportation?.to_destination ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-400">Local</p>
            <p className="mt-1 text-sm text-ink-900 dark:text-ink-100">{plan.transportation?.local ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-400">Estimated cost</p>
            <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-100">
              {formatCurrency(plan.transportation?.estimated_cost ?? 0, currency)}
            </p>
          </div>
        </div>
      </Card>

      {/* Hotels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-brand-600 dark:text-brand-300" />
            <CardTitle>Recommended hotels</CardTitle>
          </div>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {(plan.hotels ?? []).map((h) => (
            <div key={h.name} className="rounded-xl border border-ink-200/60 bg-white/60 p-4 dark:border-ink-800 dark:bg-ink-900/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-50">{h.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                    <MapPin className="h-3 w-3" /> {h.area}
                  </p>
                </div>
                <Badge variant="brand">
                  <Star className="h-3 w-3 fill-current" /> {h.rating}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{h.reason}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                  {formatCurrency(h.price_per_night, currency)} <span className="text-xs font-normal text-ink-400">/ night</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {(h.amenities ?? []).slice(0, 3).map((a) => (
                    <Badge key={a}>{a}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Restaurants */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-accent-500" />
            <CardTitle>Recommended restaurants</CardTitle>
          </div>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {(plan.restaurants ?? []).map((r) => (
            <div key={r.name} className="flex items-start justify-between gap-3 rounded-xl border border-ink-200/60 bg-white/60 p-4 dark:border-ink-800 dark:bg-ink-900/40">
              <div>
                <p className="font-semibold text-ink-900 dark:text-ink-50">{r.name}</p>
                <p className="text-xs text-ink-500">{r.cuisine} · {'$'.repeat(r.price_level || 1)}</p>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{r.reason}</p>
              </div>
              <Badge variant="accent">
                <Star className="h-3 w-3 fill-current" /> {r.rating}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Attractions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-600 dark:text-brand-300" />
            <CardTitle>Top attractions</CardTitle>
          </div>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(plan.attractions ?? []).map((a) => (
            <div key={a.name} className="rounded-xl border border-ink-200/60 bg-white/60 p-4 dark:border-ink-800 dark:bg-ink-900/40">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink-900 dark:text-ink-50">{a.name}</p>
                <Badge>{a.category}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{a.reason}</p>
              <p className="mt-2 text-xs text-ink-400">{a.duration_hours}h · ★ {a.rating}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Itinerary timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Day-by-day itinerary</CardTitle>
          <CardDescription>{(plan.itinerary ?? []).length} days of adventure.</CardDescription>
        </CardHeader>
        <ItineraryTimeline itinerary={plan.itinerary ?? []} />
      </Card>

      {/* Packing + Tips + Emergency */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PackingChecklist packing={plan.packing ?? []} />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent-500" />
                <CardTitle>Travel tips</CardTitle>
              </div>
            </CardHeader>
            <ul className="space-y-2">
              {(plan.tips ?? []).map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-red-500" />
                <CardTitle>Emergency contacts</CardTitle>
              </div>
            </CardHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase text-ink-400">Police</p>
                <p className="text-ink-900 dark:text-ink-100">{plan.emergency?.police ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-ink-400">Ambulance</p>
                <p className="text-ink-900 dark:text-ink-100">{plan.emergency?.ambulance ?? '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase text-ink-400">Embassy</p>
                <p className="text-ink-900 dark:text-ink-100">{plan.emergency?.embassy ?? '—'}</p>
              </div>
              {plan.emergency?.notes && (
                <div className="col-span-2">
                  <p className="text-xs uppercase text-ink-400">Notes</p>
                  <p className="text-ink-900 dark:text-ink-100">{plan.emergency.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ItineraryTimeline({ itinerary }: { itinerary: TripPlan['itinerary'] }) {
  const [openDay, setOpenDay] = useState(0);
  return (
    <div className="space-y-3">
      {itinerary.map((d, i) => {
        const open = openDay === i;
        return (
          <div key={d.day} className="overflow-hidden rounded-xl border border-ink-200/60 dark:border-ink-800">
            <button
              onClick={() => setOpenDay(open ? -1 : i)}
              className="flex w-full items-center justify-between gap-3 bg-white/60 px-4 py-3 text-left transition hover:bg-white dark:bg-ink-900/40 dark:hover:bg-ink-900/70"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  {d.day}
                </span>
                <div>
                  <p className="font-semibold text-ink-900 dark:text-ink-50">{d.title}</p>
                  <p className="text-xs text-ink-500">{formatDate(d.date)}</p>
                </div>
              </div>
              <Badge>{d.activities?.length ?? 0} activities</Badge>
            </button>
            <motion.div
              initial={false}
              animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-ink-200/60 px-4 py-3 dark:border-ink-800">
                <p className="mb-3 text-sm text-ink-600 dark:text-ink-300">{d.summary}</p>
                <ol className="relative space-y-3 border-l-2 border-brand-200 pl-4 dark:border-brand-900">
                  {(d.activities ?? []).map((a, j) => (
                    <li key={j} className="relative">
                      <span className={cn(
                        'absolute -left-[1.32rem] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-900/40'
                      )} />
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{a.title}</p>
                        <span className="text-xs text-ink-400">{a.time}</span>
                      </div>
                      {a.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                          <MapPin className="h-3 w-3" /> {a.location}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{a.description}</p>
                      {a.duration_hours > 0 && (
                        <p className="mt-1 text-xs text-ink-400">{a.duration_hours}h</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function PackingChecklist({ packing }: { packing: TripPlan['packing'] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  const totalItems = packing.reduce((n, c) => n + (c.items?.length ?? 0), 0);
  const packed = checked.size;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-brand-600 dark:text-brand-300" />
          <CardTitle>Packing checklist</CardTitle>
        </div>
        <Badge variant={packed === totalItems && totalItems > 0 ? 'success' : 'default'}>
          {packed}/{totalItems}
        </Badge>
      </CardHeader>
      <div className="space-y-4">
        {packing.map((cat) => (
          <div key={cat.category}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{cat.category}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(cat.items ?? []).map((item) => {
                const key = `${cat.category}:${item}`;
                const isOn = checked.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className="flex items-center gap-2.5 rounded-lg border border-ink-200/60 bg-white/60 px-3 py-2 text-left text-sm transition hover:border-brand-400 dark:border-ink-800 dark:bg-ink-900/40"
                  >
                    <span
                      className={cn(
                        'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
                        isOn ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 dark:border-ink-600'
                      )}
                    >
                      {isOn && <Star className="h-3 w-3 fill-current" />}
                    </span>
                    <span className={cn(isOn ? 'text-ink-400 line-through' : 'text-ink-800 dark:text-ink-100')}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
