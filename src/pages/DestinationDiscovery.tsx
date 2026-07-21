import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudSun,
  Droplets,
  Hotel as HotelIcon,
  ImageOff,
  Map as MapIcon,
  MapPin,
  Navigation,
  Plane,
  Search,
  Sparkles,
  Umbrella,
  Utensils,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { MapView, type MapMarker } from '../components/MapView';
import { discoverDestination } from '../lib/api';
import { formatDate } from '../lib/utils';
import type { DiscoveryResponse, LocalFood, FamousPlace, Recommendation, PlaceCategory } from '../types';
import { RecommendationCard } from '../components/RecommendationCard';
import { CATEGORY_LEGEND } from '../components/MapView';

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof MapPin; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">{title}</h2>
        {subtitle && <p className="text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function FoodCard({ food, index }: { food: LocalFood; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card hover className="h-full p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-ink-900 dark:text-ink-50">{food.name}</h3>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{food.description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function FamousPlaceCard({ place, index }: { place: FamousPlace; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card hover className="h-full p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-ink-900 dark:text-ink-50">{place.name}</h3>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{place.description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}

function PlaceGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-64 w-full" />
      ))}
    </div>
  );
}

function FoodGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function DestinationDiscovery() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const dest = query.trim();
    if (!dest) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await discoverDestination(dest);
      if (res.error) setError(res.error);
      else setData(res);
    } catch {
      setError('Failed to load destination data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const recommendations: Recommendation[] = data?.recommendations ?? [];

  const mapMarkers: MapMarker[] = useMemo(() => {
    if (!data) return [];
    return (data.recommendations ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lon: r.lon,
      category: r.category as PlaceCategory,
      subtitle: r.description?.slice(0, 60),
      image: r.image,
      address: r.address,
    }));
  }, [data]);

  const hasPlaces = recommendations.length > 0;

  // Group recommendations by category for section display
  const byCategory = useMemo(() => {
    const m = new Map<PlaceCategory, Recommendation[]>();
    for (const r of recommendations) {
      const list = m.get(r.category) ?? [];
      list.push(r);
      m.set(r.category, list);
    }
    return m;
  }, [recommendations]);

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Destination Discovery</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Explore any city with real photos, attractions, hotels, restaurants, local foods, and an AI itinerary.
        </p>
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a destination (e.g. Tokyo, Paris, Bali)..."
              className="h-11 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-4 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
            />
          </div>
          <Button type="submit" loading={loading} leftIcon={!loading ? <Navigation className="h-4 w-4" /> : undefined}>
            Explore
          </Button>
        </form>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <div>
              <SectionTitle icon={ImageOff} title="Destination Gallery" />
              <GallerySkeleton />
            </div>
            <div>
              <SectionTitle icon={Sparkles} title="Famous Places" />
              <FoodGridSkeleton />
            </div>
            <div>
              <SectionTitle icon={HotelIcon} title="Hotels" />
              <PlaceGridSkeleton />
            </div>
          </motion.div>
        )}

        {data && !loading && (
          <motion.div key={`results-${data.destination}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
            {/* Hero banner */}
            {data.hero_image ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative h-72 overflow-hidden rounded-2xl sm:h-80"
              >
                <img src={data.hero_image} alt={data.destination} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 sm:p-8">
                  <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{data.destination}</h1>
                  <p className="mt-1 text-sm text-white/80">Discover what makes this destination special</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 sm:h-56"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 sm:p-8">
                  <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{data.destination}</h1>
                  <p className="mt-1 text-sm text-white/80">Discover what makes this destination special</p>
                </div>
              </motion.div>
            )}

            {/* Destination Gallery */}
            <section>
              <SectionTitle icon={ImageOff} title="Destination Gallery" subtitle="Real photos from Unsplash & Wikimedia Commons" />
              {data.gallery_empty || data.gallery.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 py-12 text-center dark:border-ink-700">
                  <ImageOff className="h-10 w-10 text-ink-400" />
                  <p className="mt-3 text-sm font-medium text-ink-600 dark:text-ink-300">No destination images found</p>
                  <p className="mt-1 text-xs text-ink-400">We couldn't find photos for "{data.destination}". Try a more specific destination name.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {data.gallery.slice(0, 8).map((img, i) => (
                    <motion.div
                      key={`${data.destination}-${img.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="group relative overflow-hidden rounded-xl"
                    >
                      <img
                        src={img.url}
                        alt={img.alt}
                        loading="lazy"
                        className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                      <p className="absolute bottom-2 left-2 text-xs text-white/0 transition group-hover:text-white/80">
                        by {img.credit}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Famous Places (AI) */}
            {data.famous_places.length > 0 && (
              <section>
                <SectionTitle icon={Sparkles} title="Famous Places" subtitle="AI-curated must-visit spots" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.famous_places.map((p, i) => (
                    <FamousPlaceCard key={p.name} place={p} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Local Foods (AI) */}
            {data.local_foods.length > 0 && (
              <section>
                <SectionTitle icon={Utensils} title="Local Foods" subtitle="Must-try dishes, curated by AI" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.local_foods.map((f, i) => (
                    <FoodCard key={f.name} food={f} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations by category */}
            {recommendations.length > 0 && (
              <section>
                <SectionTitle icon={Sparkles} title="Recommendations" subtitle="Real places from Geoapify with photos, maps & directions" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendations.slice(0, 12).map((rec, i) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                    >
                      <RecommendationCard rec={rec} userLocation={data.map_center} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Weather */}
            {data.weather.length > 0 && (
              <section>
                <SectionTitle icon={CloudSun} title="Weather" subtitle="5-day forecast from OpenWeather" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {data.weather.map((w, i) => (
                    <motion.div
                      key={w.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-ink-200/60 bg-white/60 p-3 text-center dark:border-ink-800 dark:bg-ink-900/40"
                    >
                      <p className="text-xs text-ink-500">{formatDate(w.date)}</p>
                      {w.icon && (
                        <img src={`https://openweathermap.org/img/wn/${w.icon}@2x.png`} alt={w.condition} className="mx-auto mt-1 h-12 w-12" loading="lazy" />
                      )}
                      <p className="mt-1 text-sm font-medium text-ink-900 dark:text-ink-50">{w.condition}</p>
                      <p className="mt-1 text-xs text-ink-500">{w.high}° / {w.low}°</p>
                      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                        <span className="flex items-center gap-0.5" title="Humidity"><Droplets className="h-3 w-3" /> {w.humidity}%</span>
                        <span className="flex items-center gap-0.5" title="Rain probability"><Umbrella className="h-3 w-3" /> {w.rain_probability}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Interactive Map */}
            {data.map_center && hasPlaces && (
              <section>
                <SectionTitle icon={MapIcon} title="All Recommendations on Map" subtitle="Click markers for details" />
                <Card>
                  <MapView center={data.map_center} markers={mapMarkers} height="450px" />
                  <div className="mt-3 flex flex-wrap gap-4 px-1 pb-1 text-xs text-ink-500 dark:text-ink-400">
                    {CATEGORY_LEGEND.map((l) => {
                      const has = byCategory.has(l.category);
                      if (!has) return null;
                      return (
                        <span key={l.category} className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full" style={{ background: l.color }} /> {l.label}
                        </span>
                      );
                    })}
                  </div>
                </Card>
              </section>
            )}

            {/* AI Itinerary CTA */}
            <section>
              <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 to-white dark:border-brand-900/40 dark:from-brand-900/20 dark:to-ink-900">
                <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-white">
                    <Plane className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">Ready to plan your trip to {data.destination}?</h2>
                    <p className="text-sm text-ink-600 dark:text-ink-300">Let TravelGenie AI build a personalized day-by-day itinerary with budget, packing list, and tips.</p>
                  </div>
                  <Button onClick={() => { window.location.href = `/trips/new?destination=${encodeURIComponent(data.destination)}`; }} leftIcon={<Sparkles className="h-4 w-4" />}>
                    Plan this trip
                  </Button>
                </div>
              </Card>
            </section>
          </motion.div>
        )}

        {!loading && !data && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
              <Search className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-medium text-ink-900 dark:text-ink-50">Search a destination to begin</p>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Try Tokyo, Paris, Bali, New York, or anywhere else.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
