// Test ma'lumotlari. Barcha kompaniya va shaxslar to'qima.
import { analyze } from '../ai/analyze';
import type { Application, ApplicationInput, AuditEntry, Investor, MonthlyReport, Review, Role, Stage } from './types';

export const ROLES: { id: Role; label: string; desc: string; user: string }[] = [
  { id: 'admin', label: 'Administrator', desc: 'Tizim, foydalanuvchilar va sozlamalar', user: 'A. Karimov' },
  { id: 'menejer', label: 'Loyiha menejeri', desc: 'Arizalarni qabul qiladi va jarayonni yuritadi', user: 'D. Rasulov' },
  { id: 'komplayens', label: "Komplayens qo'mitasi", desc: 'Faoliyat va shartlarning investitsiya siyosatiga muvofiqligi', user: 'S. Yusupova' },
  { id: 'investitsiya', label: "Investitsiya qo'mitasi", desc: 'Moliyaviy baho, risk va foyda taqsimoti nisbati', user: 'B. Tursunov' },
  { id: 'yuridik', label: 'Yuridik xizmat', desc: 'Shartnoma va hujjatlarning huquqiy ekspertizasi', user: 'N. Aliyeva' },
  { id: 'audit', label: 'Ichki audit', desc: 'Jarayon va qarorlarni mustaqil taftish qiladi', user: 'O. Hamidov' },
  { id: 'investor', label: 'Investor', desc: 'Portfel, shartnomalar va daromadni kuzatadi', user: 'Orient Kapital MChJ' },
  { id: 'biznes', label: 'Ijrochi sherik (biznes)', desc: 'Investitsiya uchun ariza beradi, hisobot topshiradi', user: "Navro'z Tekstil MChJ" },
];

export const INVESTORS: Investor[] = [
  { id: 'inv-1', name: 'Orient Kapital MChJ', type: 'MChJ', stir: '305 118 274', contact: '+998 71 200-11-22', capital: 5_000_000_000 },
  { id: 'inv-2', name: 'Silk Road Partners MChJ', type: 'MChJ', stir: '306 442 019', contact: '+998 71 233-40-50', capital: 3_500_000_000 },
  { id: 'inv-3', name: 'Mega Invest Holding AJ', type: 'AJ', stir: '204 771 356', contact: '+998 71 150-60-70', capital: 8_000_000_000 },
  { id: 'inv-4', name: 'Tashkent Growth Fund MChJ', type: 'MChJ', stir: '307 090 815', contact: '+998 90 900-10-20', capital: 2_000_000_000 },
  { id: 'inv-5', name: 'J. Ergashev YaTT', type: 'YaTT', stir: '512 384 670', contact: '+998 93 555-44-33', capital: 600_000_000 },
];

const pending: Review = { status: 'kutilmoqda' };
const ok = (by: string, at: string, comment?: string): Review => ({ status: 'tasdiqlandi', by, at, comment });

// Oddiy deterministik "tasodif" — har safar bir xil test ma'lumoti chiqishi uchun
function rng(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function genReports(start: string, months: number, monthlyRevenue: number, margin: number, seed: number, drop = 0): MonthlyReport[] {
  const r = rng(seed);
  const [y0, m0] = start.split('-').map(Number);
  const out: MonthlyReport[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(y0, m0 - 1 + i, 1);
    const growth = 1 + i * 0.025;
    const late = drop && i >= months - 2 ? 1 - drop : 1;
    const revenue = Math.round(monthlyRevenue * growth * (0.9 + r() * 0.2) * late);
    const realMargin = margin * (0.8 + r() * 0.4) * late;
    const expenses = Math.round(revenue * (1 - realMargin));
    out.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      revenue,
      expenses,
      plan: Math.round(monthlyRevenue * growth * margin),
    });
  }
  return out;
}

type Seed = ApplicationInput & {
  id: string;
  submittedAt: string;
  stage: Stage;
  reviews?: Partial<Application['reviews']>;
  investor?: string;
  agreementNo?: string;
  fundedAt?: string;
  reports?: MonthlyReport[];
};

function make(s: Seed): Application {
  const { reviews, ...rest } = s;
  return {
    manager: 'D. Rasulov',
    reports: [],
    ...rest,
    reviews: { komplayens: pending, investitsiya: pending, yuridik: pending, ...reviews },
    ai: analyze(s),
  };
}

