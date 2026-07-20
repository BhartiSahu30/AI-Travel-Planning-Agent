import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY") ?? "";
const GEOAPIFY_API_KEY = Deno.env.get("GEOAPIFY_API_KEY") ?? "";
const UNSPLASH_API_KEY = Deno.env.get("UNSPLASH_API_KEY") ?? "";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80";
const DEFAULT_PLACE_IMAGE =
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80";
// Model: gemini-3.5-flash (current stable; gemini-2.5-flash is deprecated for new users)
const GEMINI_MODEL = "gemini-3.5-flash";

const SYSTEM_PROMPT = `You are TravelGenie AI.
You are an autonomous travel planning agent.
Never immediately generate an itinerary.
First determine if enough information exists.
If information is missing, ask follow-up questions.
After all required information is collected:
Use tools.
Analyze weather.
Estimate costs.
Optimize routes.
Recommend hotels.
Recommend attractions.
Recommend restaurants.
Generate a realistic itinerary.
Create a packing list.
Return everything in structured JSON.`;

interface TripRequest {
  departure_city?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  travelers?: { adults?: number; children?: number };
  style?: string;
  preferences?: {
    hotel?: string;
    transport?: string;
    food?: string;
    accessibility?: string;
    interests?: string[];
    notes?: string;
  };
  history?: { role: "user" | "assistant"; content: string }[];
}

interface LiveWeatherDay {
  date: string;
  condition: string;
  high: number;
  low: number;
  humidity: number;
  rain_probability: number;
  icon: string;
}

interface GeoPoint {
  lat: number;
  lon: number;
}

interface GeoapifyPlace {
  name: string;
  lat?: number;
  lon?: number;
  categories?: string[];
  datasource?: { raw?: Record<string, unknown> };
}

const REQUIRED_FIELDS: (keyof TripRequest)[] = [
  "departure_city",
  "destination",
  "start_date",
  "end_date",
  "budget",
];

function missingFields(req: TripRequest): string[] {
  const missing: string[] = [];
  for (const f of REQUIRED_FIELDS) {
    const v = req[f];
    if (v === undefined || v === null || v === "") missing.push(f);
  }
  if (!req.travelers || !req.travelers.adults) missing.push("travelers.adults");
  return missing;
}

function buildUserPrompt(req: TripRequest, liveWeather?: LiveWeatherDay[]): string {
  const prefs = req.preferences ?? {};
  const travelers = req.travelers ?? {};
  const weatherSection = liveWeather && liveWeather.length > 0
    ? `\n\nLIVE WEATHER FORECAST (use this exact data for the weather field — do not invent your own):\n${JSON.stringify(liveWeather, null, 2)}\n`
    : "";
  return `Plan a trip with the following details:
- Departure city: ${req.departure_city ?? "not specified"}
- Destination: ${req.destination ?? "not specified"}
- Dates: ${req.start_date ?? "?"} to ${req.end_date ?? "?"}
- Budget: ${req.budget ?? "?"} ${req.currency ?? "USD"}
- Travelers: ${travelers.adults ?? 1} adults, ${travelers.children ?? 0} children
- Travel style: ${req.style ?? "balanced"}
- Hotel preference: ${prefs.hotel ?? "any"}
- Transport preference: ${prefs.transport ?? "any"}
- Food preference: ${prefs.food ?? "any"}
- Accessibility needs: ${prefs.accessibility ?? "none"}
- Interests: ${(prefs.interests ?? []).join(", ") || "general"}
- Special notes: ${prefs.notes ?? "none"}${weatherSection}

Return ONLY a valid JSON object with this exact shape:
{
  "summary": "short overview of the trip",
  "budget": {
    "currency": "USD",
    "total": 0,
    "breakdown": [{ "category": "Flights", "amount": 0 }, { "category": "Hotels", "amount": 0 }, { "category": "Food", "amount": 0 }, { "category": "Transport", "amount": 0 }, { "category": "Activities", "amount": 0 }, { "category": "Misc", "amount": 0 }]
  },
  "weather": [{ "date": "YYYY-MM-DD", "condition": "Sunny", "high": 0, "low": 0, "humidity": 0, "rain_probability": 0, "icon": "01d" }],
  "hotels": [{ "name": "", "price_per_night": 0, "rating": 0, "area": "", "reason": "", "amenities": [] }],
  "restaurants": [{ "name": "", "cuisine": "", "price_level": 1, "rating": 0, "reason": "" }],
  "attractions": [{ "name": "", "category": "", "duration_hours": 0, "rating": 0, "reason": "" }],
  "transportation": { "to_destination": "", "local": "", "estimated_cost": 0 },
  "packing": [{ "category": "Clothing", "items": [] }, { "category": "Essentials", "items": [] }, { "category": "Documents", "items": [] }],
  "itinerary": [{ "day": 1, "date": "YYYY-MM-DD", "title": "", "summary": "", "activities": [{ "time": "09:00", "title": "", "description": "", "location": "", "duration_hours": 0 }] }],
  "tips": ["short travel tip"],
  "emergency": { "police": "", "ambulance": "", "embassy": "", "notes": "" }
}

For the weather field, copy the LIVE WEATHER FORECAST data exactly (including humidity, rain_probability, and icon). Do not include markdown fences or any text outside the JSON.`;
}

function getGeminiClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Add it as a secret to this Supabase project.");
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

async function callGemini(prompt: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });
  const text = response.text ?? "";
  if (!text) throw new Error("Gemini returned no content");
  return text;
}

function tryParseJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
    throw new Error("Could not parse JSON from Gemini response");
  }
}

// ---- OpenWeather integration ----

function toDateString(dt: number): string {
  return new Date(dt * 1000).toISOString().slice(0, 10);
}

function tripDates(start?: string, end?: string): string[] {
  if (!start || !end) return [];
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return [];
  const dates: string[] = [];
  const cur = new Date(s);
  // Cap to 5 days (OpenWeather free tier covers 5 days forecast)
  let count = 0;
  while (cur <= e && count < 5) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
    count++;
  }
  return dates;
}

async function fetchLiveWeather(destination: string, start?: string, end?: string): Promise<LiveWeatherDay[]> {
  if (!OPENWEATHER_API_KEY) return [];
  if (!destination) return [];

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(destination)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenWeather API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const list: Array<Record<string, unknown>> = data?.list ?? [];

  // Aggregate 3-hour entries into daily summaries
  const byDate = new Map<string, {
    highs: number[];
    lows: number[];
    humidities: number[];
    pops: number[];
    conditions: Record<string, number>;
    icons: Record<string, number>;
  }>();

  for (const entry of list) {
    const dt = entry.dt as number;
    if (!dt) continue;
    const date = toDateString(dt);
    const main = entry.main as { temp_max?: number; temp_min?: number; humidity?: number } | undefined;
    const weather = entry.weather as Array<{ main?: string; icon?: string }> | undefined;
    const pop = (entry.pop as number) ?? 0;

    let bucket = byDate.get(date);
    if (!bucket) {
      bucket = { highs: [], lows: [], humidities: [], pops: [], conditions: {}, icons: {} };
      byDate.set(date, bucket);
    }
    if (typeof main?.temp_max === "number") bucket.highs.push(main.temp_max);
    if (typeof main?.temp_min === "number") bucket.lows.push(main.temp_min);
    if (typeof main?.humidity === "number") bucket.humidities.push(main.humidity);
    bucket.pops.push(pop);
    const cond = weather?.[0]?.main ?? "Unknown";
    bucket.conditions[cond] = (bucket.conditions[cond] ?? 0) + 1;
    const icon = weather?.[0]?.icon ?? "01d";
    bucket.icons[icon] = (bucket.icons[icon] ?? 0) + 1;
  }

  function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }
  function maxByCount(rec: Record<string, number>): string {
    let best = "";
    let bestN = -1;
    for (const [k, n] of Object.entries(rec)) {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    return best;
  }

  const wanted = tripDates(start, end);
  const allDates = Array.from(byDate.keys()).sort();
  const targetDates = wanted.length > 0 ? wanted : allDates.slice(0, 5);

  const result: LiveWeatherDay[] = [];
  for (const date of targetDates) {
    const b = byDate.get(date);
    if (!b) continue;
    result.push({
      date,
      condition: maxByCount(b.conditions),
      high: b.highs.length ? Math.round(Math.max(...b.highs)) : 0,
      low: b.lows.length ? Math.round(Math.min(...b.lows)) : 0,
      humidity: avg(b.humidities),
      rain_probability: Math.round(Math.max(...b.pops, 0) * 100),
      icon: maxByCount(b.icons),
    });
  }
  return result;
}

// ---- Nominatim geocoding (OpenStreetMap) ----

