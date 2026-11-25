import type { ActivityStatus, ReviewKey, ReviewStatus, RiskLevel, Role, Stage } from '../../shared/types';

export type Tone = 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'violet';

export const STAGE_FLOW: { id: Stage; label: string }[] = [
  { id: 'yangi', label: 'Yangi ariza' },
  { id: 'korik', label: "Qo'mitalar ko'rigi" },
  { id: 'yuridik', label: 'Yuridik ekspertiza' },
  { id: 'imzolash', label: 'Shartnoma imzolash' },
  { id: 'moliyalashtirildi', label: 'Moliyalashtirildi' },
  { id: 'yakunlandi', label: 'Yakunlandi' },
];

export const STAGE_LABEL: Record<Stage, string> = {
  yangi: 'Yangi ariza',
  korik: "Qo'mitalar ko'rigi",
  qaytarildi: 'Qayta ishlashga qaytarildi',
  yuridik: 'Yuridik ekspertiza',
  imzolash: 'Shartnoma imzolash',
  moliyalashtirildi: 'Moliyalashtirildi',
  yakunlandi: 'Yakunlandi',
  rad: 'Rad etildi',
};

export const STAGE_TONE: Record<Stage, Tone> = {
  yangi: 'blue',
  korik: 'amber',
  qaytarildi: 'amber',
  yuridik: 'violet',
  imzolash: 'violet',
  moliyalashtirildi: 'green',
  yakunlandi: 'slate',
  rad: 'red',
};

export const REVIEW_LABEL: Record<ReviewStatus, string> = {
  kutilmoqda: 'Kutilmoqda',
  tasdiqlandi: 'Tasdiqlandi',
  rad: 'Rad etildi',
  qayta: "Qayta ishlashga qaytarildi",
};

export const REVIEW_TONE: Record<ReviewStatus, Tone> = {
  kutilmoqda: 'slate',
  tasdiqlandi: 'green',
  rad: 'red',
  qayta: 'amber',
};

export const REVIEW_BODY: Record<ReviewKey, { title: string; desc: string }> = {
  komplayens: {
    title: "Komplayens qo'mitasi",
    desc: "Faoliyat turi va shartlarning investitsiya siyosatiga muvofiqligi",
  },
  investitsiya: {
    title: "Investitsiya qo'mitasi",
    desc: "Moliyaviy holat, risk va foyda taqsimoti nisbati",
  },
  yuridik: {
    title: 'Yuridik xizmat',
    desc: "Oddiy shirkat shartnomasi va hujjatlarning huquqiy ekspertizasi",
  },
};

export const RISK_LABEL: Record<RiskLevel, string> = { past: 'Past risk', orta: "O'rtacha risk", yuqori: 'Yuqori risk' };
export const RISK_TONE: Record<RiskLevel, Tone> = { past: 'green', orta: 'amber', yuqori: 'red' };

export const ACTIVITY_LABEL: Record<ActivityStatus, string> = {
  ruxsat: 'Ruxsat etilgan faoliyat',
  cheklangan: 'Cheklangan faoliyat',
};

export const ROLE_TONE: Record<Role, Tone> = {
  admin: 'slate',
  menejer: 'blue',
  komplayens: 'violet',
  investitsiya: 'green',
  yuridik: 'amber',
  audit: 'red',
  investor: 'green',
  biznes: 'blue',
};