export function seedApplications(): Application[] {
  return [
    make({
      id: 'YU-2026-031', submittedAt: '2026-11-14T09:20:00', stage: 'korik',
      company: "Navro'z Tekstil MChJ", stir: '309 512 447', director: 'Sh. Mirzayev', phone: '+998 90 123-45-67',
      region: 'Toshkent sh.', sector: 'Yengil sanoat', activity: 'Paxta gazlamasidan maktab va ish kiyimlari tikish',
      amount: 850_000_000, termMonths: 18, investorShare: 40,
      purpose: "Yangi tikuv liniyasi (12 ta sanoat mashinasi) xaridi va aylanma mablag'",
      revenue12m: 4_200_000_000, profit12m: 520_000_000, employees: 64,
      reviews: { komplayens: ok('S. Yusupova', '2026-11-17T11:05:00', "Faoliyat turi ruxsat etilgan ro'yxatda.") },
    }),
    make({
      id: 'YU-2026-030', submittedAt: '2026-11-12T15:40:00', stage: 'korik',
      company: 'Namangan Non Kombinati MChJ', stir: '308 220 913', director: 'A. Qodirov', phone: '+998 91 220-33-44',
      region: 'Namangan', sector: 'Oziq-ovqat ishlab chiqarish', activity: 'Non va qandolat mahsulotlari ishlab chiqarish',
      amount: 500_000_000, termMonths: 12, investorShare: 36,
      purpose: 'Ikkinchi pech liniyasini ishga tushirish',
      revenue12m: 2_600_000_000, profit12m: 230_000_000, employees: 33,
      reviews: {
        investitsiya: { status: 'qayta', by: 'B. Tursunov', at: '2026-11-18T10:00:00', comment: 'Oxirgi 2 chorak buxgalteriya balansini taqdim eting.' },
      },
    }),
    make({
      id: 'YU-2026-029', submittedAt: '2026-11-19T10:15:00', stage: 'yangi',
      company: 'Toshkent IT Yechimlar MChJ', stir: '310 004 581', director: 'J. Saidov', phone: '+998 97 700-80-90',
      region: 'Toshkent sh.', sector: 'Axborot texnologiyalari', activity: 'Savdo nuqtalari uchun hisob dasturi (SaaS)',
      amount: 400_000_000, termMonths: 18, investorShare: 50,
      purpose: "Sotuv bo'limini kengaytirish va viloyatlarda hamkorlar tarmog'i",
      revenue12m: 900_000_000, profit12m: 150_000_000, employees: 15,
    }),
    make({
      id: 'YU-2026-027', submittedAt: '2026-11-03T12:00:00', stage: 'yuridik',
      company: 'Samarqand Agro Eksport MChJ', stir: '307 845 102', director: 'F. Norqulov', phone: '+998 93 340-50-60',
      region: 'Samarqand', sector: "Qishloq xo'jaligi", activity: "Quritilgan meva qayta ishlash va eksport",
      amount: 1_500_000_000, termMonths: 24, investorShare: 45,
      purpose: 'Quritish sexi uskunalari va mavsumiy xomashyo xaridi',
      revenue12m: 6_800_000_000, profit12m: 610_000_000, employees: 38,
      reviews: {
        komplayens: ok('S. Yusupova', '2026-11-06T09:30:00'),
        investitsiya: ok('B. Tursunov', '2026-11-10T16:20:00', "Mavsumiylik hisobga olinsin: moliyalashtirish 2 bosqichda."),
      },
    }),
    make({
      id: 'YU-2026-024', submittedAt: '2026-10-21T09:00:00', stage: 'imzolash',
      company: 'Buxoro Qurilish Materiallari MChJ', stir: '306 731 288', director: 'R. Jo\'rayev', phone: '+998 65 221-12-12',
      region: 'Buxoro', sector: 'Qurilish materiallari', activity: 'Gazoblok ishlab chiqarish',
      amount: 2_000_000_000, termMonths: 30, investorShare: 42,
      purpose: 'Avtoklav va kesish liniyasi xaridi',
      revenue12m: 5_500_000_000, profit12m: 390_000_000, employees: 47,
      reviews: {
        komplayens: ok('S. Yusupova', '2026-10-24T10:00:00'),
        investitsiya: ok('B. Tursunov', '2026-10-30T14:00:00', "Muddat uzun, lekin uskuna garov sifatida qayd etilsin."),
        yuridik: ok('N. Aliyeva', '2026-11-08T11:40:00', "Shartnoma loyihasi tayyor, garov shartnomasi ilova qilindi."),
      },
    }),
    make({
      id: 'YU-2026-018', submittedAt: '2026-04-20T10:00:00', stage: 'moliyalashtirildi',
      company: "Farg'ona Mebel Servis MChJ", stir: '305 990 140', director: 'U. Tojiboyev', phone: '+998 73 244-55-66',
      region: "Farg'ona", sector: 'Mebel ishlab chiqarish', activity: 'Ofis va maktab mebellari ishlab chiqarish',
      amount: 600_000_000, termMonths: 12, investorShare: 35,
      purpose: 'CNC stanok va xomashyo zaxirasi',
      revenue12m: 2_100_000_000, profit12m: 260_000_000, employees: 22,
      reviews: {
        komplayens: ok('S. Yusupova', '2026-04-23T10:00:00'),
        investitsiya: ok('B. Tursunov', '2026-04-28T10:00:00'),
        yuridik: ok('N. Aliyeva', '2026-05-05T10:00:00'),
      },
      investor: 'Orient Kapital MChJ', agreementNo: 'OSh-2026/014', fundedAt: '2026-05-10T10:00:00',
      reports: genReports('2026-05', 6, 200_000_000, 0.13, 7),
    }),
    make({
      id: 'YU-2026-009', submittedAt: '2026-02-10T10:00:00', stage: 'moliyalashtirildi',
      company: 'Xorazm Sut Mahsulotlari MChJ', stir: '304 118 905', director: 'M. Yoqubov', phone: '+998 62 225-77-88',
      region: 'Xorazm', sector: 'Oziq-ovqat ishlab chiqarish', activity: 'Sut va sut mahsulotlarini qayta ishlash',
      amount: 1_100_000_000, termMonths: 24, investorShare: 38,
      purpose: 'Pasterizatsiya liniyasi va sovutish kameralari',
      revenue12m: 3_900_000_000, profit12m: 300_000_000, employees: 41,
      reviews: {
        komplayens: ok('S. Yusupova', '2026-02-12T10:00:00'),
        investitsiya: ok('B. Tursunov', '2026-02-18T10:00:00'),
        yuridik: ok('N. Aliyeva', '2026-02-26T10:00:00'),
      },
      investor: 'Silk Road Partners MChJ', agreementNo: 'OSh-2026/009', fundedAt: '2026-03-02T10:00:00',
      reports: genReports('2026-03', 8, 340_000_000, 0.08, 21, 0.45),
    }),
    make({
      id: 'YU-2025-031', submittedAt: '2025-03-25T10:00:00', stage: 'yakunlandi',
      company: 'Andijon Avto Detal MChJ', stir: '303 662 017', director: 'I. Xolmatov', phone: '+998 74 223-90-10',
      region: 'Andijon', sector: 'Avtomobil ehtiyot qismlari', activity: 'Avtomobil ehtiyot qismlari ulgurji savdosi',
      amount: 950_000_000, termMonths: 12, investorShare: 40,
      purpose: 'Ombor zaxirasini kengaytirish',
      revenue12m: 7_200_000_000, profit12m: 430_000_000, employees: 19,
      reviews: {
        komplayens: ok('S. Yusupova', '2025-03-28T10:00:00'),
        investitsiya: ok('B. Tursunov', '2025-04-02T10:00:00'),
        yuridik: ok('N. Aliyeva', '2025-04-10T10:00:00'),
      },
      investor: 'Orient Kapital MChJ', agreementNo: 'OSh-2025/031', fundedAt: '2025-04-15T10:00:00',
      reports: genReports('2025-05', 12, 620_000_000, 0.065, 3),
    }),
    make({
      id: 'YU-2026-026', submittedAt: '2026-10-28T10:00:00', stage: 'rad',
      company: "Navoiy O'yin Markazi MChJ", stir: '309 001 774', director: 'K. Ismoilov', phone: '+998 79 222-10-10',
      region: 'Navoiy', sector: "Xizmat ko'rsatish", activity: 'Lotereya va bukmekerlik shoxobchalari tarmog\'i',
      amount: 700_000_000, termMonths: 12, investorShare: 40,
      purpose: 'Yangi shoxobchalar ochish',
      revenue12m: 1_800_000_000, profit12m: 310_000_000, employees: 25,
      reviews: {
        komplayens: { status: 'rad', by: 'S. Yusupova', at: '2026-10-30T09:15:00', comment: "Faoliyat investitsiya siyosatining cheklangan ro'yxatiga kiradi (3-band)." },
      },
    }),
  ];
}

