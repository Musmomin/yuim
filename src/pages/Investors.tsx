import { Badge, Card, PageHeader } from '../components/ui';
import { INVESTORS } from '../data/mock';
import { shortMoney } from '../../shared/format';
import { useStore } from '../store';

export default function Investors() {
  const { apps } = useStore();
  return (
    <>
      <PageHeader title="Investorlar" subtitle="Investor sheriklar reyestri va mablag'lar joylashuvi" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Investor</th>
                <th className="px-3 py-3 font-medium">STIR</th>
                <th className="px-3 py-3 text-right font-medium">Ajratilgan mablag'</th>
                <th className="px-3 py-3 text-right font-medium">Joylashtirilgan</th>
                <th className="px-3 py-3 font-medium">Bandlik</th>
                <th className="px-5 py-3 text-right font-medium">Faol shartnomalar</th>
              </tr>
            </thead>
            <tbody>
              {INVESTORS.map((i) => {
                const active = apps.filter((a) => a.investor === i.name && a.stage === 'moliyalashtirildi');
                const placed = active.reduce((s, a) => s + a.amount, 0);
                const pct = Math.min(100, (placed / i.capital) * 100);
                return (
                  <tr key={i.id} className="border-b border-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{i.name}</div>
                      <div className="text-xs text-slate-500">{i.contact}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {i.stir} <Badge>{i.type}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{shortMoney(i.capital)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{shortMoney(placed)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{active.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
