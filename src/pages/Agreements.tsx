import { useNavigate } from 'react-router-dom';
import { Badge, Card, Empty, PageHeader } from '../components/ui';
import { date, shortMoney } from '../lib/format';
import { STAGE_LABEL, STAGE_TONE } from '../lib/labels';
import { useStore } from '../store';

export default function Agreements() {
  const { apps, role, user } = useStore();
  const navigate = useNavigate();
  const list = apps.filter((a) => a.agreementNo && (role !== 'investor' || a.investor === user));

  return (
    <>
      <PageHeader title="Shartnomalar" subtitle="Oddiy shirkat (birgalikdagi faoliyat) shartnomalari reyestri" />
      <Card>
        {list.length === 0 ? (
          <Empty>Shartnomalar yo'q</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Raqam</th>
                  <th className="px-3 py-3 font-medium">Ijrochi sherik</th>
                  <th className="px-3 py-3 font-medium">Investor</th>
                  <th className="px-3 py-3 text-right font-medium">Investor hissasi</th>
                  <th className="px-3 py-3 text-right font-medium">Foyda nisbati</th>
                  <th className="px-3 py-3 font-medium">Muddat</th>
                  <th className="px-5 py-3 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const end = new Date(a.fundedAt!);
                  end.setMonth(end.getMonth() + a.termMonths);
                  return (
                    <tr
                      key={a.id}
                      onClick={() => role !== 'investor' && navigate(`/arizalar/${a.id}`)}
                      className={`border-b border-slate-50 ${role !== 'investor' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">{a.agreementNo}</td>
                      <td className="px-3 py-3">{a.company}</td>
                      <td className="px-3 py-3">{a.investor}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{shortMoney(a.amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {a.investorShare}% / {100 - a.investorShare}%
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {date(a.fundedAt)} – {date(end.toISOString())}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={STAGE_TONE[a.stage]}>{a.stage === 'moliyalashtirildi' ? 'Amalda' : STAGE_LABEL[a.stage]}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
