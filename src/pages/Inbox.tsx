import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Badge, Card, Empty, inputCls, PageHeader } from '../components/ui';
import { dateTime, shortMoney } from '../lib/format';
import { REVIEW_BODY, STAGE_LABEL, STAGE_TONE, type Tone } from '../lib/labels';
import { BOXES, inboxFor, remaining, type BoxId, type RowState } from '../lib/workflow';
import { useStore } from '../store';

export const ROW_STATE: Record<RowState, { label: string; tone: Tone }> = {
  jarayonda: { label: "Ko'rib chiqishda", tone: 'blue' },
  yaqin: { label: 'Muddati yaqin', tone: 'amber' },
  otgan: { label: "Muddati o'tgan", tone: 'red' },
  qayta: { label: 'Qayta ishlashda', tone: 'amber' },
  bajarildi: { label: 'Bajarilgan', tone: 'green' },
  kech: { label: 'Muddatidan kech bajarilgan', tone: 'amber' },
  rad: { label: 'Rad etilgan', tone: 'red' },
};

export default function Inbox() {
  const { role, apps } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const box = useMemo(() => inboxFor(role!, apps), [role, apps]);
  const visible = BOXES.filter((b) => box[b.id].length || b.id === 'korib');
  const active = (params.get('quti') as BoxId) || 'korib';
  const meta = BOXES.find((b) => b.id === active) ?? BOXES[0];
  const rows = (box[active] ?? []).filter((r) =>
    `${r.app.id} ${r.app.company} ${r.app.sector} ${r.app.region}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const showKey = rows.some((r) => r.key);

  return (
    <>
      <PageHeader title="Hujjat aylanishi" subtitle="Arizalar sizga kelgan qutilar bo'yicha — muddat va holat bilan" />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-1">
            {visible.map((b) => (
              <button
                key={b.id}
                onClick={() => setParams({ quti: b.id })}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
                  b.id === active ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {b.label}
                <span
                  className={`rounded-full px-2 text-xs font-semibold ${
                    b.id === active ? 'bg-white/20' : box[b.id].some((r) => r.state === 'otgan') ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {box[b.id].length}
                </span>
              </button>
            ))}
          </div>
          <div className="relative lg:ml-auto lg:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ariza, biznes, tarmoq…" className={`${inputCls} pl-9`} />
          </div>
        </div>
        <p className="border-b border-slate-100 px-5 py-2 text-xs text-slate-500">{meta.hint}</p>

        {rows.length === 0 ? (
          <Empty>{q ? 'Hech narsa topilmadi' : "Bu qutida hozircha ariza yo'q"}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Bajarish muddati</th>
                  <th className="px-3 py-3 font-medium">Ariza</th>
                  {showKey && <th className="px-3 py-3 font-medium">Qo'mita</th>}
                  <th className="px-3 py-3 text-right font-medium">Summa</th>
                  <th className="px-3 py-3 font-medium">Bosqich</th>
                  <th className="px-5 py-3 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.app.id}:${r.key ?? ''}`}
                    onClick={() => navigate(`/arizalar/${r.app.id}`)}
                    className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${r.state === 'otgan' ? 'bg-rose-50/60' : ''}`}
                  >
                    <td className="px-5 py-3 tabular-nums text-slate-400">{i + 1}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {r.deadline ? (
                        <>
                          <div className="tabular-nums text-slate-900">{dateTime(r.deadline)}</div>
                          {['jarayonda', 'yaqin', 'otgan', 'qayta'].includes(r.state) && (
                            <div className={`text-xs ${r.state === 'otgan' ? 'text-rose-600' : r.state === 'yaqin' ? 'text-amber-800' : 'text-slate-500'}`}>
                              {remaining(r.deadline)}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{r.app.company}</div>
                      <div className="text-xs text-slate-500">
                        {r.app.id} · {r.app.sector}
                      </div>
                    </td>
                    {showKey && <td className="px-3 py-3 text-slate-600">{r.key ? REVIEW_BODY[r.key].title : 'Loyiha menejeri'}</td>}
                    <td className="px-3 py-3 text-right font-medium tabular-nums">{shortMoney(r.app.amount)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={STAGE_TONE[r.app.stage]}>{STAGE_LABEL[r.app.stage]}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={ROW_STATE[r.state].tone}>{ROW_STATE[r.state].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
