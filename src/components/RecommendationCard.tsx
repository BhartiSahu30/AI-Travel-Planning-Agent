import { memo } from 'react';
import {
  Clock,
  MapPin,
  Navigation,
  Star,
  ExternalLink,
  Hotel,
  UtensilsCrossed,
  Landmark,
  Coffee,
  Mountain,
  ImageOff,
} from 'lucide-react';
import type { Recommendation, PlaceCategory } from '../types';
import { Badge } from './ui/Badge';

const categoryConfig: Record<PlaceCategory, { icon: typeof Hotel; label: string; color: string; badgeVariant: 'brand' | 'accent' | 'success' | 'default' }> = {
  hotel: { icon: Hotel, label: 'Hotel', color: 'text-blue-600', badgeVariant: 'brand' },
  restaurant: { icon: UtensilsCrossed, label: 'Restaurant', color: 'text-amber-600', badgeVariant: 'accent' },
  attraction: { icon: Landmark, label: 'Attraction', color: 'text-emerald-600', badgeVariant: 'success' },
  cafe: { icon: Coffee, label: 'Café', color: 'text-orange-600', badgeVariant: 'default' },
  activity: { icon: Mountain, label: 'Activity', color: 'text-purple-600', badgeVariant: 'default' },
};

function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

function directionsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

function openMapsUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=16`;
}

export const RecommendationCard = memo(function RecommendationCard({
  rec,
  userLocation,
}: {
  rec: Recommendation;
  userLocation?: { lat: number; lon: number } | null;
}) {
  const config = categoryConfig[rec.category] ?? categoryConfig.attraction;
  const Icon = config.icon;
  const hasCoords = typeof rec.lat === 'number' && typeof rec.lon === 'number';
  const distanceFromUser = hasCoords && userLocation
    ? Math.round(haversineKm(userLocation.lat, userLocation.lon, rec.lat, rec.lon) * 10) / 10
    : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-ink-200/60 bg-white shadow-sm transition hover:shadow-md dark:border-ink-800 dark:bg-ink-900/60">
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-ink-100 dark:bg-ink-800">
        {rec.image ? (
          <img
            src={rec.image}
            alt={rec.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300 dark:text-ink-700">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={config.badgeVariant} className="shadow-sm">
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>
        {rec.rating != null && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-ink-900 shadow-sm dark:bg-ink-900/90 dark:text-ink-50">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {rec.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-semibold text-ink-900 dark:text-ink-50">{rec.name}</h4>

        {rec.address && (
          <p className="mt-1 flex items-start gap-1 text-xs text-ink-500 dark:text-ink-400">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">{rec.address}</span>
          </p>
        )}

        {rec.description && (
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300 line-clamp-2">{rec.description}</p>
        )}

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
          {rec.distance_km != null && (
            <span className="flex items-center gap-0.5">
              <Navigation className="h-3 w-3" />
              {rec.distance_km} km away
            </span>
          )}
          {distanceFromUser != null && (
            <span className="flex items-center gap-0.5">
              <Navigation className="h-3 w-3" />
              {distanceFromUser} km from you
            </span>
          )}
          {rec.price_range && (
            <span className="font-medium text-ink-700 dark:text-ink-200">{rec.price_range}</span>
          )}
          {rec.opening_hours && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              <span className="line-clamp-1">{rec.opening_hours}</span>
            </span>
          )}
        </div>

        {/* Action buttons */}
        {hasCoords && (
          <div className="mt-3 flex flex-wrap gap-2 pt-2">
            <a
              href={openMapsUrl(rec.lat, rec.lon)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50"
            >
              <MapPin className="h-3 w-3" /> View on Map
            </a>
            <a
              href={directionsUrl(rec.lat, rec.lon)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-accent-50 px-2.5 py-1.5 text-xs font-medium text-accent-700 transition hover:bg-accent-100 dark:bg-accent-900/30 dark:text-accent-300 dark:hover:bg-accent-900/50"
            >
              <Navigation className="h-3 w-3" /> Directions
            </a>
            <a
              href={googleMapsUrl(rec.lat, rec.lon)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-ink-100 px-2.5 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
            >
              <ExternalLink className="h-3 w-3" /> Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
