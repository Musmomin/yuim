import { Link } from 'react-router-dom';
import { AlertTriangle, Banknote, ClipboardCheck, FilePlus2, FileSignature, Hourglass, TrendingUp } from 'lucide-react';
import AppTable from '../components/AppTable';
import { Badge, Button, Card, CardHeader, Empty, PageHeader, StageTracker, Stat } from '../components/ui';
import type { Application } from '../../shared/types';
import { dateTime, shortMoney } from '../../shared/format';
import { ROLE_TONE, STAGE_FLOW, STAGE_LABEL, STAGE_TONE } from '../lib/labels';
import { ROLES } from '../data/mock';
import { profitOf, tasksFor, useStore } from '../store';

export function alertsOf(apps: Application[]) {
  return apps
    .filter((a) => a.stage === 'moliyalashtirildi' && a.reports.length)
    .flatMap((a) => {
      const last = a.reports[a.reports.length - 1];
      const p = profitOf(last);
      return p < last.plan * 0.7 ? [{ app: a, profit: p, plan: last.plan }] : [];
    });
}

export function investorProfit(a: Application) {
  return a.reports.reduce((s, r) => s + Math.max(0, profitOf(r)), 0) * (a.investorShare / 100);
}

export default function Dashboard() {
  const { role } = useStore();
  if (role === 'biznes') return <BusinessHome />;
  if (role === 'investor') return <InvestorHome />;
  return <StaffHome />;
}

function StaffHome() {
  const { apps, audit, role, user } = useStore();
  const active = apps.filter((a) => a.stage === 'moliyalashtirildi');
  const inReview = apps.filter((a) => ['yangi', 'korik', 'yuridik', 'imzolash'].includes(a.stage));
  const tasks = tasksFor(role, apps);
  const alerts = alertsOf(apps);
  const counts = STAGE_FLOW.map((s) => ({ ...s, n: apps.filter((a) => a.stage === s.id).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));

  return (
    <>
      <PageHeader title={`Xush kelibsiz, ${user}`} subtitle="Portfel va jarayonlarning umumiy holati" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Faol portfel" value={shortMoney(active.reduce((s, a) => s + a.amount, 0))} hint={`${active.length} ta faol shartnoma`} icon={<Banknote size={18} />} />
        <Stat label="Ko'rib chiqilayotgan arizalar" value={inReview.length} hint={shortMoney(inReview.reduce((s, a) => s + a.amount, 0))} icon={<Hourglass size={18} />} />
        <Stat label="Mening vazifalarim" value={tasks.length} hint="Sizning qaroringizni kutmoqda" icon={<ClipboardCheck size={18} />} />
        <Stat label="Monitoring ogohlantirishlari" value={alerts.length} hint="Foyda rejadan 30%+ past" icon={<AlertTriangle size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Arizalar oqimi" subtitle="Har bir bosqichdagi arizalar soni" />
          <div className="space-y-3 p-5">
            {counts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 text-slate-600">{c.label}</span>
                <div className="h-6 flex-1 rounded bg-slate-100">
                  <div className="h-6 rounded bg-emerald-600/80" style={{ width: `${(c.n / max) * 100}%`, minWidth: c.n ? 24 : 0 }} />
                </div>
                <span className="w-6 text-right font-semibold tabular-nums">{c.n}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Ogohlantirishlar" />
          {alerts.length ? (
            <ul className="divide-y divide-slate-100">
              {alerts.map(({ app, profit, plan }) => (
                <li key={app.id} className="px-5 py-3 text-sm">
                  <Link to="/monitoring" className="font-medium text-slate-900 hover:underline">
                    {app.company}
                  </Link>
                  <p className="text-slate-500">
                    Oxirgi oy foydasi {shortMoney(profit)} — reja {shortMoney(plan)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Ogohlantirish yo'q</Empty>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Vazifalarim" action={<Link to="/vazifalar" className="text-sm text-emerald-700 hover:underline">Barchasi</Link>} />
          <AppTable apps={tasks.slice(0, 5)} empty="Hozircha sizdan harakat talab qilinmaydi" />
        </Card>
        <Card>
          <CardHeader title="So'nggi harakatlar" />
          <ul className="divide-y divide-slate-100">
            {audit.slice(0, 6).map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge tone={ROLE_TONE[e.role]}>{ROLES.find((r) => r.id === e.role)?.label}</Badge>
                </div>
                <p className="mt-1 text-slate-800">{e.action}</p>
                <p className="text-xs text-slate-500">
                  {e.user} · {dateTime(e.at)} {e.target && `· ${e.target}`}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function BusinessHome() {
  const { apps, user } = useStore();
  const mine = apps.filter((a) => a.company === user);
  return (
    <>
      <PageHeader
        title={user}
        subtitle="Arizalaringiz holati"
        action={
          <Link to="/arizalar/yangi">
            <Button>
              <FilePlus2 size={16} /> Yangi ariza
            </Button>
          </Link>
        }
      />
      {mine.length === 0 && (
        <Card>
          <Empty>Hali ariza topshirilmagan.</Empty>
        </Card>
      )}
      <div className="space-y-4">
        {mine.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link to={`/arizalar/${a.id}`} className="text-lg font-semibold text-slate-900 hover:underline">
                  {a.id} — {shortMoney(a.amount)}
                </Link>
                <p className="text-sm text-slate-500">{a.purpose}</p>
              </div>
              <Badge tone={STAGE_TONE[a.stage]}>{STAGE_LABEL[a.stage]}</Badge>
            </div>
            <div className="mt-5">
              <StageTracker stage={a.stage} />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Mas'ul menejer: <span className="font-medium">{a.manager}</span> · Ko'rib chiqish muddati: 14 kungacha
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}

function InvestorHome() {
  const { apps, user } = useStore();
  const mine = apps.filter((a) => a.investor === user);
  const active = mine.filter((a) => a.stage === 'moliyalashtirildi');
  const invested = active.reduce((s, a) => s + a.amount, 0);
  const earned = mine.reduce((s, a) => s + investorProfit(a), 0);
  return (
    <>
      <PageHeader title={user} subtitle="Investitsiya portfelingiz" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Faol investitsiya" value={shortMoney(invested)} hint={`${active.length} ta faol shartnoma`} icon={<Banknote size={18} />} />
        <Stat label="Hisoblangan foyda ulushi" value={shortMoney(earned)} hint="Barcha shartnomalar bo'yicha" icon={<TrendingUp size={18} />} />
        <Stat label="Jami shartnomalar" value={mine.length} hint="Faol va yakunlangan" icon={<FileSignature size={18} />} />
      </div>
      <Card className="mt-6">
        <CardHeader title="Shartnomalarim" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Shartnoma</th>
                <th className="px-3 py-3 font-medium">Ijrochi sherik</th>
                <th className="px-3 py-3 text-right font-medium">Hissa</th>
                <th className="px-3 py-3 text-right font-medium">Ulush</th>
                <th className="px-3 py-3 text-right font-medium">Foyda ulushi</th>
                <th className="px-5 py-3 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium">{a.agreementNo}</td>
                  <td className="px-3 py-3">{a.company}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{shortMoney(a.amount)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{a.investorShare}%</td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-700">{shortMoney(investorProfit(a))}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STAGE_TONE[a.stage]}>{STAGE_LABEL[a.stage]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
