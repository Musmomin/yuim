import { useId } from 'react';
import { BRAND } from '../data/org';

/*
 * YUIM harflaridan yasalgan belgi.
 * Harflar bitta chiziqda turadi, lekin har biri oldingisidan baland — Y → U → I → M o'sib boradi (yuksalish).
 * M ning ikki cho'qqisi orasidan tong quyoshi chiqadi (umid). Rang ham chapdan o'ngga yorishadi.
 */
const STROKE = 9;
const LETTERS = [
  'M8 18 L18 36 L28 18 M18 36 V58', // Y
  'M47 14 V46 A12 12 0 0 0 71 46 V14', // U
  'M90 10 V58', // I
  'M109 58 V6 L127 32 L145 6 V58', // M
];
/** Tong quyoshi M ning ikki cho'qqisi orasidan chiqadi */
const SUN = { cx: 127, cy: 13.5, r: 6 };
const VIEW = { w: 153, h: 64 };

type Tone = 'dark' | 'light';
const PALETTE: Record<Tone, [string, string]> = {
  dark: ['#3aae84', '#e6f5ee'], // to'q fonda: yashildan oqishgacha
  light: ['#0b6349', '#179469'], // oq fonda: to'q yashil
};

/** Faqat harflar (so'z belgisi). Balandligi `height` px. */
export function Wordmark({ height = 32, tone = 'dark', className = '' }: { height?: number; tone?: Tone; className?: string }) {
  const id = useId().replace(/:/g, '');
  const [from, to] = PALETTE[tone];
  return (
    <svg
      height={height}
      width={(height * VIEW.w) / VIEW.h}
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className={className}
      role="img"
      aria-label="YUIM"
    >
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={VIEW.w} y2="0">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <radialGradient id={`${id}-s`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#faebc3" />
          <stop offset="1" stopColor="#e0a526" />
        </radialGradient>
      </defs>
      <g fill="none" stroke={`url(#${id}-g)`} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {LETTERS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r + 2.5} fill="#e0a526" opacity="0.22" />
      <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill={`url(#${id}-s)`} />
    </svg>
  );
}

/** Kvadrat belgi (ilova ikonkasi, favicon): tungi ko'k fonda so'z belgisi. */
export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[22%] bg-gradient-to-br from-ink-700 to-ink-950 ring-1 ring-white/15 ${className}`}
      style={{ width: size, height: size }}
    >
      <Wordmark height={size * 0.42} tone="dark" />
    </span>
  );
}

/** To'liq logotip: YUIM harflari + to'liq nom. `tone="dark"` — to'q fon uchun. */
export function Logo({ tone = 'dark', height = 30, full = true }: { tone?: Tone; height?: number; full?: boolean }) {
  return (
    <span className="inline-flex flex-col gap-1.5">
      <Wordmark height={height} tone={tone} />
      {full && (
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${tone === 'dark' ? 'text-gold-300' : 'text-emerald-700'}`}>
          {BRAND.full}
        </span>
      )}
    </span>
  );
}

/** Favicon (index.html dagi data URI) ham shu harflardan yasalgan — `tong quyoshi` bilan. */
