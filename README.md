# TravelGenie AI — Autonomous AI Travel Planning Agent

TravelGenie AI is a production-style, full-stack AI travel planning agent. It reasons about your trip
request, asks follow-up questions when information is missing, then calls the Google Gemini API to
generate a personalized itinerary with budget, hotels, restaurants, attractions, weather, packing
list, travel tips, and emergency contacts — all returned as structured JSON.

## Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Lucide Icons
- Framer Motion

**Backend**
- Supabase (Postgres + Auth + Edge Functions)
- Google Gemini API (`gemini-2.5-flash`) via a Supabase Edge Function

> The original spec called for Python/FastAPI/Firebase. This implementation uses Supabase
> (Postgres, Auth, Edge Functions) instead of Firebase, and a Deno-based Supabase Edge Function
> instead of a Python FastAPI service, so the app runs end-to-end in this environment. The
> architecture, modularity, and AI-agent behavior match the spec.

## Architecture

```
src/
  components/        Reusable UI (Button, Card, Input, Badge, Skeleton, Toaster, AppShell, …)
  components/ui/     Primitive components
  contexts/          AuthContext, ThemeContext, ToastContext
  hooks/             useTrips, useDebounce
  lib/               supabase client, api client, utils
  pages/             Application pages (Landing, Dashboard, PlanNewTrip, …)
  pages/auth/        Login, Register, ForgotPassword
  types/             Shared TypeScript types
supabase/
  functions/
    plan-trip/       Edge function: AI agent (plan + chat actions) calling Gemini
```

### AI Agent

The agent lives in `supabase/functions/plan-trip/index.ts`. It implements the system prompt from the
spec: it never immediately generates an itinerary. It first checks for required fields, asks
follow-ups when missing, then calls Gemini with a structured-JSON output schema and returns the plan.

### Database

Three Postgres tables (owner-scoped, RLS-protected):
- `profiles` — per-user profile (name, avatar, currency, language, travel preferences)
- `trips` — saved AI trips (request + generated plan JSON)
- `preferences` — app settings (theme, notifications, AI model)

## Getting started

### 1. Frontend

```bash
npm install
npm run dev
```

Create a `.env` file (see `.env.example`):

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### 2. Backend (Supabase)

The Supabase project, schema, and `plan-trip` edge function are already provisioned in this
environment. To recreate in your own project:

1. Apply the migration in `supabase/migrations` (or run the SQL in `mcp__supabase__apply_migration`).
2. Deploy the edge function:
   ```bash
   # via Supabase MCP tool — see supabase/functions/plan-trip/index.ts
   ```
3. Add the `GEMINI_API_KEY` secret to your Supabase project (Edge Functions → Secrets).

### 3. Gemini API

Get a key from Google AI Studio: https://aistudio.google.com/apikey

Add it as a Supabase Edge Function secret named `GEMINI_API_KEY`.

## Pages

- `/` — Landing
- `/login`, `/register`, `/forgot-password` — Auth
- `/dashboard` — Dashboard (stats, recent trips, quick actions)
- `/trips/new` — Plan New Trip form
- `/trips/progress` — AI Planning Progress (animated agent steps)
- `/trips/:id` — Trip Details / Results (summary, budget, weather, hotels, restaurants, attractions, itinerary timeline, packing checklist, tips, emergency, PDF export, save, share, delete)
- `/trips` — Saved Trips (search, filter, rename, delete)
- `/profile` — Profile
- `/settings` — Settings (theme, notifications, AI model, delete account)
- `*` — 404

## Features

- Autonomous AI agent that reasons before answering and asks follow-ups
- Structured JSON itineraries (summary, budget, weather, hotels, restaurants, attractions, transportation, packing, itinerary, tips, emergency)
- Supabase email/password auth with protected routes
- Owner-scoped RLS on every table
- Dark/light/system theme
- Glassmorphism UI, Framer Motion animations, loading skeletons, empty states, error handling
- Fully responsive

## Scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```