export function seedAudit(): AuditEntry[] {
  const e = (id: string, at: string, user: string, role: Role, action: string, target?: string): AuditEntry => ({ id, at, user, role, action, target });
  return [
    e('a9', '2026-11-19T10:15:00', 'Toshkent IT Yechimlar MChJ', 'biznes', 'Yangi ariza topshirildi', 'YU-2026-029'),
    e('a8', '2026-11-18T10:00:00', 'B. Tursunov', 'investitsiya', "Investitsiya qo'mitasi: qayta ishlashga qaytarildi", 'YU-2026-030'),
    e('a7', '2026-11-17T11:05:00', 'S. Yusupova', 'komplayens', "Komplayens qo'mitasi: tasdiqlandi", 'YU-2026-031'),
    e('a6', '2026-11-14T09:20:00', "Navro'z Tekstil MChJ", 'biznes', 'Yangi ariza topshirildi', 'YU-2026-031'),
    e('a5', '2026-11-10T16:20:00', 'B. Tursunov', 'investitsiya', "Investitsiya qo'mitasi: tasdiqlandi", 'YU-2026-027'),
    e('a4', '2026-11-08T11:40:00', 'N. Aliyeva', 'yuridik', 'Yuridik xizmat: tasdiqlandi', 'YU-2026-024'),
    e('a3', '2026-11-05T09:00:00', 'O. Hamidov', 'audit', "Oktabr oyi jarayonlari bo'yicha taftish yakunlandi"),
    e('a2', '2026-10-30T09:15:00', 'S. Yusupova', 'komplayens', "Komplayens qo'mitasi: rad etildi", 'YU-2026-026'),
    e('a1', '2026-10-21T09:00:00', 'D. Rasulov', 'menejer', "Ariza qo'mitalarga yuborildi", 'YU-2026-024'),
  ];
}