async function geocode(query: string): Promise<GeoPoint | null> {
  if (!query) return null;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "TravelGenie/1.0 (trip planner)",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = parseFloat(data[0].lat ?? "");
  const lon = parseFloat(data[0].lon ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return { lat, lon };
}

// ---- Geoapify Places API ----

interface GeoapifyResult {
  properties: {
    name?: string;
    categories?: Record<string, string>;
    datasource?: { raw?: Record<string, unknown> };
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

async function fetchGeoapifyPlaces(
  center: GeoPoint,
  categories: string,
  limit: number
): Promise<GeoapifyResult[]> {
  if (!GEOAPIFY_API_KEY) return [];
  const radius = 10000; // 10km
  const url = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(categories)}&filter=circle:${center.lon},${center.lat},${radius}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Geoapify Places error ${res.status} for categories=${categories}`);
    return [];
  }
  const data = await res.json();
  return (data?.features ?? []) as GeoapifyResult[];
}

function enrichPlaces(
  planPlaces: Array<{ name: string; lat?: number; lon?: number }>,
  geoPlaces: GeoapifyResult[],
  maxN: number
): void {
  // Match by name (case-insensitive substring); fill in lat/lon where missing.
  const used = new Set<number>();
  for (const p of planPlaces) {
    if (p.lat !== undefined && p.lon !== undefined) continue;
    const nameLower = p.name.toLowerCase().trim();
    let matchedIdx = -1;
    for (let i = 0; i < geoPlaces.length; i++) {
      if (used.has(i)) continue;
      const gName = (geoPlaces[i].properties.name ?? "").toLowerCase().trim();
      if (gName && (gName === nameLower || gName.includes(nameLower) || nameLower.includes(gName))) {
        matchedIdx = i;
        break;
      }
    }
    if (matchedIdx >= 0) {
      used.add(matchedIdx);
      const [lon, lat] = geoPlaces[matchedIdx].geometry.coordinates;
      p.lat = lat;
      p.lon = lon;
    }
  }
  // If no name match, assign nearest unused Geoapify results to places missing coords (up to maxN)
  let geoIdx = 0;
  for (const p of planPlaces) {
    if (p.lat !== undefined && p.lon !== undefined) continue;
    if (geoIdx >= maxN) break;
    while (geoIdx < geoPlaces.length && used.has(geoIdx)) geoIdx++;
    if (geoIdx >= geoPlaces.length) break;
    used.add(geoIdx);
    const [lon, lat] = geoPlaces[geoIdx].geometry.coordinates;
    p.lat = lat;
    p.lon = lon;
    geoIdx++;
  }
}

async function enrichPlanWithPlaces(
  plan: Record<string, unknown>,
  destination: string
): Promise<void> {
  let center: GeoPoint | null = null;
  try {
    center = await geocode(destination);
  } catch (e) {
    console.warn("Nominatim geocode failed:", e instanceof Error ? e.message : e);
  }
  if (!center) return;

  (plan as { map_center?: GeoPoint }).map_center = center;

  const hotels = (plan.hotels ?? []) as Array<{ name: string; lat?: number; lon?: number }>;
  const restaurants = (plan.restaurants ?? []) as Array<{ name: string; lat?: number; lon?: number }>;
  const attractions = (plan.attractions ?? []) as Array<{ name: string; lat?: number; lon?: number }>;

  if (GEOAPIFY_API_KEY) {
    // Fetch all three categories in parallel from Geoapify Places (non-fatal)
    const [hotelPlaces, restPlaces, attractPlaces] = await Promise.all([
      fetchGeoapifyPlaces(center, "accommodation", 10).catch(() => []),
      fetchGeoapifyPlaces(center, "catering", 10).catch(() => []),
      fetchGeoapifyPlaces(center, "tourism", 10).catch(() => []),
    ]);

    enrichPlaces(hotels, hotelPlaces, 5);
    enrichPlaces(restaurants, restPlaces, 5);
    enrichPlaces(attractions, attractPlaces, 5);
  }

  // Fallback: geocode up to 3 places per category via Nominatim if still missing coords.
  // Nominatim policy requires end-user-triggered, moderate use — we cap requests and
  // only fill gaps so the map isn't empty when Geoapify is unavailable.
  await fillMissingCoords(hotels, destination, 3);
  await fillMissingCoords(restaurants, destination, 3);
  await fillMissingCoords(attractions, destination, 3);
}

async function fillMissingCoords(
  places: Array<{ name: string; lat?: number; lon?: number }>,
  destination: string,
  maxN: number
): Promise<void> {
  let filled = 0;
  for (const p of places) {
    if (filled >= maxN) break;
    if (p.lat !== undefined && p.lon !== undefined) continue;
    const query = `${p.name}, ${destination}`;
    try {
      const pt = await geocode(query);
      if (pt) {
        p.lat = pt.lat;
        p.lon = pt.lon;
        filled++;
      }
    } catch {
      /* skip */
    }
  }
}

// ---- Unsplash images ----

interface UnsplashImage {
  id: string;
  urls: { regular: string; small: string; full: string };
  alt_description: string | null;
  user: { name: string };
  links?: { html?: string };
}

async function fetchUnsplashImages(query: string, perPage: number): Promise<UnsplashImage[]> {
  if (!UNSPLASH_API_KEY) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_API_KEY}`,
      "Accept-Version": "v1",
    },
  });
  if (!res.ok) {
    console.warn(`Unsplash error ${res.status}`);
    return [];
  }
  const data = await res.json();
  return (data?.results ?? []) as UnsplashImage[];
}

