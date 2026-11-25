import { useId } from 'react';
import { BRAND } from '../data/org';

/*
 * YUIM logotipi — «Oltin yo'l».
 * To'rt harf bir xil qalinlikda chiziladi va bosh harf chizig'i (y 8…64) bo'yicha kesiladi — tekis uchlar, bitta oila.
 * M ning o'ng oyog'i bosh harf chizig'idan yuqoriga chiqib, oltin o'qqa aylanadi (yuksalish).
 * So'z ostidagi oltin chiziq chapdan o'ngga ko'tarilib, o'qqa ulanadi: har bir bosqich — yuksalish yo'lining bir qismi.
 */
const W = 13;
const GOLD = '#e0a526';
const Y = 'M2 -6 L22 34 M42 -6 L22 34 M22 30 V72';
const U = 'M62.5 -6 V44 A13.5 13.5 0 0 0 89.5 44 V-6';
const I = 'M116.5 -6 V72';
const M = 'M143.5 72 V10 L163 46 L182.5 10'; // o'ng oyog'i — oltin o'q
const AX = 182.5; // o'q o'qi
const TOP = -18; // o'q uchi

type Tone = 'dark' | 'light';
const INK: Record<Tone, string> = { dark: '#ffffff', light: '#0a1f33' };

function Arrow() {
  return (
    <>
      <rect x={AX - W / 2} y={TOP + 14} width={W} height={64 - TOP - 14} fill={GOLD} />
      <path d={`M${AX - 17} ${TOP + 18} L${AX} ${TOP} L${AX + 17} ${TOP + 18} Z`} fill={GOLD} />
    </>
  );
}

/** So'z belgisi: YUIM + oltin yo'l. Balandligi `height` px. */
export function Wordmark({ height = 32, tone = 'dark', className = '' }: { height?: number; tone?: Tone; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg height={height} width={(height * 206) / 101} viewBox="-4 -22 206 101" className={className} role="img" aria-label="YUIM">
      <defs>
        <clipPath id={`${id}c`}>
          <rect x="-10" y="8" width="220" height="56" />
        </clipPath>
        <linearGradient id={`${id}g`} x1="0" x2="1">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.25" />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}c)`} fill="none" stroke={INK[tone]} strokeWidth={W} strokeLinejoin="miter" strokeMiterlimit={10}>
        <path d={Y} />
        <path d={U} />
        <path d={I} />
        <path d={M} />
      </g>
      <Arrow />
      <path d="M0 78 L189 66 L189 74 L0 80 Z" fill={`url(#${id}g)`} />
    </svg>
  );
}

/** Kvadrat belgi (ilova ikonkasi): tungi ko'k fonda M va oltin o'q. */
export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[22%] bg-gradient-to-br from-ink-700 to-ink-950 ring-1 ring-white/15 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.75} height={size * 0.75} viewBox="128 -24 70 104" aria-hidden="true">
        <defs>
          <clipPath id={`${id}c`}>
            <rect x="100" y="8" width="120" height="56" />
          </clipPath>
          <linearGradient id={`${id}g`} x1="0" x2="1">
            <stop offset="0" stopColor={GOLD} stopOpacity="0.3" />
            <stop offset="1" stopColor={GOLD} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${id}c)`} fill="none" stroke="#fff" strokeWidth={W} strokeMiterlimit={10}>
          <path d={M} />
        </g>
        <Arrow />
        <path d="M132 78 L189 68 L189 75 L132 80 Z" fill={`url(#${id}g)`} />
      </svg>
    </span>
  );
}

/** To'liq logotip: YUIM + to'liq nom. `tone="dark"` — to'q fon uchun. */
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
