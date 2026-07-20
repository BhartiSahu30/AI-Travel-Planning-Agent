/*
# TravelGenie AI — core schema (profiles, trips, preferences)

## Summary
Creates the three collections the TravelGenie AI app needs:
- `profiles`  — per-user profile (display name, avatar, currency, language, travel preferences)
- `trips`     — saved AI-generated trips owned by a user (request + generated plan)
- `preferences` — per-user app/settings preferences (theme, notifications, AI model)

This is a multi-user app with a sign-in screen, so every table is owner-scoped
using `auth.uid()` and the owner columns default to `auth.uid()` so client
inserts that omit `user_id` still satisfy RLS.

## New Tables

### profiles
- `id`            uuid PK, references `auth.users(id)` ON DELETE CASCADE
- `full_name`     text
- `avatar_url`    text
- `currency`      text  default 'USD'
- `language`      text  default 'en'
- `travel_preferences`  jsonb  default '{}'
- `created_at`    timestamptz default now()
- `updated_at`    timestamptz default now()

### trips
- `id`            uuid PK default gen_random_uuid()
- `user_id`       uuid NOT NULL DEFAULT auth.uid() references auth.users(id) ON DELETE CASCADE
- `title`         text
- `departure_city` text
- `destination`   text
- `start_date`    date
- `end_date`      date
- `budget`        numeric
- `currency`      text default 'USD'
- `travelers`     jsonb   (adults, children, total)
- `style`         text
- `preferences`   jsonb   (hotel, transport, food, accessibility, interests, notes)
- `status`        text default 'planned'  (planned | saved | archived)
- `plan`          jsonb   (the full AI-generated plan: summary, budget, hotels, restaurants, weather, transportation, packing, itinerary, tips, emergency)
- `created_at`    timestamptz default now()
- `updated_at`    timestamptz default now()

### preferences
- `id`            uuid PK default gen_random_uuid()
- `user_id`       uuid NOT NULL DEFAULT auth.uid() references auth.users(id) ON DELETE CASCADE
- `theme`         text default 'system'   (light | dark | system)
- `notifications` boolean default true
- `ai_model`      text default 'gemini-2.5-flash'
- `created_at`    timestamptz default now()
- `updated_at`    timestamptz default now()

## Security
- RLS enabled on all three tables.
- `profiles`: a user can read/update only their own profile row (id = auth.uid()).
- `trips`: owner-scoped CRUD via `user_id = auth.uid()`.
- `preferences`: owner-scoped CRUD via `user_id = auth.uid()`.
- All owner columns default to `auth.uid()` so client inserts that omit the
  owner column still satisfy the INSERT `WITH CHECK` predicate.

## Notes
1. `profiles.id` mirrors `auth.users.id` (one row per user). The app creates
   the profile row on first sign-in via the auth context.
2. `trips.plan` stores the full structured AI plan as JSON so the result page
   can render without re-calling the model.
3. Indexes added on owner columns and common filter columns.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  currency text NOT NULL DEFAULT 'USD',
  language text NOT NULL DEFAULT 'en',
  travel_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  departure_city text,
  destination text,
  start_date date,
  end_date date,
  budget numeric,
  currency text NOT NULL DEFAULT 'USD',
  travelers jsonb NOT NULL DEFAULT '{}'::jsonb,
  style text,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'planned',
  plan jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trips" ON trips;
CREATE POLICY "select_own_trips" ON trips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trips" ON trips;
CREATE POLICY "insert_own_trips" ON trips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trips" ON trips;
CREATE POLICY "update_own_trips" ON trips FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trips" ON trips;
CREATE POLICY "delete_own_trips" ON trips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips (user_id);
CREATE INDEX IF NOT EXISTS trips_created_at_idx ON trips (created_at DESC);
CREATE INDEX IF NOT EXISTS trips_destination_idx ON trips (destination);

CREATE TABLE IF NOT EXISTS preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'system',
  notifications boolean NOT NULL DEFAULT true,
  ai_model text NOT NULL DEFAULT 'gemini-2.5-flash',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_preferences" ON preferences;
CREATE POLICY "select_own_preferences" ON preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_preferences" ON preferences;
CREATE POLICY "insert_own_preferences" ON preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_preferences" ON preferences;
CREATE POLICY "update_own_preferences" ON preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_preferences" ON preferences;
CREATE POLICY "delete_own_preferences" ON preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS preferences_user_id_unique ON preferences (user_id);
