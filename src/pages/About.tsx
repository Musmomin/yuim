import { ArrowDown, ArrowRight, Bot, Building2, CheckCircle2, FlaskConical, Landmark, Scale, ShieldCheck, Users, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROLES } from '../data/mock';
import { MISSION, ORGANS, PROCESS, ROADMAP } from '../data/org';
import { useStore } from '../store';

const ORGAN_ICONS: LucideIcon[] = [ShieldCheck, Scale, Landmark, Building2, Users, Bot];

/** Loyiha ta'rifi. `landing` rejimida kirish sahifasi sifatida rollarni ham ko'rsatadi. */
export default function About({ landing = false }: { landing?: boolean }) {
  const { login } = useStore();

  return (
    <div className={landing ? 'min-h-screen bg-slate-50' : ''}>
      {/* Hero */}
      <section className={`bg-slate-900 text-white ${landing ? '' : 'overflow-hidden rounded-2xl'}`}>
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 lg:px-8 lg:pb-20 lg:pt-16">
          {landing && (
            <div className="mb-10 flex items-center justify-between">
              <div className="text-2xl font-bold tracking-wide">YUIM</div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-300">
                <FlaskConical size={14} /> Test versiya
              </span>
            </div>
          )}
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">Loyiha maqsadi</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{MISSION}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            YUIM investorlar mablag'ini o'sish salohiyati bor bizneslarga birgalikdagi faoliyat (oddiy shirkat) shartnomasi asosida
            yo'naltiradi. Daromad oldindan belgilanmaydi: u biznesning haqiqiy natijasidan kelishilgan nisbatda taqsimlanadi.
          </p>
          {landing && (
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo" onClick={(e) => { e.preventDefault(); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500">
                Demo tizimga kirish <ArrowDown size={16} />
              </a>
            </div>
          )}

          {/* Model */}
          <div className="mt-12 grid items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-5 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:p-6">
            <ModelNode icon={Wallet} title="Investor" text="Hissa qo'shadi" />
            <Flow top="hissa" bottom="foyda ulushi" />
            <ModelNode icon={Bot} title="YUIM platformasi" text="Tanlaydi, rasmiylashtiradi, kuzatadi" accent />
            <Flow top="investitsiya" bottom="hisobot" />
            <ModelNode icon={Building2} title="Ijrochi sherik" text="Biznesni yuritadi" />
          </div>
        </div>
      </section>

      <div className={`mx-auto max-w-6xl space-y-16 py-14 ${landing ? 'px-4 lg:px-8' : ''}`}>
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
                    <span className={`rounded-lg p-2 ${ai ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
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
          YUIM · test versiya · barcha kompaniya va shaxslar namuna sifatida to'qilgan
        </footer>
      )}
    </div>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900 [text-wrap:balance] sm:text-3xl">{title}</h2>
      <p className="mt-2 text-slate-600">{text}</p>
    </div>
  );
}

function ModelNode({ icon: Icon, title, text, accent }: { icon: LucideIcon; title: string; text: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center ${accent ? 'bg-emerald-600 text-white' : 'bg-slate-900/60'}`}>
      <Icon size={22} className={`mx-auto ${accent ? 'text-white' : 'text-emerald-400'}`} />
      <p className="mt-2 font-semibold">{title}</p>
      <p className={`text-xs ${accent ? 'text-emerald-50' : 'text-slate-400'}`}>{text}</p>
    </div>
  );
}

function Flow({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="flex flex-row items-center justify-center gap-3 text-[11px] text-slate-400 sm:flex-col sm:gap-1">
      <span>{top} →</span>
      <span>← {bottom}</span>
    </div>
  );
}
