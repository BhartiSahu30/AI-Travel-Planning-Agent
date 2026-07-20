import { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: 'hotel' | 'restaurant' | 'attraction';
  subtitle?: string;
}

interface MapViewProps {
  center: { lat: number; lon: number };
  markers: MapMarker[];
  height?: string;
}

const COLORS: Record<MapMarker['category'], string> = {
  hotel: '#2563eb',
  restaurant: '#f59e0b',
  attraction: '#10b981',
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
      const icon = makeIcon(COLORS[m.category]);
      const marker = L.marker([m.lat, m.lon], { icon }).addTo(layer);
      const subtitle = m.subtitle ? `<br/><span style="font-size:11px;color:#64748b">${m.subtitle}</span>` : '';
      marker.bindPopup(`<strong>${m.name}</strong>${subtitle}`);
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
