import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  CalendarDays,
  Check,
  Compass,
  Hotel,
  MapPin,
  Plane,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

const styles = ['Luxury', 'Budget', 'Backpacking', 'Business', 'Balanced'] as const;
const hotelOptions = ['Any', 'Hotel', 'Hostel', 'Resort', 'Apartment', 'Boutique'];
const transportOptions = ['Any', 'Flight', 'Train', 'Road trip', 'Public transit', 'Rental car'];
const foodOptions = ['Any', 'Local cuisine', 'Vegetarian', 'Vegan', 'Street food', 'Fine dining'];
const interests = [
  'Adventure', 'Nature', 'Beaches', 'History', 'Shopping', 'Nightlife',
  'Wildlife', 'Culture', 'Photography', 'Food',
];
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'NGN'];

interface FormValues {
  departure_city: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  adults: number;
  children: number;
  style: string;
  hotel: string;
  transport: string;
  food: string;
  accessibility: string;
  interests: string[];
  notes: string;
}

export function PlanNewTrip() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      currency: profile?.currency ?? 'USD',
      adults: 1,
      children: 0,
      style: 'Balanced',
      hotel: 'Any',
      transport: 'Any',
      food: 'Any',
      interests: [],
      accessibility: '',
      notes: '',
    },
  });

  const selectedInterests = watch('interests');

  function toggleInterest(i: string) {
    const current = watch('interests');
    const next = current.includes(i) ? current.filter((x) => x !== i) : [...current, i];
    setValue('interests', next, { shouldDirty: true });
  }

  const onSubmit = async (values: FormValues) => {
    if (new Date(values.end_date) < new Date(values.start_date)) {
      push({ title: 'End date must be after start date', variant: 'error' });
      return;
    }
    setSubmitting(true);
    const payload = {
      departure_city: values.departure_city,
      destination: values.destination,
      start_date: values.start_date,
      end_date: values.end_date,
      budget: Number(values.budget),
      currency: values.currency,
      travelers: { adults: Number(values.adults), children: Number(values.children) },
      style: values.style,
      preferences: {
        hotel: values.hotel,
        transport: values.transport,
        food: values.food,
        accessibility: values.accessibility,
        interests: values.interests,
        notes: values.notes,
      },
    };
    try {
      sessionStorage.setItem('tg-pending-trip', JSON.stringify(payload));
      navigate('/trips/progress');
    } catch (e) {
      push({
        title: 'Could not start planning',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'error',
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Plan a new trip</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Tell TravelGenie AI about your trip. It'll ask follow-ups if anything's missing.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Trip basics */}
        <Card>
          <CardTitle>Trip basics</CardTitle>
          <CardDescription>Where are you going, and when?</CardDescription>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Departure city" htmlFor="departure_city" error={errors.departure_city?.message}>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input id="departure_city" className="pl-10" placeholder="e.g. New York" invalid={!!errors.departure_city}
                  {...register('departure_city', { required: 'Required' })} />
              </div>
            </Field>
            <Field label="Destination" htmlFor="destination" error={errors.destination?.message}>
              <div className="relative">
                <Compass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input id="destination" className="pl-10" placeholder="e.g. Kyoto" invalid={!!errors.destination}
                  {...register('destination', { required: 'Required' })} />
              </div>
            </Field>
            <Field label="Start date" htmlFor="start_date" error={errors.start_date?.message}>
              <Input id="start_date" type="date" invalid={!!errors.start_date}
                {...register('start_date', { required: 'Required' })} />
            </Field>
            <Field label="End date" htmlFor="end_date" error={errors.end_date?.message}>
              <Input id="end_date" type="date" invalid={!!errors.end_date}
                {...register('end_date', { required: 'Required' })} />
            </Field>
          </div>
        </Card>

        {/* Budget & travelers */}
        <Card>
          <CardTitle>Budget & travelers</CardTitle>
          <CardDescription>How much can you spend, and who's coming?</CardDescription>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Budget" htmlFor="budget" error={errors.budget?.message}>
              <div className="relative">
                <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input id="budget" type="number" min={0} step={50} className="pl-10" placeholder="2500" invalid={!!errors.budget}
                  {...register('budget', { required: 'Required', min: { value: 0, message: 'Must be positive' } })} />
              </div>
            </Field>
            <Field label="Currency" htmlFor="currency">
              <Select id="currency" {...register('currency')}>
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Adults" htmlFor="adults" error={errors.adults?.message}>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input id="adults" type="number" min={1} max={20} className="pl-10" invalid={!!errors.adults}
                  {...register('adults', { required: 'Required', min: { value: 1, message: 'At least 1' } })} />
              </div>
            </Field>
            <Field label="Children" htmlFor="children">
              <Input id="children" type="number" min={0} max={20} {...register('children', { min: 0 })} />
            </Field>
          </div>
        </Card>

        {/* Style & preferences */}
        <Card>
          <CardTitle>Style & preferences</CardTitle>
          <CardDescription>Tune the plan to your taste.</CardDescription>
          <div className="mt-4 space-y-5">
            <Field label="Travel style">
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('style', s, { shouldDirty: true })}
                    className={cn(
                      'chip',
                      watch('style') === s
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-200'
                    )}
                  >
                    {watch('style') === s && <Check className="h-3 w-3" />} {s}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Hotel preference">
                <div className="relative">
                  <Hotel className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Select className="pl-10" {...register('hotel')}>
                    {hotelOptions.map((o) => <option key={o}>{o}</option>)}
                  </Select>
                </div>
              </Field>
              <Field label="Transportation">
                <div className="relative">
                  <Plane className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Select className="pl-10" {...register('transport')}>
                    {transportOptions.map((o) => <option key={o}>{o}</option>)}
                  </Select>
                </div>
              </Field>
              <Field label="Food preference">
                <Select {...register('food')}>
                  {foodOptions.map((o) => <option key={o}>{o}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Interests" hint="Pick all that apply.">
              <div className="flex flex-wrap gap-2">
                {interests.map((i) => {
                  const active = selectedInterests.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleInterest(i)}
                      className={cn(
                        'chip',
                        active
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-200'
                      )}
                    >
                      {active && <Check className="h-3 w-3" />} {i}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Accessibility needs" hint="Optional. e.g. wheelchair access, dietary restrictions.">
              <Input placeholder="e.g. Wheelchair-accessible venues" {...register('accessibility')} />
            </Field>

            <Field label="Special notes" hint="Anything else the AI should know?">
              <Textarea placeholder="e.g. We want to avoid tourist crowds and love local markets." {...register('notes')} />
            </Field>
          </div>
        </Card>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
            <CalendarDays className="h-4 w-4" /> TravelGenie will reason about your inputs before planning.
          </p>
          <Button type="submit" size="lg" loading={submitting} leftIcon={<Sparkles className="h-4 w-4" />}>
            Generate AI Plan
          </Button>
        </div>
      </form>
    </div>
  );
}