function defaultGallery(destination: string): UnsplashImage[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `default-${i}`,
    urls: { regular: DEFAULT_PLACE_IMAGE, small: DEFAULT_PLACE_IMAGE, full: DEFAULT_HERO_IMAGE },
    alt_description: `${destination} travel photo`,
    user: { name: "Unsplash" },
  }));
}

// ---- Geoapify Places with details ----

interface DiscoveryPlace {
  name: string;
  category: string;
  address: string;
  rating: number | null;
  lat: number;
  lon: number;
  image: string | null;
  description: string;
}

async function fetchDiscoveryPlaces(
  center: GeoPoint,
  categories: string,
  limit: number
): Promise<DiscoveryPlace[]> {
  if (!GEOAPIFY_API_KEY) return [];
  const radius = 10000;
  const url = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(categories)}&filter=circle:${center.lon},${center.lat},${radius}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Geoapify Places error ${res.status}`);
    return [];
  }
  const data = await res.json();
  const features = (data?.features ?? []) as GeoapifyResult[];
  const places: DiscoveryPlace[] = [];
  for (const f of features) {
    const props = f.properties;
    const [lon, lat] = f.geometry.coordinates;
    const cats = props.categories ?? {};
    const catKeys = Object.keys(cats);
    const raw = props.datasource?.raw ?? {};
    places.push({
      name: props.name ?? "Unknown",
      category: catKeys[0]?.replace(/\./g, " ") ?? "place",
      address:
        (raw["addr:housenumber"] ?? "") + " " + (raw["addr:street"] ?? "") + " " + (raw["addr:city"] ?? "") + " " + (raw["addr:country"] ?? "")
          .trim() || raw["addr:full"] || raw["address"] || "",
      rating: typeof raw["rating"] === "number" ? raw["rating"] : null,
      lat,
      lon,
      image: null,
      description: raw["description"] ?? raw["wikipedia"] ?? cats[catKeys[0]] ?? "",
    });
  }
  return places;
}

// ---- Gemini local foods + famous places ----

interface LocalFood {
  name: string;
  description: string;
}

interface FamousPlace {
  name: string;
  description: string;
}

async function generateLocalHighlights(destination: string): Promise<{ foods: LocalFood[]; places: FamousPlace[] }> {
  if (!GEMINI_API_KEY) return { foods: [], places: [] };
  const prompt = `You are a travel expert. For the destination "${destination}", generate:
1. The top 5 famous local foods that a visitor must try.
2. The top 5 must-visit places (landmarks, neighborhoods, or experiences).

