import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
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

function buildUserPrompt(req: TripRequest): string {
  const prefs = req.preferences ?? {};
  const travelers = req.travelers ?? {};
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
- Special notes: ${prefs.notes ?? "none"}

Return ONLY a valid JSON object with this exact shape:
{
  "summary": "short overview of the trip",
  "budget": {
    "currency": "USD",
    "total": 0,
    "breakdown": [{ "category": "Flights", "amount": 0 }, { "category": "Hotels", "amount": 0 }, { "category": "Food", "amount": 0 }, { "category": "Transport", "amount": 0 }, { "category": "Activities", "amount": 0 }, { "category": "Misc", "amount": 0 }]
  },
  "weather": [{ "date": "YYYY-MM-DD", "condition": "Sunny", "high": 0, "low": 0 }],
  "hotels": [{ "name": "", "price_per_night": 0, "rating": 0, "area": "", "reason": "", "amenities": [] }],
  "restaurants": [{ "name": "", "cuisine": "", "price_level": 1, "rating": 0, "reason": "" }],
  "attractions": [{ "name": "", "category": "", "duration_hours": 0, "rating": 0, "reason": "" }],
  "transportation": { "to_destination": "", "local": "", "estimated_cost": 0 },
  "packing": [{ "category": "Clothing", "items": [] }, { "category": "Essentials", "items": [] }, { "category": "Documents", "items": [] }],
  "itinerary": [{ "day": 1, "date": "YYYY-MM-DD", "title": "", "summary": "", "activities": [{ "time": "09:00", "title": "", "description": "", "location": "", "duration_hours": 0 }] }],
  "tips": ["short travel tip"],
  "emergency": { "police": "", "ambulance": "", "embassy": "", "notes": "" }
}

Do not include markdown fences or any text outside the JSON.`;
}

function getClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Add it as a secret to this Supabase project.");
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

async function callGemini(prompt: string): Promise<string> {
  const ai = getClient();
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as { action?: string } & TripRequest;
    const action = body.action ?? "plan";

    if (action === "list-models") {
      const ai = getClient();
      // Try the SDK first
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

    const prompt = buildUserPrompt(body);
    const text = await callGemini(prompt);
    const plan = tryParseJson(text);
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
