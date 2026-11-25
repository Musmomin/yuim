import { AlertTriangle } from 'lucide-react';
import { Badge, Card, CardHeader, Empty, PageHeader } from '../components/ui';
import type { Application } from '../../shared/types';
import { monthLabel, shortMoney } from '../../shared/format';
import { profitOf, useStore } from '../store';

export default function Monitoring() {
  const { apps, role, user } = useStore();
  const list = apps.filter((a) => a.stage === 'moliyalashtirildi' && (role !== 'investor' || a.investor === user));
  return (
    <>
      <PageHeader title="Monitoring" subtitle="Ijrochi sheriklarning oylik hisobotlari: haqiqiy sof foyda va reja" />
      {list.length === 0 && (
        <Card>
          <Empty>Faol shartnomalar yo'q</Empty>
        </Card>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        {list.map((a) => (
          <MonitorCard key={a.id} a={a} />
        ))}
      </div>
    </>
  );
}

function MonitorCard({ a }: { a: Application }) {
  const reps = a.reports;
  const last = reps[reps.length - 1];
  const lastProfit = last ? profitOf(last) : 0;
  const alert = last && lastProfit < last.plan * 0.7;
  const max = Math.max(1, ...reps.flatMap((r) => [profitOf(r), r.plan]));
  const totalProfit = reps.reduce((s, r) => s + profitOf(r), 0);

  return (
    <Card>
      <CardHeader
        title={a.company}
        subtitle={`${a.agreementNo} · investor: ${a.investor}`}
        action={alert ? <Badge tone="red"><AlertTriangle size={12} /> Rejadan past</Badge> : <Badge tone="green">Me'yorda</Badge>}
      />
      {reps.length === 0 ? (
        <Empty>Hali oylik hisobot topshirilmagan</Empty>
      ) : (
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Oxirgi oy foydasi</p>
              <p className={`font-semibold ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{shortMoney(lastProfit)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Reja</p>
              <p className="font-semibold text-slate-900">{shortMoney(last.plan)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Davr bo'yicha jami</p>
              <p className="font-semibold text-slate-900">{shortMoney(totalProfit)}</p>
            </div>
          </div>
          <div className="mt-5 flex h-40 items-end gap-2" aria-label="Oylik sof foyda va reja">
            {reps.map((r) => {
              const p = profitOf(r);
              const low = p < r.plan * 0.7;
              return (
                <div key={r.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${monthLabel(r.month)}: foyda ${shortMoney(p)}, reja ${shortMoney(r.plan)}`}>
                  <div className="relative flex h-full w-full items-end justify-center">
                    <div className="absolute w-full border-t-2 border-dashed border-slate-400" style={{ bottom: `${(r.plan / max) * 100}%` }} />
                    <div className={`w-3/4 rounded-t ${low ? 'bg-rose-400' : 'bg-emerald-500'}`} style={{ height: `${(Math.max(0, p) / max) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500">{monthLabel(r.month)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-3 rounded-sm bg-emerald-500" /> Sof foyda
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 border-t-2 border-dashed border-slate-400" /> Reja
            </span>
          </p>
        </div>
      )}
    </Card>
  );
}
