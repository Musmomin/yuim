import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Info } from 'lucide-react';
import { Badge, Card, CardHeader, PageHeader } from '../components/ui';
import { num, shortMoney } from '../lib/format';
import { BODY_LABEL, BODY_SLA, bodyStats, change, monthRange, monthSummary, PROMISE_DAYS, ratingOf, scoreOf } from '../lib/workflow';
import { useStore } from '../store';

type Period = 'all' | 'cur' | 'prev';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'all', label: 'Barcha davr' },
  { id: 'cur', label: 'Joriy oy' },
  { id: 'prev', label: "O'tgan oy" },
];

export default function Stats() {
  const { apps } = useStore();
  const [period, setPeriod] = useState<Period>('all');
  const cur = monthSummary(apps, 0);
  const prev = monthSummary(apps, -1);
  const range = period === 'all' ? null : monthRange(period === 'cur' ? 0 : -1);
  const rows = useMemo(() => bodyStats(apps, range?.from, range?.to), [apps, range?.from, range?.to]);
  const total = rows.reduce(
    (t, r) => ({
      total: t.total + r.total,
      onTime: t.onTime + r.onTime,
      late: t.late + r.late,
      inWork: t.inWork + r.inWork,
      overdue: t.overdue + r.overdue,
      returned: t.returned + r.returned,
      rejected: t.rejected + r.rejected,
    }),
    { total: 0, onTime: 0, late: 0, inWork: 0, overdue: 0, returned: 0, rejected: 0 },
  );
  const totalScore = scoreOf(total.onTime, total.late, total.overdue);

  return (
    <>
      <PageHeader title="Ijro statistikasi" subtitle="Arizalar oqimi va har bir bo'g'in qarorni qancha vaqtda chiqarayotgani" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TrendCard label="Kelgan arizalar" value={num(cur.received)} cur={cur.received} prev={prev.received} tone="bg-amber-50" />
        <TrendCard label="Qo'mita qarorlari" value={num(cur.decisions)} cur={cur.decisions} prev={prev.decisions} tone="bg-emerald-50" />
        <TrendCard
          label="Moliyalashtirildi"
          value={`${cur.funded} · ${shortMoney(cur.fundedSum)}`}
          cur={cur.fundedSum}
          prev={prev.fundedSum}
          tone="bg-sky-50"
        />
        <TrendCard
          label={`${PROMISE_DAYS} kunda javob`}
          value={cur.answered ? `${Math.round((cur.inPromise / cur.answered) * 100)}%` : '—'}
          cur={cur.answered ? cur.inPromise / cur.answered : 0}
          prev={prev.answered ? prev.inPromise / prev.answered : 0}
          tone="bg-violet-50"
          hint={cur.answered ? `${cur.inPromise} / ${cur.answered} ta ariza va'da muddatida` : 'Bu oy yakuniy javob berilmagan'}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Bo'g'inlar bo'yicha ijro"
          subtitle="Har bir qo'mita o'z muddatida xulosa berdimi"
          action={
            <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none">
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="bg-emerald-700 text-left text-xs text-white">
                <th className="px-5 py-3 font-medium">Bo'g'in</th>
                <th className="px-3 py-3 text-right font-medium">Muddat</th>
                <th className="px-3 py-3 text-right font-medium">Jami</th>
                <th className="px-3 py-3 text-right font-medium">O'z vaqtida</th>
                <th className="px-3 py-3 text-right font-medium">Muddatidan kech</th>
                <th className="px-3 py-3 text-right font-medium">Ko'rib chiqilmoqda</th>
                <th className="px-3 py-3 text-right font-medium">Muddati o'tgan</th>
                <th className="px-3 py-3 text-right font-medium">Qaytarilgan</th>
                <th className="px-3 py-3 text-right font-medium">Rad etilgan</th>
                <th className="px-3 py-3 text-right font-medium">O'rtacha, kun</th>
                <th className="px-3 py-3 text-right font-medium">Ball</th>
                <th className="px-5 py-3 font-medium">Reyting</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const rt = ratingOf(r.score);
                return (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="px-5 py-3 font-medium text-slate-900">{BODY_LABEL[r.id]}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">{BODY_SLA[r.id]} kun</td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.total}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-700">{r.onTime}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-amber-800">{r.late}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-sky-700">{r.inWork}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-rose-600">{r.overdue}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.returned}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.rejected}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.avgDays == null ? '—' : r.avgDays.toFixed(1).replace('.', ',')}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{r.score ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge tone={rt.tone}>{rt.label}</Badge>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-5 py-3">Jami</td>
                <td />
                <td className="px-3 py-3 text-right tabular-nums">{total.total}</td>
                <td className="px-3 py-3 text-right tabular-nums text-emerald-700">{total.onTime}</td>
                <td className="px-3 py-3 text-right tabular-nums text-amber-800">{total.late}</td>
                <td className="px-3 py-3 text-right tabular-nums text-sky-700">{total.inWork}</td>
                <td className="px-3 py-3 text-right tabular-nums text-rose-600">{total.overdue}</td>
                <td className="px-3 py-3 text-right tabular-nums">{total.returned}</td>
                <td className="px-3 py-3 text-right tabular-nums">{total.rejected}</td>
                <td />
                <td className="px-3 py-3 text-right tabular-nums">{totalScore ?? '—'}</td>
                <td className="px-5 py-3">
                  <Badge tone={ratingOf(totalScore).tone}>{ratingOf(totalScore).label}</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="flex gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          Ball: o'z vaqtida qaror — 1, kechikib — 0,5, muddati o'tib hali qarorsiz — 0; muddati tugamagan ishlar hisobga kirmaydi. Reyting: 90+ a'lo, 75+ yaxshi,
          50+ qoniqarli. Davr qo'mita ko'rigi boshlangan sana bo'yicha olinadi.
        </p>
      </Card>
    </>
  );
}

function TrendCard({ label, value, cur, prev, tone, hint }: { label: string; value: string; cur: number; prev: number; tone: string; hint?: string }) {
  const c = change(cur, prev);
  const Icon = c.dir === 'up' ? ArrowUpRight : c.dir === 'down' ? ArrowDownRight : ArrowRight;
  return (
    <Card className={`p-5 ${tone}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className={`mt-2 flex items-center gap-1 text-xs ${c.dir === 'up' ? 'text-emerald-700' : c.dir === 'down' ? 'text-rose-600' : 'text-slate-500'}`}>
        <Icon size={14} /> {c.text}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
