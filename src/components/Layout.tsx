import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FlaskConical, LogOut, Menu, RotateCcw, X } from 'lucide-react';
import { ROLES } from '../data/mock';
import type { Role } from '../data/types';
import { tasksFor, useStore } from '../store';
import { inboxFor } from '../lib/workflow';
import { NAV } from './nav';
import Notifications from './Notifications';
import { Logo } from './Logo';
import { BRAND } from '../data/org';

/** Test rejimi: rolni almashtirish va ma'lumotni qaytarish faqat shu rejimda. `VITE_TEST_MODE=false` bilan o'chadi. */
export const TEST_MODE = import.meta.env.VITE_TEST_MODE !== 'false';

export default function Layout({ children }: { children: ReactNode }) {
  const { role, user, apps, login, logout, reset } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);

  const items = NAV.filter((n) => role && n.roles.includes(role));
  const taskCount = tasksFor(role, apps).length;
  const roleInfo = ROLES.find((r) => r.id === role);
  const inbox = role ? inboxFor(role, apps) : null;
  const inboxCount = inbox ? inbox.korib.length + inbox.imzo.length : 0;
  const inboxLate = !!inbox && [...inbox.korib, ...inbox.imzo].some((r) => r.state === 'otgan');

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside
        className={`yuim-dawn fixed inset-y-0 left-0 z-40 flex w-64 flex-col text-ink-100 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo height={40} />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Yopish">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/arizalar'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-white/10 font-semibold text-white shadow-[inset_3px_0_0_var(--color-gold-400)]' : 'text-ink-100/80 hover:bg-white/5 hover:text-white'}`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {to === '/hujjatlar' && inboxCount > 0 && (
                <span className={`rounded-full px-2 text-xs font-semibold ${inboxLate ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-900'}`}>{inboxCount}</span>
              )}
              {to === '/vazifalar' && taskCount > 0 && (
                <span className="rounded-full bg-amber-400 px-2 text-xs font-semibold text-slate-900">{taskCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="text-xs font-medium leading-relaxed text-gold-200">«{BRAND.slogan}»</p>
          <p className="mt-1 text-[11px] text-ink-300">v0.2 · test versiya</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <button className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menyu">
            <Menu size={20} />
          </button>
          {TEST_MODE && (
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 sm:inline-flex">
              <FlaskConical size={14} /> Test rejimi
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Notifications />
            {TEST_MODE && (
            <select
              value={role ?? ''}
              onChange={(e) => {
                login(e.target.value as Role);
                navigate('/');
              }}
              className="max-w-[170px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm sm:max-w-none"
              title="Test uchun rolni almashtirish"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            )}
            <div className={`items-center gap-2 ${TEST_MODE ? 'hidden md:flex' : 'flex'}`}>
              {!TEST_MODE && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">{user.slice(0, 1)}</span>
              )}
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">{user}</div>
                <div className="text-xs text-slate-500">{roleInfo?.label}</div>
              </div>
            </div>
            {TEST_MODE && (
              <button
                onClick={() => reset()}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                title="Test ma'lumotlarini boshlang'ich holatga qaytarish"
              >
                <RotateCcw size={18} />
              </button>
            )}
            <button onClick={logout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Chiqish">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
