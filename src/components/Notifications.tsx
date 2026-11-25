import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, AlertTriangle, Bell, CheckCheck, ClipboardCheck, History, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { ago, notificationsFor, type NoteKind } from '../lib/workflow';
import { useStore } from '../store';

const KIND: Record<NoteKind, { icon: LucideIcon; tone: string }> = {
  vazifa: { icon: ClipboardCheck, tone: 'bg-sky-50 text-sky-700' },
  muddat: { icon: TriangleAlert, tone: 'bg-rose-50 text-rose-700' },
  yaqin: { icon: AlarmClock, tone: 'bg-amber-50 text-amber-800' },
  ogohlantirish: { icon: AlertTriangle, tone: 'bg-amber-50 text-amber-800' },
  harakat: { icon: History, tone: 'bg-slate-100 text-slate-600' },
};

export default function Notifications() {
  const { role, user, apps, audit, read, markRead } = useStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const notes = useMemo(() => notificationsFor(role!, user, apps, audit), [role, user, apps, audit]);
  const unread = notes.filter((n) => !read.includes(n.id));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        title="Bildirishnomalar"
        aria-label={`Bildirishnomalar: ${unread.length} ta o'qilmagan`}
      >
        <Bell size={18} />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold leading-5 text-white">
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        )}
      </button>

      {open &&
        createPortal(
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl" role="dialog" aria-label="Bildirishnomalar">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Bildirishnomalar</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Yopish">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2 text-xs">
              <span className="text-slate-500">{unread.length} ta o'qilmagan</span>
              <button
                onClick={() => markRead(notes.map((n) => n.id))}
                disabled={!unread.length}
                className="flex items-center gap-1 text-emerald-700 hover:underline disabled:opacity-40 disabled:no-underline"
              >
                <CheckCheck size={14} /> Hammasini o'qilgan deb belgilash
              </button>
            </div>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {notes.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-500">Bildirishnoma yo'q</li>}
              {notes.map((n) => {
                const { icon: Icon, tone } = KIND[n.kind];
                const isNew = !read.includes(n.id);
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        markRead([n.id]);
                        setOpen(false);
                        navigate(n.to);
                      }}
                      className={`flex w-full gap-3 px-5 py-3 text-left hover:bg-slate-50 ${isNew ? 'bg-emerald-50/40' : ''}`}
                    >
                      <span className={`mt-0.5 h-8 w-8 shrink-0 rounded-full p-2 ${tone}`}>
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${isNew ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{n.title}</span>
                        <span className="block text-xs text-slate-600">{n.text}</span>
                        <span className="mt-1 block text-xs text-slate-400">{ago(n.at)}</span>
                      </span>
                      {isNew && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </>,
          document.body,
        )}
    </>
  );
}
