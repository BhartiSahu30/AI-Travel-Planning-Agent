import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { PlaceCategory } from '../types';

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: PlaceCategory;
  subtitle?: string;
  image?: string | null;
  address?: string;
}

interface MapViewProps {
  center: { lat: number; lon: number };
  markers: MapMarker[];
  height?: string;
}

const COLORS: Record<PlaceCategory, string> = {
  hotel: '#2563eb',
  restaurant: '#f59e0b',
  attraction: '#10b981',
  cafe: '#ea580c',
  activity: '#7c3aed',
};

function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'tg-marker',
    html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);transform:rotate(-45deg)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -16],
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildPopup(m: MapMarker): string {
  const img = m.image
    ? `<img src="${escapeHtml(m.image)}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px" onerror="this.style.display='none'"/>`
    : '';
  const addr = m.address
    ? `<span style="font-size:11px;color:#64748b;display:block;margin-top:2px">${escapeHtml(m.address)}</span>`
    : '';
  const subtitle = m.subtitle
    ? `<span style="font-size:11px;color:#64748b;display:block">${escapeHtml(m.subtitle)}</span>`
    : '';
  return `<div style="min-width:180px;max-width:220px">${img}<strong style="font-size:13px">${escapeHtml(m.name)}</strong>${subtitle}${addr}<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name)}&query_place_id=${m.lat},${m.lon}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;font-size:11px;color:#2563eb;text-decoration:none">View on Google Maps →</a></div>`;
}

export function MapView({ center, markers, height = '380px' }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lon],
      zoom: 12,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when they change
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    for (const m of markers) {
      if (typeof m.lat !== 'number' || typeof m.lon !== 'number') continue;
      const color = COLORS[m.category] ?? COLORS.attraction;
      const icon = makeIcon(color);
      const marker = L.marker([m.lat, m.lon], { icon }).addTo(layer);
      marker.bindPopup(buildPopup(m), { maxWidth: 240 });
      bounds.push([m.lat, m.lon]);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.2), { maxZoom: 14 });
    } else {
      map.setView([center.lat, center.lon], 12);
    }
  }, [markers, center.lat, center.lon]);

  return <div ref={containerRef} style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }} />;
}

export const CATEGORY_LEGEND: { category: PlaceCategory; label: string; color: string }[] = [
  { category: 'hotel', label: 'Hotels', color: COLORS.hotel },
  { category: 'restaurant', label: 'Restaurants', color: COLORS.restaurant },
  { category: 'attraction', label: 'Attractions', color: COLORS.attraction },
  { category: 'cafe', label: 'Cafés', color: COLORS.cafe },
  { category: 'activity', label: 'Activities', color: COLORS.activity },
];
