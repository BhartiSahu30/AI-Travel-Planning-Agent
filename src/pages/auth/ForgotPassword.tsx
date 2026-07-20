import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

interface FormValues {
  email: string;
}

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Could not send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-ink-200">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Enter your email and we'll send you a recovery link.
        </p>
      </div>

      {sent ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-0.5">If an account exists for that email, a reset link is on its way.</p>
          </div>
        </div>
      ) : (
        <>
          {serverError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-10"
                  placeholder="you@example.com"
                  invalid={!!errors.email}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                />
              </div>
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Send reset link
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
