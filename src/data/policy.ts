// Investitsiya siyosati — komplayens skriningi shu hujjatga tayanadi.
// Ro'yxatlar test uchun; haqiqiy siyosatni Komplayens qo'mitasi tasdiqlaydi.

export const REGIONS = [
  'Toshkent sh.',
  'Toshkent vil.',
  'Andijon',
  'Buxoro',
  "Farg'ona",
  'Jizzax',
  'Xorazm',
  'Namangan',
  'Navoiy',
  'Qashqadaryo',
  "Qoraqalpog'iston Resp.",
  'Samarqand',
  'Sirdaryo',
  'Surxondaryo',
];

export const SECTORS = [
  'Yengil sanoat',
  "Qishloq xo'jaligi",
  'Oziq-ovqat ishlab chiqarish',
  'Qurilish materiallari',
  'Mebel ishlab chiqarish',
  'Axborot texnologiyalari',
  'Avtomobil ehtiyot qismlari',
  'Savdo',
  "Xizmat ko'rsatish",
  'Logistika',
];

export interface RestrictedItem {
  name: string;
  keywords: string[];
}

export const RESTRICTED: RestrictedItem[] = [
  { name: 'Alkogolli mahsulotlar ishlab chiqarish va savdosi', keywords: ['alkogol', 'aroq', 'vino', 'pivo'] },
  { name: 'Tamaki va nikotin mahsulotlari', keywords: ['tamaki', 'sigaret', 'nikotin', 'vape'] },
  { name: "Tavakkalchilikka asoslangan o'yinlar, lotereya, bukmekerlik", keywords: ['lotereya', 'bukmeker', 'qimor', 'kazino', 'pul tikish', 'stavka qabul'] },
  { name: 'Qarz berish va kreditlash (asosiy faoliyat sifatida)', keywords: ['kredit', 'qarz berish', 'lombard', 'mikromoliya'] },
  { name: "Qurol-yarog' va o'q-dorilar savdosi", keywords: ['qurol', "o'q-dori"] },
  { name: "Litsenziya talab qilinadigan, ammo litsenziyasi yo'q faoliyat", keywords: ['litsenziyasiz'] },
];

export const CRITERIA = [
  { name: 'Sof foyda marjasi', rule: 'kamida 8%' },
  { name: "So'ralgan summa / yillik tushum", rule: "60% dan oshmasligi kerak" },
  { name: 'Investitsiya muddati', rule: '6–24 oy (uzunrog\'i qo\'shimcha asoslash bilan)' },
  { name: 'Faoliyat tarixi', rule: 'kamida 12 oy, moliyaviy hisobot bilan' },
  { name: 'Foyda taqsimoti nisbati', rule: "investor ulushi 25–60% oralig'ida" },
];
