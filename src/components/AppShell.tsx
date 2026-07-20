import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Moon,
  PlusCircle,
  Settings as SettingsIcon,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn, initials } from '../lib/utils';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips/new', label: 'New Trip', icon: PlusCircle },
  { to: '/trips', label: 'Saved Trips', icon: MapPinned },
  { to: '/profile', label: 'Profile', icon: UserIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppShell() {
  const { profile, signOut } = useAuth();
  const { resolved, setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link to="/dashboard">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/70'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-3 p-3">
        <button
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          className="btn-ghost flex w-full items-center justify-between px-3 py-2.5 text-sm"
        >
          <span className="flex items-center gap-2">
            {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {resolved === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-ink-100/70 p-3 dark:bg-ink-800/60">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-semibold text-white">
            {initials(profile?.full_name) || initials(profile?.id)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-100">
              {profile?.full_name || 'Traveler'}
            </p>
            <p className="truncate text-xs text-ink-500 dark:text-ink-400">
              {profile?.currency ?? 'USD'} · {profile?.language ?? 'en'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-200 hover:text-ink-900 dark:hover:bg-ink-700 dark:hover:text-ink-100"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink-200/70 bg-white/70 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/60 lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-ink-200 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-900">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200/70 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/60 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo withText={false} />
          <Link
            to="/trips/new"
            className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white"
          >
            <Compass className="h-5 w-5" />
          </Link>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
