import { ArrowDown, ArrowRight, Bot, Building2, CheckCircle2, FlaskConical, HeartPulse, Landmark, Scale, ShieldCheck, Sprout, Users, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROLES } from '../data/mock';
import { BRAND, ORGANS, PROCESS, ROADMAP } from '../data/org';
import { Logo } from '../components/Logo';
import { useStore } from '../store';

const ORGAN_ICONS: LucideIcon[] = [ShieldCheck, Scale, Landmark, Building2, Users, Bot];

/** Loyiha ta'rifi. `landing` rejimida kirish sahifasi sifatida rollarni ham ko'rsatadi. */
export default function About({ landing = false }: { landing?: boolean }) {
  const { login } = useStore();

  return (
    <div className={landing ? 'min-h-screen bg-slate-50' : ''}>
      {/* Hero */}
      <section className={`yuim-dawn relative overflow-hidden text-white ${landing ? '' : 'rounded-2xl'}`}>
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 lg:px-8 lg:pb-20 lg:pt-10">
          {landing && (
            <div className="mb-12 flex items-center justify-between gap-4">
              <Logo height={48} />
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-400/15 px-3 py-1 text-xs font-medium text-gold-200">
                <FlaskConical size={14} /> Test versiya
              </span>
            </div>
          )}
          <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Yuksalishga umid — har bir biznes uchun</p>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight [text-wrap:balance] sm:text-5xl">
                Sog'lom AI orqali bizneslarni{' '}
                <span className="bg-gradient-to-r from-gold-200 via-gold-300 to-emerald-300 bg-clip-text text-transparent">o'stirish</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-100/85 sm:text-lg">
                YUIM investorlar mablag'ini o'sish salohiyati bor bizneslarga birgalikdagi faoliyat (oddiy shirkat) shartnomasi asosida
                yo'naltiradi. Daromad oldindan belgilanmaydi: u biznesning haqiqiy natijasidan kelishilgan nisbatda taqsimlanadi.
              </p>
              {landing && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#demo" onClick={(e) => { e.preventDefault(); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-3 text-sm font-semibold text-ink-950 shadow-lg shadow-gold-500/20 hover:bg-gold-300">
                    Demo tizimga kirish <ArrowDown size={16} />
                  </a>
                  <a href="#tamoyil" onClick={(e) => { e.preventDefault(); document.getElementById('tamoyil')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/10">
                    Tamoyillarimiz
                  </a>
                </div>
              )}
            </div>
            <HeroArt />
          </div>

          {/* Model */}
          <div className="mt-12 grid items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:p-6">
            <ModelNode icon={Wallet} title="Investor" text="Hissa qo'shadi" />
            <Flow top="hissa" bottom="foyda ulushi" />
            <ModelNode icon={Bot} title="YUIM platformasi" text="Tanlaydi, rasmiylashtiradi, kuzatadi" accent />
            <Flow top="investitsiya" bottom="hisobot" />
            <ModelNode icon={Building2} title="Ijrochi sherik" text="Biznesni yuritadi" />
          </div>
        </div>
      </section>

      <div className={`mx-auto max-w-6xl space-y-16 py-14 ${landing ? 'px-4 lg:px-8' : ''}`}>
        {/* Shior: uch tamoyil */}
        <section id="tamoyil" className="scroll-mt-6">
          <SectionTitle eyebrow="Shiorimiz" title={BRAND.slogan} text="Uch so'z — uch tamoyil. Har bir ekran va har bir qaror shularga tayanadi." />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.word} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
                <span className={`absolute inset-x-0 top-0 h-1 ${p.bar}`} />
                <span className={`inline-flex rounded-xl p-2.5 ${p.tone}`}>
                  <p.icon size={22} />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-ink-900">{p.word}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{p.lead}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Organlar */}
        <section>
          <SectionTitle eyebrow="Boshqaruv" title="Boshqaruv organlari va ularning vazifalari" text="Har bir qaror mas'ul organ tomonidan qabul qilinadi va audit jurnalida qayd etiladi." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ORGANS.map((o, i) => {
              const Icon = ORGAN_ICONS[i];
              const ai = o.title === 'AI yordamchi';
              return (
                <div key={o.title} className={`rounded-xl border p-5 ${ai ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg p-2 ${ai ? 'bg-emerald-600 text-white' : 'bg-ink-900 text-gold-300'}`}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{o.title}</h3>
                      <p className="text-xs text-slate-500">{o.role}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {o.duties.map((d) => (
                      <li key={d} className="flex gap-2 text-sm text-slate-700">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-500">AI faqat tavsiya beradi. Yakuniy qarorni har doim mas'ul organ a'zosi qabul qiladi.</p>
        </section>

        {/* Jarayon */}
        <section>
          <SectionTitle eyebrow="Jarayon" title="Arizadan foyda taqsimotigacha" text="Komplayens va investitsiya qo'mitalari bir vaqtda ishlaydi, shuning uchun ariza tezroq ko'rib chiqiladi." />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map((p, i) => (
              <li key={p.step} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white tabular-nums">{i + 1}</span>
                  <h3 className="font-semibold text-slate-900">{p.step}</h3>
                </div>
                <p className="mt-3 text-sm text-slate-700">{p.text}</p>
                <p className="mt-3 text-xs font-medium text-slate-500">Mas'ul: {p.who}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Yo'l xaritasi */}
        <section>
          <SectionTitle eyebrow="Rivojlanish" title="Bosqichlar" text="Avval yuridik shaxslar bilan (B2B), keyinchalik jismoniy shaxs investorlar uchun (B2C)." />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ROADMAP.map((r) => (
              <div key={r.phase} className={`rounded-xl border p-5 ${r.now ? 'border-emerald-600 bg-white ring-1 ring-emerald-600' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{r.phase}</span>
                  {r.now && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">Hozir</span>}
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">{r.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo rollar */}
        {landing && (
          <section id="demo" className="scroll-mt-6">
            <SectionTitle eyebrow="Demo" title="Tizimni rol bo'yicha ko'ring" text="Har bir rol o'z vazifalari va ekranlarini ko'radi. Ichkarida rolni yuqoridagi ro'yxatdan almashtirish mumkin." />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => login(r.id)}
                  className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{r.label}</span>
                    <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{r.desc}</p>
                  <p className="mt-3 text-xs text-slate-400">{r.user}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {landing && (
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          {BRAND.full} · «{BRAND.slogan}» · test versiya — barcha kompaniya va shaxslar namuna sifatida to'qilgan
        </footer>
      )}
    </div>
  );
}

const PILLARS = [
  {
    word: "Sog'lom",
    lead: "Shaffof hamkorlik, sog'lom daromad",
    text: "Daromad oldindan va'da qilinmaydi — biznesning haqiqiy natijasidan kelishilgan nisbatda bo'linadi. Har bir qaror audit jurnalida qoladi.",
    icon: HeartPulse,
    tone: 'bg-emerald-50 text-emerald-700',
    bar: 'bg-emerald-600',
  },
  {
    word: 'AI',
    lead: 'Tahlil qiladi, qaror odamniki',
    text: "Sun'iy intellekt hujjatlarni o'qiydi, risk ballini chiqaradi va rejadan og'ishni erta sezadi. Imzoni har doim mas'ul qo'mita a'zosi qo'yadi.",
    icon: Bot,
    tone: 'bg-ink-50 text-ink-700',
    bar: 'bg-ink-700',
  },
  {
    word: "O'stirish",
    lead: 'Yuksalishga umid — natijada',
    text: "Biznes kapital va kuzatuv oladi, investor esa real iqtisodiyotdagi o'sishdan ulush. Ariza 14 kunda javob oladi.",
    icon: Sprout,
    tone: 'bg-gold-50 text-gold-700',
    bar: 'bg-gold-400',
  },
];

/** Hero tasviri: o'sib boruvchi pog'onalar, o'sish chizig'i va tong quyoshi */
function HeroArt() {
  const steps: [number, number, number][] = [
    [40, 210, 46],
    [104, 180, 76],
    [168, 145, 111],
    [232, 112, 144],
  ];
  return (
    <svg viewBox="0 0 400 280" className="mx-auto hidden w-full max-w-md lg:block" aria-hidden="true">
      <defs>
        <linearGradient id="ha-step" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0b6349" stopOpacity="0.9" />
          <stop offset="1" stopColor="#3aae84" />
        </linearGradient>
        <radialGradient id="ha-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#faebc3" />
          <stop offset="0.6" stopColor="#e0a526" />
          <stop offset="1" stopColor="#e0a526" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ha-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6fc8a6" />
          <stop offset="1" stopColor="#f4d688" />
        </linearGradient>
      </defs>
      <circle cx="318" cy="78" r="70" fill="url(#ha-sun)" opacity="0.55" />
      <circle cx="318" cy="78" r="30" fill="#edbf4d" />
      {[0, 1, 2, 3, 4].map((k) => (
        <line key={k} x1="20" x2="380" y1={60 + k * 48} y2={60 + k * 48} stroke="#ffffff" strokeOpacity="0.06" />
      ))}
      {steps.map(([x, y, h], k) => (
        <rect key={x} x={x} y={y} width="48" height={h} rx="8" fill="url(#ha-step)" opacity={0.55 + k * 0.15} />
      ))}
      <path d="M40 232 C 90 220, 110 190, 150 176 S 220 150, 250 120 S 300 96, 330 84" fill="none" stroke="url(#ha-line)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="330" cy="84" r="7" fill="#faebc3" stroke="#e0a526" strokeWidth="3" />
      <line x1="20" x2="380" y1="257" y2="257" stroke="#e0a526" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-ink-900 [text-wrap:balance] sm:text-3xl">{title}</h2>
      <p className="mt-2 text-slate-600">{text}</p>
    </div>
  );
}

function ModelNode({ icon: Icon, title, text, accent }: { icon: LucideIcon; title: string; text: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center ${accent ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white ring-1 ring-gold-300/40' : 'bg-ink-950/50'}`}>
      <Icon size={22} className={`mx-auto ${accent ? 'text-gold-200' : 'text-emerald-300'}`} />
      <p className="mt-2 font-semibold">{title}</p>
      <p className={`text-xs ${accent ? 'text-emerald-50' : 'text-ink-300'}`}>{text}</p>
    </div>
  );
}

function Flow({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="flex flex-row items-center justify-center gap-3 text-[11px] text-ink-300 sm:flex-col sm:gap-1">
      <span>{top} →</span>
      <span>← {bottom}</span>
    </div>
  );
}
