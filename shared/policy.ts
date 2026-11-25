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
  /**
   * So'z boshidan mos keladigan ildizlar. Har bir ildiz faqat so'z boshida qidiriladi
   * ("vino" → "vino", "vinochilik"), so'z ichida emas ("mevali"). `except` — ildiz bilan
   * boshlanadigan, lekin cheklanmagan so'zlar ("vinograd" — uzum).
   */
  stems: string[];
  except?: string[];
}

export const RESTRICTED: RestrictedItem[] = [
  { name: 'Alkogolli mahsulotlar ishlab chiqarish va savdosi', stems: ['alkogol', 'aroq', 'vino', 'pivo', 'konyak'], except: ['vinograd', 'alkogolsiz'] },
  { name: 'Tamaki va nikotin mahsulotlari', stems: ['tamaki', 'sigaret', 'nikotin', 'vape', 'qalyon'] },
  { name: "Tavakkalchilikka asoslangan o'yinlar, lotereya, bukmekerlik", stems: ['lotereya', 'bukmeker', 'qimor', 'kazino', 'pul tikish', 'stavka qabul'] },
  // "kredit" yolg'iz qo'yilmaydi: "bank kreditini yopish" kabi maqsad cheklangan faoliyat emas
  { name: 'Qarz berish va kreditlash (asosiy faoliyat sifatida)', stems: ['kredit berish', 'kreditlash', 'qarz berish', 'lombard', 'mikromoliya', 'mikrokredit', 'mikroqarz'] },
  { name: "Qurol-yarog' va o'q-dorilar savdosi", stems: ['qurol', "o'q-dori"] },
  { name: "Litsenziya talab qilinadigan, ammo litsenziyasi yo'q faoliyat", stems: ['litsenziyasiz'] },
];

const norm = (s: string) => s.toLowerCase().replace(/[ʻʼ‘’`´]/g, "'");
const isLetter = (ch: string | undefined) => !!ch && /[\p{L}\p{N}']/u.test(ch);

/** Matnda cheklangan faoliyat bormi — birinchi mos kelgan band nomini qaytaradi. */
export function findRestricted(text: string): string | undefined {
  const t = norm(text);
  for (const item of RESTRICTED) {
    for (const stem of item.stems) {
      let i = t.indexOf(stem);
      while (i !== -1) {
        const atWordStart = !isLetter(t[i - 1]);
        const word = t.slice(i).match(/^[\p{L}\p{N}'-]+/u)?.[0] ?? stem;
        const excepted = item.except?.some((e) => word.startsWith(e));
        if (atWordStart && !excepted) return item.name;
        i = t.indexOf(stem, i + 1);
      }
    }
  }
  return undefined;
}

export const CRITERIA = [
  { name: 'Sof foyda marjasi', rule: 'kamida 8%' },
  { name: "So'ralgan summa / yillik tushum", rule: "60% dan oshmasligi kerak" },
  { name: 'Investitsiya muddati', rule: '6–24 oy (uzunrog\'i qo\'shimcha asoslash bilan)' },
  { name: 'Faoliyat tarixi', rule: 'kamida 12 oy, moliyaviy hisobot bilan' },
  { name: 'Foyda taqsimoti nisbati', rule: "investor ulushi 25–60% oralig'ida" },
];
