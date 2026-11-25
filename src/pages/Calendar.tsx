import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Empty, PageHeader } from '../components/ui';
import { calendarEvents, EVENT_KINDS, type CalEvent, type EventKind } from '../lib/workflow';
import { useStore } from '../store';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WEEK = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const toneOf = (k: EventKind) => EVENT_KINDS.find((e) => e.id === k)!.tone;

export default function Calendar() {
  const { role, user, apps } = useStore();
  const navigate = useNavigate();
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(key(today));
  const [kinds, setKinds] = useState<EventKind[]>(EVENT_KINDS.map((k) => k.id));

  const events = useMemo(
    () => calendarEvents(role!, user, apps, cursor.y, cursor.m).filter((e) => kinds.includes(e.kind)),
    [role, user, apps, cursor, kinds],
  );
  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const k = key(new Date(e.date));
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return m;
  }, [events]);

  const first = new Date(cursor.y, cursor.m, 1);
  const lead = (first.getDay() + 6) % 7; // dushanbadan boshlanadi
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(cursor.y, cursor.m, i + 1))];
  while (cells.length % 7) cells.push(null);

  const move = (n: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const goToday = () => {
    setCursor({ y: today.getFullYear(), m: today.getMonth() });
    setSelected(key(today));
  };
  const dayEvents = byDay.get(selected) ?? [];
  const [sy, sm, sd] = selected.split('-').map(Number);

  return (
    <>
      <PageHeader title="Kalendar" subtitle="Ko'rib chiqish muddatlari, qo'mita yig'ilishlari, hisobotlar va shartnomalar" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
            <Button variant="secondary" onClick={goToday}>
              <CalendarDays size={16} /> Bugun
            </Button>
            <button onClick={() => move(-1)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Oldingi oy">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => move(1)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Keyingi oy">
              <ChevronRight size={18} />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {MONTHS[cursor.m]} {cursor.y}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 border-b border-slate-100 px-4 py-3">
            {EVENT_KINDS.map((k) => (
              <label key={k.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={kinds.includes(k.id)}
                  onChange={(e) => setKinds((ks) => (e.target.checked ? [...ks, k.id] : ks.filter((x) => x !== k.id)))}
                />
                <span className={`h-2 w-2 rounded-full ${k.tone}`} /> {k.label}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-medium text-slate-500">
            {WEEK.map((w, i) => (
              <div key={w} className={`py-2 ${i > 4 ? 'text-rose-500' : ''}`}>
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="min-h-20 border-b border-r border-slate-100 bg-slate-50/60" />;
              const k = key(d);
              const evs = byDay.get(k) ?? [];
              const isToday = k === key(today);
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className={`flex min-h-20 flex-col items-stretch justify-start border-b border-r border-slate-100 p-1.5 text-left transition hover:bg-slate-50 ${selected === k ? 'bg-emerald-50' : ''}`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday ? 'bg-emerald-700 font-semibold text-white' : 'text-slate-700'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {evs.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${e.overdue ? 'bg-rose-600' : toneOf(e.kind)}`}
                        title={e.title}
                      >
                        <span className="hidden sm:inline">{e.title}</span>
                        <span className="sm:hidden">•</span>
                      </div>
                    ))}
                    {evs.length > 2 && <div className="px-1 text-[10px] text-slate-500">+{evs.length - 2} ta</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="self-start lg:sticky lg:top-20">
          <CardHeader title={`${sd} ${MONTHS[sm].toLowerCase()} ${sy}`} subtitle={`${dayEvents.length} ta voqea`} />
          {dayEvents.length === 0 ? (
            <Empty>Bu kunda voqea yo'q</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dayEvents.map((e) => (
                <li key={e.id} className="space-y-2 px-5 py-4 text-sm">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.overdue ? 'bg-rose-600' : toneOf(e.kind)}`} />
                    <p className="font-medium text-slate-900">{e.title}</p>
                  </div>
                  <p className="pl-4 text-slate-600">{e.detail}</p>
                  <div className="flex flex-wrap items-center gap-3 pl-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {hhmm(e.date)}
                    </span>
                    {e.who && (
                      <span className="flex items-center gap-1">
                        <User size={12} /> {e.who}
                      </span>
                    )}
                    {e.overdue && <Badge tone="red">Muddati o'tgan</Badge>}
                  </div>
                  {e.appId && (
                    <div className="pl-4">
                      <Button variant="secondary" onClick={() => navigate(`/arizalar/${e.appId}`)}>
                        Ko'rish
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
