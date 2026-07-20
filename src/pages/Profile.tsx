import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Globe2, Save, User as UserIcon, Wallet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardTitle } from '../components/ui/Card';
import { Field, Input, Select } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { upsertProfile } from '../lib/api';
import { initials } from '../lib/utils';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'NGN'];
const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'hi', label: 'Hindi' },
];

interface FormValues {
  full_name: string;
  avatar_url: string;
  currency: string;
  language: string;
  travel_preferences: string;
}

export function Profile() {
  const { profile, refreshProfile, user } = useAuth();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name ?? '',
        avatar_url: profile.avatar_url ?? '',
        currency: profile.currency,
        language: profile.language,
        travel_preferences: JSON.stringify(profile.travel_preferences ?? {}, null, 2),
      });
      setLoading(false);
    }
  }, [profile, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    let prefs: Record<string, unknown> = {};
    try {
      prefs = values.travel_preferences ? JSON.parse(values.travel_preferences) : {};
    } catch {
      push({ title: 'Travel preferences must be valid JSON', variant: 'error' });
      setSaving(false);
      return;
    }
    try {
      await upsertProfile({
        full_name: values.full_name,
        avatar_url: values.avatar_url || null,
        currency: values.currency,
        language: values.language,
        travel_preferences: prefs,
      });
      await refreshProfile();
      push({ title: 'Profile updated', variant: 'success' });
    } catch (e) {
      push({
        title: 'Could not update profile',
        description: e instanceof Error ? e.message : '',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Profile</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage your personal details and travel preferences.</p>
      </div>

      <Card className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">
          {initials(profile.full_name) || 'TG'}
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
            {profile.full_name || 'Traveler'}
          </p>
          <p className="text-sm text-ink-500 dark:text-ink-400">{user?.email}</p>
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardTitle>Personal info</CardTitle>
          <CardDescription>Used across your trips and profile.</CardDescription>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input id="full_name" className="pl-10" {...register('full_name', { required: 'Required' })} />
              </div>
            </Field>
            <Field label="Avatar URL" htmlFor="avatar_url" hint="Optional. Link to a profile photo.">
              <div className="relative">
                <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input id="avatar_url" className="pl-10" placeholder="https://…" {...register('avatar_url')} />
              </div>
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Travel defaults</CardTitle>
          <CardDescription>Pre-filled when you plan new trips.</CardDescription>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Currency" htmlFor="currency">
              <div className="relative">
                <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Select id="currency" className="pl-10" {...register('currency')}>
                  {currencies.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
            </Field>
            <Field label="Language" htmlFor="language">
              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Select id="language" className="pl-10" {...register('language')}>
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </Select>
              </div>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Travel preferences (JSON)" hint="Advanced. Store custom preferences as JSON.">
              <textarea
                className="input min-h-[120px] font-mono text-sm"
                {...register('travel_preferences')}
              />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