Return ONLY valid JSON with this exact shape (no markdown, no commentary):
{
  "foods": [{ "name": "Food name", "description": "One short sentence describing the dish and why it's special." }],
  "places": [{ "name": "Place name", "description": "One short sentence describing the place and why it's a must-visit." }]
}`;
  const text = await callGemini(prompt);
  const parsed = tryParseJson(text) as { foods?: LocalFood[]; places?: FamousPlace[] };
  return {
    foods: Array.isArray(parsed.foods) ? parsed.foods.slice(0, 5) : [],
    places: Array.isArray(parsed.places) ? parsed.places.slice(0, 5) : [],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as { action?: string } & TripRequest;
    const action = body.action ?? "plan";

    if (action === "list-models") {
      const ai = getGeminiClient();
      let names: string[] = [];
      try {
        const page = await ai.models.list();
        names = (page.models ?? []).map((m: { name?: string }) => m.name ?? "").filter(Boolean);
      } catch {
        /* fall back to raw REST */
      }
      if (names.length === 0) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
        );
        const data = await res.json();
        names = (data?.models ?? []).map((m: { name?: string }) => m.name ?? "").filter(Boolean);
      }
      return new Response(JSON.stringify({ models: names }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "weather") {
      const weather = await fetchLiveWeather(body.destination ?? "", body.start_date, body.end_date);
      return new Response(JSON.stringify({ weather }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "discover") {
      const destination = body.destination ?? "";
      if (!destination) {
        return new Response(JSON.stringify({ error: "Destination is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Geocode destination (Nominatim)
      let center: GeoPoint | null = null;
      try {
        center = await geocode(destination);
      } catch (e) {
        console.warn("Nominatim geocode failed:", e instanceof Error ? e.message : e);
      }

      // Fetch images, places, weather, and AI highlights in parallel (non-fatal)
      const [images, hotels, restaurants, attractions, highlights, weather] = await Promise.all([
        fetchUnsplashImages(`${destination} travel`, 12).catch(() => []),
        center ? fetchDiscoveryPlaces(center, "accommodation", 8).catch(() => []) : Promise.resolve([]),
        center ? fetchDiscoveryPlaces(center, "catering", 8).catch(() => []) : Promise.resolve([]),
        center ? fetchDiscoveryPlaces(center, "tourism", 8).catch(() => []) : Promise.resolve([]),
        generateLocalHighlights(destination).catch(() => ({ foods: [], places: [] })),
        fetchLiveWeather(destination, undefined, undefined).catch(() => []),
      ]);

      const gallery = images.length > 0 ? images : defaultGallery(destination);
      const hero = gallery[0]?.urls?.full ?? gallery[0]?.urls?.regular ?? DEFAULT_HERO_IMAGE;

      return new Response(JSON.stringify({
        destination,
        hero_image: hero,
        gallery: gallery.map((img) => ({
          id: img.id,
          url: img.urls.regular,
          thumb: img.urls.small,
          alt: img.alt_description ?? `${destination} travel photo`,
          credit: img.user.name,
        })),
        famous_places: highlights.places,
        local_foods: highlights.foods,
        hotels,
        restaurants,
        attractions,
        weather,
        map_center: center,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "chat") {
      const missing = missingFields(body);
      const historyText = (body.history ?? [])
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
      const prompt = `Conversation so far:\n${historyText}\n\nCurrent trip request: ${JSON.stringify(body, null, 2)}\n\nMissing fields: ${missing.join(", ") || "none"}. ${
        missing.length > 0
          ? 'Ask the user concise follow-up questions to gather the missing info. Return JSON: { "needs_more_info": true, "questions": ["..."], "summary": "" }'
          : 'All required info is present. Return JSON: { "needs_more_info": false, "questions": [], "summary": "Ready to generate the plan." }'
      }`;
      const text = await callGemini(prompt);
      const parsed = tryParseJson(text);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // action === "plan"
    const missing = missingFields(body);
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({
          needs_more_info: true,
          missing_fields: missing,
          questions: missing.map((f) => `What is your ${f.replace(/_/g, " ")}?`),
          message: "I need a bit more information before I can build your itinerary.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch live weather first (non-fatal — fall back to Gemini-only if it fails)
    let liveWeather: LiveWeatherDay[] = [];
    try {
      liveWeather = await fetchLiveWeather(body.destination ?? "", body.start_date, body.end_date);
    } catch (e) {
      console.warn("OpenWeather fetch failed:", e instanceof Error ? e.message : e);
    }

    const prompt = buildUserPrompt(body, liveWeather);
    const text = await callGemini(prompt);
    const plan = tryParseJson(text) as Record<string, unknown>;

    // Ensure the plan uses the live weather data (override any Gemini-invented weather)
    if (liveWeather.length > 0) {
      plan.weather = liveWeather;
    }

    // Enrich hotels/restaurants/attractions with real coordinates from Geoapify Places
    // (geocoded via Nominatim). Non-fatal — plan still returns without map data if it fails.
    try {
      await enrichPlanWithPlaces(plan as Record<string, unknown>, body.destination ?? "");
    } catch (e) {
      console.warn("Place enrichment failed:", e instanceof Error ? e.message : e);
    }

    return new Response(
      JSON.stringify({ needs_more_info: false, plan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message, needs_more_info: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
