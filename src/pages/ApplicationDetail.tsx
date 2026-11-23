import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, CheckCircle2, FileText, Info, RotateCcw, Send, ShieldAlert, XCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader, inputCls, KV, PageHeader, RiskMeter, StageTracker } from '../components/ui';
import { INVESTORS } from '../data/mock';
import type { Application, ReviewKey } from '../data/types';
import { date, dateTime, money, shortMoney } from '../lib/format';
import { ACTIVITY_LABEL, REVIEW_BODY, REVIEW_LABEL, REVIEW_TONE, RISK_LABEL, RISK_TONE, STAGE_LABEL, STAGE_TONE } from '../lib/labels';
import { useStore } from '../store';

const DOCS = [
  'Davlat ro\'yxatidan o\'tganlik guvohnomasi',
  'Ustav',
  "Oxirgi 12 oylik moliyaviy hisobot (1-, 2-shakl)",
  'Bank hisob raqamidan ko\'chirma',
  'Biznes-reja va mablag\'dan foydalanish rejasi',
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const { apps, audit, role, user } = useStore();
  const a = apps.find((x) => x.id === id);

  if (!a) {
    return (
      <Card className="p-10 text-center">
        <p className="text-slate-600">Ariza topilmadi.</p>
        <Link to="/arizalar" className="mt-3 inline-block text-emerald-700 hover:underline">
          Arizalar ro'yxatiga qaytish
        </Link>
      </Card>
    );
  }
  if (role === 'biznes' && a.company !== user) {
    return <Card className="p-10 text-center text-slate-600">Bu arizani ko'rish huquqingiz yo'q.</Card>;
  }

  const history = audit.filter((e) => e.target === a.id);
  const isStaff = role !== 'biznes' && role !== 'investor';

  return (
    <>
      <Link to={role === 'biznes' ? '/' : '/arizalar'} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
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
                {(['komplayens', 'investitsiya', 'yuridik'] as ReviewKey[]).map((k) => (
                  <ReviewRow key={k} a={a} k={k} />
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Hujjatlar" subtitle="Test versiyada fayllar yuklanmaydi" />
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
          {isStaff && <AiCard a={a} />}
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
  const ai = a.ai;
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
  const { role, review } = useStore();
  const [comment, setComment] = useState('');
  const r = a.reviews[k];
  const body = REVIEW_BODY[k];
  const stageOk = k === 'yuridik' ? a.stage === 'yuridik' : a.stage === 'korik';
  const canAct = (role === k || role === 'admin') && stageOk && r.status !== 'tasdiqlandi';

  const act = (status: 'tasdiqlandi' | 'rad' | 'qayta') => {
    if (status !== 'tasdiqlandi' && !comment.trim()) {
      alertMissing();
      return;
    }
    review(a.id, k, status, comment.trim());
    setComment('');
  };
  const [missing, setMissing] = useState(false);
  const alertMissing = () => setMissing(true);

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
            <Button onClick={() => act('tasdiqlandi')}>
              <CheckCircle2 size={16} /> Tasdiqlash
            </Button>
            <Button variant="warning" onClick={() => act('qayta')}>
              <RotateCcw size={16} /> Qayta ishlashga
            </Button>
            <Button variant="danger" onClick={() => act('rad')}>
              <XCircle size={16} /> Rad etish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerActions({ a }: { a: Application }) {
  const { role, submitToCommittees, fund, complete } = useStore();
  const [investor, setInvestor] = useState(INVESTORS[0].name);
  if (role !== 'menejer' && role !== 'admin') return null;

  if (a.stage === 'yangi') {
    return (
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-sky-200 bg-sky-50 p-4">
        <p className="text-sm text-sky-900">Ariza to'liqligini tekshiring va qo'mitalar ko'rigiga yuboring.</p>
        <Button onClick={() => submitToCommittees(a.id)}>
          <Send size={16} /> Qo'mitalarga yuborish
        </Button>
      </Card>
    );
  }
  if (a.stage === 'imzolash') {
    return (
      <Card className="mb-6 flex flex-wrap items-center gap-3 border-violet-200 bg-violet-50 p-4">
        <p className="flex-1 text-sm text-violet-900">
          Barcha xulosalar ijobiy. Oddiy shirkat shartnomasi imzolangach, investorni belgilab moliyalashtirishni tasdiqlang.
        </p>
        <select value={investor} onChange={(e) => setInvestor(e.target.value)} className={`${inputCls} w-auto`}>
          {INVESTORS.map((i) => (
            <option key={i.id}>{i.name}</option>
          ))}
        </select>
        <Button onClick={() => fund(a.id, investor)}>Imzolandi — moliyalashtirish</Button>
      </Card>
    );
  }
  if (a.stage === 'moliyalashtirildi') {
    return (
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-slate-600">
          Shartnoma <b>{a.agreementNo}</b> · investor {a.investor} · {date(a.fundedAt)} dan
        </p>
        <Button variant="secondary" onClick={() => complete(a.id)}>
          Shartnomani yakunlash
        </Button>
      </Card>
    );
  }
  return null;
}
