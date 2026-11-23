import { useNavigate } from 'react-router-dom';
import type { Application } from '../data/types';
import { date, shortMoney } from '../lib/format';
import { RISK_LABEL, RISK_TONE, STAGE_LABEL, STAGE_TONE } from '../lib/labels';
import { Badge, Empty } from './ui';

export default function AppTable({ apps, empty = "Ariza topilmadi" }: { apps: Application[]; empty?: string }) {
  const navigate = useNavigate();
  if (!apps.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-medium">Ariza</th>
            <th className="px-3 py-3 font-medium">Tarmoq</th>
            <th className="px-3 py-3 text-right font-medium">Summa</th>
            <th className="px-3 py-3 font-medium">AI baho</th>
            <th className="px-3 py-3 font-medium">Bosqich</th>
            <th className="px-5 py-3 font-medium">Sana</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id} onClick={() => navigate(`/arizalar/${a.id}`)} className="cursor-pointer border-b border-slate-50 hover:bg-slate-50">
              <td className="px-5 py-3">
                <div className="font-medium text-slate-900">{a.company}</div>
                <div className="text-xs text-slate-500">
                  {a.id} · {a.region}
                </div>
              </td>
              <td className="px-3 py-3 text-slate-600">{a.sector}</td>
              <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-900">{shortMoney(a.amount)}</td>
              <td className="px-3 py-3">
                <Badge tone={a.ai.activity === 'cheklangan' ? 'red' : RISK_TONE[a.ai.level]}>
                  {a.ai.activity === 'cheklangan' ? 'Cheklangan' : RISK_LABEL[a.ai.level]} · {a.ai.score}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <Badge tone={STAGE_TONE[a.stage]}>{STAGE_LABEL[a.stage]}</Badge>
              </td>
              <td className="px-5 py-3 text-slate-500">{date(a.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
