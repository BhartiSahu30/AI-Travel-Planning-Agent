export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  language: string;
  travel_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  ai_model: string;
  created_at: string;
  updated_at: string;
}

export interface Travelers {
  adults: number;
  children: number;
}

export interface TripPreferences {
  hotel?: string;
  transport?: string;
  food?: string;
  accessibility?: string;
  interests?: string[];
  notes?: string;
}

export type PlaceCategory = 'hotel' | 'restaurant' | 'attraction' | 'activity' | 'cafe';

export interface Recommendation {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  lat: number;
  lon: number;
  rating: number | null;
  image: string | null;
  description: string;
  price_range: string | null;
  opening_hours: string | null;
  distance_km: number | null;
  source: 'geoapify' | 'ai';
}

export interface Trip {
  id: string;
  user_id: string;
  title: string | null;
  departure_city: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  currency: string;
  travelers: Travelers;
  style: string | null;
  preferences: TripPreferences;
  status: 'planned' | 'saved' | 'archived';
  plan: TripPlan | null;
  created_at: string;
  updated_at: string;
}

export interface TripPlan {
  summary: string;
  budget: {
    currency: string;
    total: number;
    breakdown: { category: string; amount: number }[];
  };
  weather: {
    date: string;
    condition: string;
    high: number;
    low: number;
    humidity: number;
    rain_probability: number;
    icon: string;
  }[];
  map_center?: { lat: number; lon: number };
  recommendations: Recommendation[];
  transportation: {
    to_destination: string;
    local: string;
    estimated_cost: number;
    route_km?: number;
    route_stops?: number;
  };
  packing: { category: string; items: string[] }[];
  itinerary: {
    day: number;
    date: string;
    title: string;
    summary: string;
    activities: {
      time: string;
      title: string;
      description: string;
      location: string;
      duration_hours: number;
      recommendation_id?: string;
    }[];
  }[];
  tips: string[];
  emergency: {
    police: string;
    ambulance: string;
    embassy: string;
    notes: string;
  };
}

export interface PlanTripRequest {
  departure_city?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  travelers?: Travelers;
  style?: string;
  preferences?: TripPreferences;
}

export interface PlanTripResponse {
  needs_more_info: boolean;
  missing_fields?: string[];
  questions?: string[];
  message?: string;
  plan?: TripPlan;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DiscoveryGalleryImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  credit: string;
}

export interface LocalFood {
  name: string;
  description: string;
}

export interface FamousPlace {
  name: string;
  description: string;
}

export interface DiscoveryResponse {
  destination: string;
  hero_image: string;
  gallery: DiscoveryGalleryImage[];
  gallery_empty: boolean;
  famous_places: FamousPlace[];
  local_foods: LocalFood[];
  recommendations: Recommendation[];
  weather: {
    date: string;
    condition: string;
    high: number;
    low: number;
    humidity: number;
    rain_probability: number;
    icon: string;
  }[];
  map_center: { lat: number; lon: number } | null;
  error?: string;
}
