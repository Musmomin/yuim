// Loyiha ta'rifi: maqsad, boshqaruv organlari va ularning vazifalari.
// Faqat O'zbekiston qonunchiligiga mos yuridik terminlar ishlatiladi.

export const BRAND = {
  short: 'YUIM',
  full: 'Yuksalish Umidi Invest Management',
  slogan: "Sog'lom AI orqali bizneslarni o'stirish",
};

export const MISSION = BRAND.slogan;

export const ORGANS: { title: string; role: string; duties: string[] }[] = [
  {
    title: "Komplayens qo'mitasi",
    role: 'Shartlarning muvofiqligi',
    duties: [
      "Shartnoma shartlarini investitsiya siyosatiga muvofiqligini belgilaydi",
      "Ruxsat etilgan va cheklangan faoliyat turlarini ajratadi",
      "Har bir arizani faoliyat turi bo'yicha skriningdan o'tkazadi",
    ],
  },
  {
    title: 'Ichki audit',
    role: 'Mustaqil taftish',
    duties: [
      "Moliyaviy operatsiyalarning belgilangan standartlarga muvofiqligini taftish qiladi",
      "Qo'mitalar qarorlari va audit jurnalini tekshiradi",
      "Davriy taftish hisobotini tayyorlaydi",
    ],
  },
  {
    title: "Investitsiya qo'mitasi",
    role: 'Moliyaviy baho',
    duties: [
      "Biznesning moliyaviy holati va riskini baholaydi",
      "Foyda taqsimoti nisbatini tasdiqlaydi",
      "Moliyalashtirish bo'yicha qaror qabul qiladi",
    ],
  },
  {
    title: 'Yuridik xizmat',
    role: 'Huquqiy ekspertiza',
    duties: [
      "Oddiy shirkat (birgalikdagi faoliyat) shartnomasini tayyorlaydi",
      "Hujjatlarning qonunchilikka muvofiqligini tekshiradi",
      "Garov va kafolat hujjatlarini rasmiylashtiradi",
    ],
  },
  {
    title: "Mas'ul xodimlar",
    role: 'Loyiha menejerlari',
    duties: [
      "Arizalarni qabul qilib, to'liqligini tekshiradi",
      "Jarayonni bosqichma-bosqich yuritadi",
      "Biznesning oylik hisobotlarini kuzatadi",
    ],
  },
  {
    title: 'AI yordamchi',
    role: 'Tahlil va ogohlantirish',
    duties: [
      "Moliyaviy hujjatlarni tahlil qilib risk ballini chiqaradi",
      "Faoliyat turini siyosat bo'yicha dastlabki tekshiradi",
      "Monitoringda rejadan og'ishni erta aniqlaydi",
    ],
  },
];

export const PROCESS: { step: string; who: string; text: string }[] = [
  { step: 'Ariza', who: 'Biznes, menejer', text: "Biznes ariza va moliyaviy hisobotlarini topshiradi; AI dastlabki baho beradi." },
  { step: "Qo'mitalar ko'rigi", who: "Komplayens va Investitsiya qo'mitalari", text: "Ikki qo'mita parallel ko'radi: shartlar muvofiqligi va moliyaviy baho." },
  { step: 'Yuridik ekspertiza', who: 'Yuridik xizmat', text: "Oddiy shirkat shartnomasi va ilova hujjatlar tayyorlanadi." },
  { step: 'Imzolash', who: 'Menejer, investor, biznes', text: "Shartnoma imzolanadi, investor hissasi biznesga o'tkaziladi." },
  { step: 'Monitoring', who: 'Menejer, AI, Ichki audit', text: "Biznes oylik hisobot beradi; rejadan og'ish bo'lsa ogohlantirish chiqadi." },
  { step: 'Foyda taqsimoti', who: "Investitsiya qo'mitasi", text: "Haqiqiy natija kelishilgan nisbatda investor va biznes o'rtasida bo'linadi." },
];

export const ROADMAP: { phase: string; title: string; text: string; now?: boolean }[] = [
  { phase: '1-bosqich', title: 'Test versiya', text: "Interfeys va jarayonlar namoyishi: rollar, qo'mitalar, monitoring.", now: true },
  { phase: '2-bosqich', title: 'B2B ishga tushirish', text: "Yuridik shaxs investorlar va bizneslar, haqiqiy AI tahlili, ma'lumotlar bazasi." },
  { phase: '3-bosqich', title: 'B2C kengaytirish', text: "Jismoniy shaxs investorlar uchun qonunchilikka mos model." },
];
