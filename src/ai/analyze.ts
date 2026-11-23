// Test uchun AI tahlili: hozircha qoidaga asoslangan soxta model.
// Keyinchalik shu funksiya o'rniga haqiqiy AI xizmati chaqiriladi —
// interfeys (AiAnalysis) o'zgarmaydi.
import { RESTRICTED } from '../data/policy';
import type { AiAnalysis, ApplicationInput } from '../data/types';
import { shortMoney } from '../lib/format';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function analyze(a: ApplicationInput): AiAnalysis {
  const text = `${a.sector} ${a.activity} ${a.purpose}`.toLowerCase();
  let activityHit: string | undefined;
  for (const item of RESTRICTED) {
    if (item.keywords.some((k) => text.includes(k))) {
      activityHit = item.name;
      break;
    }
  }

  const margin = a.revenue12m > 0 ? a.profit12m / a.revenue12m : 0;
  const leverage = a.revenue12m > 0 ? a.amount / a.revenue12m : 9;

  let score = 50;
  score -= Math.min(25, margin * 120);
  score += Math.min(30, leverage * 25);
  if (a.termMonths > 24) score += 8;
  if (a.employees >= 30) score -= 5;
  if (a.profit12m <= 0) score += 20;
  if (activityHit) score += 15;
  score = Math.round(clamp(score, 5, 95));

  const level = score < 35 ? 'past' : score < 60 ? 'orta' : 'yuqori';

  const flags: string[] = [];
  if (activityHit) flags.push(`Faoliyat cheklangan ro'yxatga mos keladi: «${activityHit}»`);
  if (leverage > 0.6) flags.push("So'ralgan summa yillik tushumning 60% dan ortiq");
  if (margin < 0.08) flags.push('Sof foyda marjasi 8% dan past');
  if (a.termMonths > 24) flags.push("Muddat 24 oydan uzun — qo'shimcha asoslash kerak");
  if (a.investorShare < 25 || a.investorShare > 60) flags.push("Investor ulushi siyosatdagi 25–60% oralig'idan tashqarida");

  const suggestedShare = Math.round(clamp(28 + score / 3, 25, 60));

  const summary = a.revenue12m
    ? `Yillik tushum ${shortMoney(a.revenue12m)}, sof foyda marjasi ${(margin * 100).toFixed(1)}%. ` +
      `So'ralgan ${shortMoney(a.amount)} yillik tushumning ${(leverage * 100).toFixed(0)}% ini tashkil etadi. ` +
      (level === 'past'
        ? "Moliyaviy holat barqaror, qaytarish salohiyati yuqori."
        : level === 'orta'
          ? "Risk o'rtacha: oylik monitoring va bosqichma-bosqich moliyalashtirish tavsiya etiladi."
          : "Risk yuqori: qo'shimcha hujjatlar va kafolatlar talab qilinishi tavsiya etiladi.")
    : "Moliyaviy ko'rsatkichlar kiritilmagan — tahlil uchun yetarli ma'lumot yo'q.";

  return {
    score,
    level,
    activity: activityHit ? 'cheklangan' : 'ruxsat',
    activityHit,
    summary,
    flags,
    suggestedShare,
  };
}
