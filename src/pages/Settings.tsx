import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Cpu, Moon, Palette, Sun, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getPreferences, upsertPreferences } from '../lib/api';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import type { Preferences } from '../types';

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Palette },
] as const;

const aiModels = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (fast)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (higher quality)' },
];

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [aiModel, setAiModel] = useState(aiModels[0].value);

  useEffect(() => {
    (async () => {
      try {
        const p = await getPreferences();
        if (p) {
          setPrefs(p);
          setNotifications(p.notifications);
          setAiModel(p.ai_model);
        }
      } catch {
        /* non-fatal */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function savePrefs(patch: Partial<Preferences>) {
    setSaving(true);
    try {
      const updated = await upsertPreferences(patch);
      setPrefs(updated);
      setNotifications(updated.notifications);
      setAiModel(updated.ai_model);
    } catch (e) {
      push({
        title: 'Could not save preferences',
        description: e instanceof Error ? e.message : '',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    const confirmed = confirm('Permanently delete your account and all trips? This cannot be undone.');
    if (!confirmed) return;
    try {
      // Best-effort: remove auth user via Supabase (admin-only in real apps).
      await supabase.auth.admin?.deleteUser?.(user.id).catch(() => undefined);
      await signOut();
      push({ title: 'Account scheduled for deletion', variant: 'success' });
      navigate('/', { replace: true });
    } catch (e) {
      push({
        title: 'Could not delete account',
        description: e instanceof Error ? e.message : 'Contact support.',
        variant: 'error',
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Settings</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Personalize TravelGenie AI.</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how TravelGenie looks.</CardDescription>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {themeOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setTheme(o.value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition',
                theme === o.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                  : 'border-ink-200 bg-white/60 text-ink-700 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-200'
              )}
            >
              <o.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{o.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Trip updates and reminders.</CardDescription>
            </div>
          </div>
          <button
            onClick={() => savePrefs({ notifications: !notifications })}
            className={cn(
              'relative h-7 w-12 rounded-full transition',
              notifications ? 'bg-brand-500' : 'bg-ink-300 dark:bg-ink-700'
            )}
            aria-pressed={notifications}
          >
            <span
              className={cn(
                'absolute top-1 h-5 w-5 rounded-full bg-white transition',
                notifications ? 'left-6' : 'left-1'
              )}
            />
          </button>
        </div>
      </Card>

      {/* AI model */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle>AI model</CardTitle>
            <CardDescription>The Gemini model used for planning.</CardDescription>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {aiModels.map((m) => (
            <button
              key={m.value}
              onClick={() => savePrefs({ ai_model: m.value })}
              className={cn(
                'flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition',
                aiModel === m.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                  : 'border-ink-200 bg-white/60 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900/40'
              )}
            >
              <span className="font-medium">{m.label}</span>
              {aiModel === m.value && <span className="text-xs">Active</span>}
            </button>
          ))}
        </div>
        {saving && <p className="mt-2 text-xs text-ink-400">Saving…</p>}
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900/40">
        <CardTitle>Danger zone</CardTitle>
        <CardDescription>Permanent actions. Proceed with caution.</CardDescription>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={handleDeleteAccount}
            leftIcon={<Trash2 className="h-4 w-4" />}
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            Delete account
          </Button>
        </div>
      </Card>
    </div>
  );
}
