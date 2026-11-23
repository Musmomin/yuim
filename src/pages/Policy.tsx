import { Ban, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, PageHeader } from '../components/ui';
import { CRITERIA, RESTRICTED, SECTORS } from '../data/policy';

export default function Policy() {
  return (
    <>
      <PageHeader
        title="Investitsiya siyosati"
        subtitle="Komplayens skriningi va qo'mitalar qarori shu hujjatga tayanadi (test versiya — Komplayens qo'mitasi tasdiqlaydi)"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Ustuvor tarmoqlar" subtitle="Ruxsat etilgan faoliyat yo'nalishlari" />
          <ul className="grid gap-2 p-5 sm:grid-cols-2">
            {SECTORS.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-600" /> {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Cheklangan faoliyat turlari" subtitle="Bu yo'nalishlarga investitsiya kiritilmaydi" />
          <ol className="space-y-2 p-5">
            {RESTRICTED.map((r, i) => (
              <li key={r.name} className="flex gap-2 text-sm text-slate-700">
                <Ban size={16} className="mt-0.5 shrink-0 text-rose-500" />
                <span>
                  <b>{i + 1}.</b> {r.name}
                </span>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Moliyaviy mezonlar" subtitle="Investitsiya qo'mitasi va AI tahlili ishlatadigan chegaralar" />
          <dl className="divide-y divide-slate-100 px-5">
            {CRITERIA.map((c) => (
              <div key={c.name} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-slate-600">{c.name}</dt>
                <dd className="font-medium text-slate-900">{c.rule}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
