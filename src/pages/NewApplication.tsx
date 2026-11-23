import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ShieldAlert } from 'lucide-react';
import { analyze } from '../ai/analyze';
import { Badge, Button, Card, CardHeader, Field, inputCls, PageHeader, RiskMeter } from '../components/ui';
import { REGIONS, SECTORS } from '../data/policy';
import type { ApplicationInput } from '../data/types';
import { ACTIVITY_LABEL, RISK_LABEL, RISK_TONE } from '../lib/labels';
import { useStore } from '../store';

export default function NewApplication() {
  const { role, user, addApplication } = useStore();
  const navigate = useNavigate();
  const [f, setF] = useState<ApplicationInput>({
    company: role === 'biznes' ? user : '',
    stir: '',
    director: '',
    phone: '+998 ',
    region: REGIONS[0],
    sector: SECTORS[0],
    activity: '',
    amount: 500_000_000,
    termMonths: 12,
    investorShare: 40,
    purpose: '',
    revenue12m: 0,
    profit12m: 0,
    employees: 10,
  });
  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const ai = useMemo(() => analyze(f), [f]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = addApplication(f);
    navigate(`/arizalar/${id}`);
  };

  const numInput = (k: keyof ApplicationInput, step = 1_000_000) => (
    <input
      type="number"
      min={0}
      step={step}
      required
      value={f[k] as number}
      onChange={(e) => set(k, Number(e.target.value) as never)}
      className={inputCls}
    />
  );

  return (
    <>
      <PageHeader title="Yangi ariza" subtitle="Birgalikdagi faoliyat (oddiy shirkat) asosida investitsiya olish uchun ariza" />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="1. Kompaniya" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Kompaniya nomi">
                <input required value={f.company} onChange={(e) => set('company', e.target.value)} className={inputCls} placeholder="… MChJ" />
              </Field>
              <Field label="STIR">
                <input required value={f.stir} onChange={(e) => set('stir', e.target.value)} className={inputCls} placeholder="9 xonali raqam" />
              </Field>
              <Field label="Rahbar F.I.Sh.">
                <input required value={f.director} onChange={(e) => set('director', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Telefon">
                <input required value={f.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Hudud">
                <select value={f.region} onChange={(e) => set('region', e.target.value)} className={inputCls}>
                  {REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tarmoq">
                <select value={f.sector} onChange={(e) => set('sector', e.target.value)} className={inputCls}>
                  {SECTORS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Faoliyat turi (batafsil)">
                  <input required value={f.activity} onChange={(e) => set('activity', e.target.value)} className={inputCls} placeholder="Masalan: ofis mebellari ishlab chiqarish" />
                </Field>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Moliyaviy ko'rsatkichlar (oxirgi 12 oy)" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="Tushum, so'm">{numInput('revenue12m')}</Field>
              <Field label="Sof foyda, so'm">{numInput('profit12m')}</Field>
              <Field label="Xodimlar soni">{numInput('employees', 1)}</Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="3. Investitsiya shartlari" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="So'ralgan summa, so'm">{numInput('amount', 10_000_000)}</Field>
              <Field label="Muddat, oy">{numInput('termMonths', 1)}</Field>
              <Field label="Investor ulushi, %" hint={`Ijrochi sherik ulushi: ${100 - f.investorShare}%`}>
                <input
                  type="number"
                  min={1}
                  max={99}
                  required
                  value={f.investorShare}
                  onChange={(e) => set('investorShare', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <div className="sm:col-span-3">
                <Field label="Mablag'dan foydalanish maqsadi">
                  <textarea required rows={3} value={f.purpose} onChange={(e) => set('purpose', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Bekor qilish
            </Button>
            <Button type="submit">Arizani topshirish</Button>
          </div>
        </div>

        <div>
          <Card className="lg:sticky lg:top-20">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Bot size={18} className="text-emerald-700" /> Dastlabki AI baho
                </span>
              }
              subtitle="Ma'lumot kiritilishi bilan yangilanadi"
            />
            <div className="space-y-4 p-5">
              <RiskMeter score={ai.score} />
              <div className="flex flex-wrap gap-2">
                <Badge tone={RISK_TONE[ai.level]}>{RISK_LABEL[ai.level]}</Badge>
                <Badge tone={ai.activity === 'cheklangan' ? 'red' : 'green'}>{ACTIVITY_LABEL[ai.activity]}</Badge>
              </div>
              <p className="text-sm text-slate-700">{ai.summary}</p>
              {ai.flags.map((fl) => (
                <p key={fl} className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0" /> {fl}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
