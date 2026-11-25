import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, CheckCircle2, FileText, Info, Pencil, RotateCcw, Send, ShieldAlert, XCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader, ErrorBanner, Field, inputCls, KV, PageHeader, RiskMeter, StageTracker } from '../components/ui';
import type { Application, ReviewKey } from '../../shared/types';
import { REVIEW_KEYS } from '../../shared/types';
import { date, dateTime, money, shortMoney } from '../../shared/format';
import * as wf from '../../shared/workflow';
import { ApiError, errorMessage, type ApplicationDetail as Detail } from '../api';
import { ACTIVITY_LABEL, REVIEW_BODY, REVIEW_LABEL, REVIEW_TONE, RISK_LABEL, RISK_TONE, STAGE_LABEL, STAGE_TONE } from '../lib/labels';
import { api, useStore } from '../store';

const DOCS = [
  'Davlat ro\'yxatidan o\'tganlik guvohnomasi',
  'Ustav',
  "Oxirgi 12 oylik moliyaviy hisobot (1-, 2-shakl)",
  'Bank hisob raqamidan ko\'chirma',
  'Biznes-reja va mablag\'dan foydalanish rejasi',
];

export default function ApplicationDetail() {
  const { id = '' } = useParams();
  const { role, actor, version } = useStore();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadError, setLoadError] = useState<ApiError | Error | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .application(id)
      .then((d) => alive && (setDetail(d), setLoadError(null)))
      .catch((e) => alive && setLoadError(e));
    return () => {
      alive = false;
    };
  }, [id, version]);

  const back = role === 'biznes' || role === 'investor' ? '/' : '/arizalar';

  if (loadError) {
    const notFound = loadError instanceof ApiError && loadError.status === 404;
    return (
      <Card className="p-10 text-center">
        <p className="text-slate-600">{notFound ? "Ariza topilmadi yoki uni ko'rish huquqingiz yo'q." : errorMessage(loadError)}</p>
        <Link to={back} className="mt-3 inline-block text-emerald-700 hover:underline">
          Orqaga qaytish
        </Link>
      </Card>
    );
  }
  if (!detail || !actor) return <p className="text-sm text-slate-500">Yuklanmoqda…</p>;

  const a = detail.application;
  const history = detail.history;
  const isStaff = wf.isStaff(actor.role);

  return (
    <>
      <Link to={back} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Orqaga
      </Link>
      <PageHeader
        title={a.company}
        subtitle={`${a.id} · STIR ${a.stir} · ${a.region} · topshirilgan ${date(a.submittedAt)}`}
        action={<Badge tone={STAGE_TONE[a.stage]}>{STAGE_LABEL[a.stage]}</Badge>}
      />
      <Card className="mb-6 p-5">
        <StageTracker stage={a.stage} />
      </Card>

      <ReturnedNotice a={a} />
      <ManagerActions a={a} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Ariza ma'lumotlari" />
            <div className="grid gap-x-8 px-5 py-2 sm:grid-cols-2">
              <dl className="divide-y divide-slate-100">
                <KV k="So'ralgan investitsiya" v={money(a.amount)} />
                <KV k="Muddat" v={`${a.termMonths} oy`} />
                <KV k="Foyda taqsimoti (investor / ijrochi)" v={`${a.investorShare}% / ${100 - a.investorShare}%`} />
                <KV k="Tarmoq" v={a.sector} />
              </dl>
              <dl className="divide-y divide-slate-100">
                <KV k="Rahbar" v={a.director} />
                <KV k="Telefon" v={a.phone} />
                <KV k="Xodimlar soni" v={a.employees} />
                <KV k="Mas'ul menejer" v={a.manager} />
              </dl>
            </div>
            <div className="border-t border-slate-100 px-5 py-4 text-sm">
              <p className="text-slate-500">Faoliyat turi</p>
              <p className="font-medium text-slate-900">{a.activity}</p>
              <p className="mt-3 text-slate-500">Mablag'dan foydalanish maqsadi</p>
              <p className="font-medium text-slate-900">{a.purpose}</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Moliyaviy ko'rsatkichlar" subtitle="Oxirgi 12 oy" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Metric label="Tushum" value={shortMoney(a.revenue12m)} />
              <Metric label="Sof foyda" value={shortMoney(a.profit12m)} />
              <Metric label="Sof foyda marjasi" value={a.revenue12m ? `${((a.profit12m / a.revenue12m) * 100).toFixed(1)}%` : '—'} />
            </div>
          </Card>

          {isStaff && (
            <Card>
              <CardHeader title="Qo'mitalar xulosalari" subtitle="Komplayens va investitsiya qo'mitalari parallel ko'radi, so'ng yuridik ekspertiza" />
              <div className="divide-y divide-slate-100">
                {REVIEW_KEYS.map((k) => (
                  <ReviewRow key={k} a={a} k={k} />
                ))}
              </div>
            </Card>
          )}

          {(a.stage === 'moliyalashtirildi' || a.stage === 'yakunlandi') && <Reports a={a} />}

          <Card>
            <CardHeader title="Hujjatlar" subtitle="Fayl yuklash keyingi bosqichda qo'shiladi" />
            <ul className="divide-y divide-slate-100">
              {DOCS.map((d, i) => (
                <li key={d} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <FileText size={16} className="text-slate-400" />
                  <span className="flex-1">{d}</span>
                  {i < 4 || a.stage !== 'yangi' ? <Badge tone="green">Yuklangan</Badge> : <Badge tone="amber">Kutilmoqda</Badge>}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          {isStaff && a.ai && <AiCard a={a} />}
          <Card>
            <CardHeader title="Jarayon tarixi" />
            {history.length ? (
              <ol className="space-y-4 p-5">
                {history.map((e) => (
                  <li key={e.id} className="relative pl-5 text-sm">
                    <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-emerald-600" />
                    <p className="text-slate-800">{e.action}</p>
                    <p className="text-xs text-slate-500">
                      {e.user} · {dateTime(e.at)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-5 text-sm text-slate-500">Yozuvlar yo'q</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AiCard({ a }: { a: Application }) {
  const ai = a.ai!;
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Bot size={18} className="text-emerald-700" /> AI tahlili
          </span>
        }
        action={<Badge tone={RISK_TONE[ai.level]}>{RISK_LABEL[ai.level]}</Badge>}
      />
      <div className="space-y-4 p-5">
        <RiskMeter score={ai.score} />
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Komplayens skriningi</span>
          <Badge tone={ai.activity === 'cheklangan' ? 'red' : 'green'}>{ACTIVITY_LABEL[ai.activity]}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Tavsiya etilgan investor ulushi</span>
          <span className="font-semibold">{ai.suggestedShare}%</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{ai.summary}</p>
        {ai.flags.length > 0 && (
          <ul className="space-y-2">
            {ai.flags.map((f) => (
              <li key={f} className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        )}
        <p className="flex gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          AI faqat tavsiya beradi. Yakuniy qarorni mas'ul qo'mita a'zosi qabul qiladi va u audit jurnalida qayd etiladi.
        </p>
      </div>
    </Card>
  );
}

function ReviewRow({ a, k }: { a: Application; k: ReviewKey }) {
  const { actor, perform } = useStore();
  const [comment, setComment] = useState('');
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const r = a.reviews[k];
  const body = REVIEW_BODY[k];
  const canAct = !!actor && wf.canReview(actor, a, k);

  const act = async (status: 'tasdiqlandi' | 'rad' | 'qayta') => {
    if (status !== 'tasdiqlandi' && !comment.trim()) {
      setMissing(true);
      return;
    }
    setBusy(true);
    const ok = await perform(() => api.review(a.id, k, status, comment.trim()));
    setBusy(false);
    if (ok) setComment('');
  };

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{body.title}</p>
          <p className="text-xs text-slate-500">{body.desc}</p>
        </div>
        <Badge tone={REVIEW_TONE[r.status]}>{REVIEW_LABEL[r.status]}</Badge>
      </div>
      {r.by && (
        <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
          {r.comment && <p className="text-slate-800">«{r.comment}»</p>}
          <p className="mt-1 text-xs text-slate-500">
            {r.by} · {r.at && dateTime(r.at)}
          </p>
        </div>
      )}
      {canAct && (
        <div className="mt-3 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setMissing(false);
            }}
            rows={2}
            placeholder="Xulosa / izoh (rad etish va qaytarishda majburiy)"
            className={`${inputCls} ${missing ? 'border-rose-400' : ''}`}
          />
          {missing && <p className="text-xs text-rose-600">Rad etish yoki qaytarish uchun izoh yozing.</p>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => act('tasdiqlandi')}>
              <CheckCircle2 size={16} /> Tasdiqlash
            </Button>
            <Button disabled={busy} variant="warning" onClick={() => act('qayta')}>
              <RotateCcw size={16} /> Qayta ishlashga
            </Button>
            <Button disabled={busy} variant="danger" onClick={() => act('rad')}>
              <XCircle size={16} /> Rad etish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Qaytarilgan ariza: sababni ko'rsatadi, tahrirlash va qayta yuborish imkonini beradi */
function ReturnedNotice({ a }: { a: Application }) {
  const { actor, perform } = useStore();
  if (a.stage !== 'qaytarildi' || !actor) return null;
  const reasons = REVIEW_KEYS.filter((k) => a.reviews[k].status === 'qayta');
  const canEdit = wf.canEdit(actor, a);
  const canSubmit = wf.canSubmit(actor, a);
  return (
    <Card className="mb-6 border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-900">Ariza qayta ishlashga qaytarildi</p>
      <ul className="mt-2 space-y-1 text-sm text-amber-900">
        {reasons.map((k) => (
          <li key={k}>
            <b>{REVIEW_BODY[k].title}:</b> {a.reviews[k].comment ?? '—'}
          </li>
        ))}
      </ul>
      {(canEdit || canSubmit) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {canEdit && (
            <Link to={`/arizalar/${a.id}/tahrir`}>
              <Button variant="secondary">
                <Pencil size={16} /> Tuzatish
              </Button>
            </Link>
          )}
          {canSubmit && (
            <Button onClick={() => perform(() => api.submit(a.id))}>
              <Send size={16} /> Qayta yuborish
            </Button>
          )}
        </div>
      )}
      {canSubmit && <p className="mt-2 text-xs text-amber-800">Qayta yuborilganda barcha qo'mitalar arizani yangidan ko'rib chiqadi.</p>}
    </Card>
  );
}

function ManagerActions({ a }: { a: Application }) {
  const { actor, role, investors, perform } = useStore();
  const [investorId, setInvestorId] = useState('');
  if (role !== 'menejer' && role !== 'admin') return null;

  if (a.stage === 'yangi' && actor) {
    return (
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-sky-200 bg-sky-50 p-4">
        <p className="text-sm text-sky-900">Ariza to'liqligini tekshiring va qo'mitalar ko'rigiga yuboring.</p>
        <div className="flex gap-2">
          {wf.canEdit(actor, a) && (
            <Link to={`/arizalar/${a.id}/tahrir`}>
              <Button variant="secondary">
                <Pencil size={16} /> Tahrirlash
              </Button>
            </Link>
          )}
          <Button onClick={() => perform(() => api.submit(a.id))}>
            <Send size={16} /> Qo'mitalarga yuborish
          </Button>
        </div>
      </Card>
    );
  }
  if (a.stage === 'imzolash') {
    const selected = investorId || investors[0]?.id || '';
    return (
      <Card className="mb-6 flex flex-wrap items-center gap-3 border-violet-200 bg-violet-50 p-4">
        <p className="flex-1 text-sm text-violet-900">
          Barcha xulosalar ijobiy. Oddiy shirkat shartnomasi imzolangach, investorni belgilab moliyalashtirishni tasdiqlang.
        </p>
        <select value={selected} onChange={(e) => setInvestorId(e.target.value)} className={`${inputCls} w-auto`}>
          {investors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <Button disabled={!selected} onClick={() => perform(() => api.fund(a.id, selected))}>
          Imzolandi — moliyalashtirish
        </Button>
      </Card>
    );
  }
  if (a.stage === 'moliyalashtirildi') {
    return (
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-slate-600">
          Shartnoma <b>{a.agreementNo}</b> · investor {a.investor} · {date(a.fundedAt)} dan
        </p>
        <Button variant="secondary" onClick={() => perform(() => api.complete(a.id))}>
          Shartnomani yakunlash
        </Button>
      </Card>
    );
  }
  return null;
}

/** Oylik hisobotlar: ro'yxat va (biznes yoki menejer uchun) yangi hisobot formasi */
function Reports({ a }: { a: Application }) {
  const { actor, refresh } = useStore();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const [f, setF] = useState({
    month: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
    revenue: 0,
    expenses: 0,
    plan: a.reports[a.reports.length - 1]?.plan ?? 0,
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const can = !!actor && wf.canAddReport(actor, a);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.addReport(a.id, f);
      await refresh();
    } catch (x) {
      setErr(x instanceof ApiError && x.fields ? Object.values(x.fields).join('; ') : errorMessage(x));
    } finally {
      setBusy(false);
    }
  };
  const num = (k: 'revenue' | 'expenses' | 'plan') => (
    <input type="number" step={1_000_000} required value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} className={inputCls} />
  );

  return (
    <Card>
      <CardHeader title="Oylik hisobotlar" subtitle="Ijrochi sherikning haqiqiy natijalari" />
      {a.reports.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2 font-medium">Oy</th>
                <th className="px-3 py-2 text-right font-medium">Tushum</th>
                <th className="px-3 py-2 text-right font-medium">Xarajat</th>
                <th className="px-3 py-2 text-right font-medium">Sof foyda</th>
                <th className="px-5 py-2 text-right font-medium">Reja</th>
              </tr>
            </thead>
            <tbody>
              {a.reports.map((r) => (
                <tr key={r.month} className="border-b border-slate-50">
                  <td className="px-5 py-2">{r.month}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{shortMoney(r.revenue)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{shortMoney(r.expenses)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{shortMoney(wf.profitOf(r))}</td>
                  <td className="px-5 py-2 text-right tabular-nums text-slate-500">{shortMoney(r.plan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-slate-500">Hali hisobot topshirilmagan</p>
      )}
      {can && (
        <form onSubmit={submit} className="space-y-3 border-t border-slate-100 p-5">
          {err && <ErrorBanner message={err} />}
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Oy">
              <input type="month" required value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Tushum, so'm">{num('revenue')}</Field>
            <Field label="Xarajat, so'm">{num('expenses')}</Field>
            <Field label="Rejadagi foyda, so'm">{num('plan')}</Field>
          </div>
          <Button type="submit" disabled={busy}>
            Hisobot topshirish
          </Button>
        </form>
      )}
    </Card>
  );
}
