import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bot, ShieldAlert } from 'lucide-react';
import { analyze } from '../../shared/analyze';
import { Badge, Button, Card, CardHeader, ErrorBanner, Field as BaseField, inputCls, PageHeader, RiskMeter } from '../components/ui';
import { REGIONS, SECTORS } from '../../shared/policy';
import type { ApplicationInput } from '../../shared/types';
import { canEdit } from '../../shared/workflow';
import { ApiError, errorMessage } from '../api';
import { ACTIVITY_LABEL, RISK_LABEL, RISK_TONE } from '../lib/labels';
import { api, useStore } from '../store';

const FIELDS: (keyof ApplicationInput)[] = [
  'company', 'stir', 'director', 'phone', 'region', 'sector', 'activity', 'amount', 'termMonths', 'investorShare', 'purpose', 'revenue12m', 'profit12m', 'employees',
];

/** Yangi ariza yoki mavjud arizani tahrirlash (/arizalar/:id/tahrir) */
export default function NewApplication() {
  const { id } = useParams();
  const { role, user, actor, refresh } = useStore();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!id);
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
  useEffect(() => {
    if (!id) return;
    api
      .application(id)
      .then(({ application: a }) => {
        if (actor && !canEdit(actor, a)) {
          setFormError("Bu arizani hozir tahrirlab bo'lmaydi");
          return;
        }
        setF(Object.fromEntries(FIELDS.map((k) => [k, a[k]])) as unknown as ApplicationInput);
        setLoaded(true);
      })
      .catch((e) => setFormError(errorMessage(e)));
  }, [id, actor]);

  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };
  const ai = useMemo(() => analyze(f), [f]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const saved = id ? await api.update(id, f) : await api.create(f);
      await refresh();
      navigate(`/arizalar/${saved.id}`);
    } catch (x) {
      if (x instanceof ApiError && x.fields) setErrors(x.fields);
      setFormError(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };

  // Maydon ostida server qaytargan xato (oddiy funksiya — komponent emas, aks holda input fokusni yo'qotadi)
  const field = (label: string, name: keyof ApplicationInput, control: ReactNode, hint?: string) => (
    <BaseField label={label} hint={errors[name] || hint} error={!!errors[name]}>
      {control}
    </BaseField>
  );

  if (!loaded) {
    return formError ? <ErrorBanner message={formError} /> : <p className="text-sm text-slate-500">Yuklanmoqda…</p>;
  }

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
