import { useState } from 'react';
import { Info } from 'lucide-react';
import { Card, CardHeader, Field, inputCls, KV, PageHeader } from '../components/ui';
import { money } from '../../shared/format';
import { profitOf, useStore } from '../store';

export default function Distribution() {
  const { apps, role, user } = useStore();
  const agreements = apps.filter((a) => a.agreementNo && (role !== 'investor' || a.investor === user));

  const [capital, setCapital] = useState(600_000_000);
  const [profit, setProfit] = useState(120_000_000);
  const [share, setShare] = useState(35);
  const [lossShare, setLossShare] = useState(100);
  const [fee, setFee] = useState(0);
  const [picked, setPicked] = useState('');

  const pick = (id: string) => {
    setPicked(id);
    const a = agreements.find((x) => x.id === id);
    if (!a) return;
    setCapital(a.amount);
    setShare(a.investorShare);
    setProfit(a.reports.reduce((s, r) => s + profitOf(r), 0));
  };

  const isLoss = profit < 0;
  const feeAmount = !isLoss ? (profit * fee) / 100 : 0;
  const base = profit - feeAmount;
  const investorPart = isLoss ? (base * lossShare) / 100 : (base * share) / 100;
  const executorPart = base - investorPart;
  const investorTotal = capital + investorPart;

  const n = (v: number, fn: (x: number) => void, step = 1_000_000, min?: number, max?: number) => (
    <input type="number" step={step} min={min} max={max} value={v} onChange={(e) => fn(Number(e.target.value))} className={inputCls} />
  );

  return (
    <>
      <PageHeader title="Foyda taqsimoti" subtitle="Shartnomada kelishilgan nisbat asosida davr natijasini taqsimlash kalkulyatori" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Kiritish" />
          <div className="space-y-4 p-5">
            <Field label="Shartnoma (ixtiyoriy)" hint="Tanlansa, qiymatlar shartnoma va hisobotlardan to'ldiriladi">
              <select value={picked} onChange={(e) => pick(e.target.value)} className={inputCls}>
                <option value="">— qo'lda kiritish —</option>
                {agreements.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.agreementNo} · {a.company}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Investor hissasi, so'm">{n(capital, setCapital)}</Field>
              <Field label="Davr natijasi (sof foyda / zarar), so'm" hint="Zarar uchun manfiy son kiriting">
                {n(profit, setProfit)}
              </Field>
              <Field label="Investorning foydadagi ulushi, %" hint={`Ijrochi sherik: ${100 - share}%`}>
                {n(share, setShare, 1, 0, 100)}
              </Field>
              <Field label="Zararning investor ko'taradigan qismi, %" hint="Shartnoma shartiga ko'ra">
                {n(lossShare, setLossShare, 1, 0, 100)}
              </Field>
              <Field label="Platforma xizmat haqi, foydadan %" hint="Shartnoma shartiga ko'ra">
                {n(fee, setFee, 0.5, 0, 100)}
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Natija" subtitle={isLoss ? 'Davr zarar bilan yakunlangan' : 'Davr foyda bilan yakunlangan'} />
          <div className="p-5">
            <div className="mb-5 flex h-4 overflow-hidden rounded-full bg-slate-100">
              {!isLoss && base > 0 && (
                <>
                  <div className="bg-emerald-600" style={{ width: `${share}%` }} title="Investor" />
                  <div className="bg-sky-500" style={{ width: `${100 - share}%` }} title="Ijrochi sherik" />
                </>
              )}
              {isLoss && (
                <>
                  <div className="bg-rose-500" style={{ width: `${lossShare}%` }} />
                  <div className="bg-rose-300" style={{ width: `${100 - lossShare}%` }} />
                </>
              )}
            </div>
            <dl className="divide-y divide-slate-100">
              <KV k="Davr natijasi" v={money(profit)} />
              {!isLoss && <KV k={`Platforma xizmat haqi (${fee}%)`} v={money(feeAmount)} />}
              <KV k={isLoss ? 'Investorga tushadigan zarar' : 'Investorning foyda ulushi'} v={<span className={isLoss ? 'text-rose-600' : 'text-emerald-700'}>{money(investorPart)}</span>} />
              <KV k={isLoss ? 'Ijrochi sherikka tushadigan zarar' : 'Ijrochi sherikning foyda ulushi'} v={money(executorPart)} />
              <KV k="Investorga qaytariladigan jami summa" v={<b>{money(investorTotal)}</b>} />
              <KV k="Investor daromadliligi (davr)" v={`${capital ? ((investorPart / capital) * 100).toFixed(2) : 0}%`} />
            </dl>
            <p className="mt-4 flex gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <Info size={14} className="mt-0.5 shrink-0" />
              Daromad oldindan qat'iy belgilanmaydi — u faqat faoliyatning haqiqiy natijasiga bog'liq. Ijrochi sherikning aybi bilan
              yetkazilgan zarar shartnomaga muvofiq alohida undiriladi.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
