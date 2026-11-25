import { BRAND } from '../data/org';

/**
 * YUIM belgisi: o'sib boruvchi uch pog'ona (yuksalish) va ularning ortidan chiqayotgan tong quyoshi (umid).
 * Belgining o'z foni bor — har qanday sirtda o'qiladi.
 */
export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} role="img" aria-label="YUIM belgisi">
      <defs>
        <linearGradient id="yuim-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16324D" />
          <stop offset="1" stopColor="#06141F" />
        </linearGradient>
        <linearGradient id="yuim-step" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0B6349" />
          <stop offset="1" stopColor="#3AAE84" />
        </linearGradient>
        <radialGradient id="yuim-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F4D688" />
          <stop offset="1" stopColor="#E0A526" />
        </radialGradient>
      </defs>
      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" fill="url(#yuim-bg)" stroke="#ffffff" strokeOpacity="0.14" />
      <circle cx="34.5" cy="13.5" r="6" fill="url(#yuim-sun)" />
      <circle cx="34.5" cy="13.5" r="9" fill="#E0A526" opacity="0.18" />
      <rect x="9" y="29" width="7.5" height="10" rx="2" fill="url(#yuim-step)" />
      <rect x="20" y="23" width="7.5" height="16" rx="2" fill="url(#yuim-step)" />
      <rect x="31" y="17" width="7.5" height="22" rx="2" fill="url(#yuim-step)" />
      <path d="M8 40.5h32" stroke="#E0A526" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** To'liq logotip: belgi + YUIM + to'liq nom. `tone="dark"` — to'q fon uchun. */
export function Logo({ tone = 'dark', size = 40, full = true }: { tone?: 'dark' | 'light'; size?: number; full?: boolean }) {
  const dark = tone === 'dark';
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={size} className="shrink-0" />
      <span className="min-w-0 leading-tight">
        <span className={`block font-display text-xl font-bold tracking-[0.18em] ${dark ? 'text-white' : 'text-ink-900'}`}>YUIM</span>
        {full && (
          <span className={`block text-[10px] font-semibold uppercase tracking-[0.12em] ${dark ? 'text-gold-300' : 'text-emerald-700'}`}>
            {BRAND.full}
          </span>
        )}
      </span>
    </span>
  );
}
