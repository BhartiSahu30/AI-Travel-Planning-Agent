import { supabase } from './supabase';
import type {
  ChatMessage,
  DiscoveryResponse,
  PlanTripRequest,
  PlanTripResponse,
  Preferences,
  Profile,
  Trip,
} from '../types';

async function functionUrl(name: string): Promise<string> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
  return url;
}

async function authHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

export async function orchestrateUrl(): Promise<string> {
  return functionUrl('plan-trip');
}

export async function orchestrateHeaders(): Promise<HeadersInit> {
  return authHeaders();
}

export async function planTrip(req: PlanTripRequest): Promise<PlanTripResponse> {
  const url = await functionUrl('plan-trip');
  const res = await fetch(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ action: 'plan', ...req }),
  });
  const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));
  if (!res.ok) {
    return { needs_more_info: false, error: data?.error ?? `Request failed (${res.status})` };
  }
  return data as PlanTripResponse;
}

export async function chatWithAgent(
  req: PlanTripRequest,
  history: ChatMessage[]
): Promise<{ needs_more_info: boolean; questions?: string[]; summary?: string; error?: string }> {
  const url = await functionUrl('plan-trip');
  const res = await fetch(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ action: 'chat', ...req, history }),
  });
  const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));
  if (!res.ok) {
    return { needs_more_info: false, error: data?.error ?? `Request failed (${res.status})` };
  }
  return data;
}

export async function discoverDestination(destination: string): Promise<DiscoveryResponse> {
  const url = await functionUrl('plan-trip');
  const res = await fetch(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ action: 'discover', destination }),
  });
  const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));
  if (!res.ok) {
    return { error: data?.error ?? `Request failed (${res.status})` } as DiscoveryResponse;
  }
  return data as DiscoveryResponse;
}

// ---- Profiles ----
export async function getProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertProfile(p: Partial<Profile>): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const payload = { id: user.id, ...p };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// ---- Preferences ----
export async function getPreferences(): Promise<Preferences | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data as Preferences | null;
}

export async function upsertPreferences(p: Partial<Preferences>): Promise<Preferences> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const payload = { user_id: user.id, ...p };
  const { data, error } = await supabase
    .from('preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data as Preferences;
}

// ---- Trips ----
export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Trip[];
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Trip | null;
}

export async function createTrip(payload: Partial<Trip>): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Trip;
}

export async function updateTrip(id: string, payload: Partial<Trip>): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Trip;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}
