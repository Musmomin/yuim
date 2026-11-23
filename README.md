# YUIM — Investitsiya boshqaruv tizimi (test versiya)

Birgalikdagi faoliyat (oddiy shirkat shartnomasi) asosida bizneslarga investitsiya kiritish jarayonini boshqaruvchi AI integratsiyali tizim. Hozircha **faqat tashqi tomoni (frontend)**, ma'lumotlar test uchun to'qilgan va brauzerda saqlanadi.

## Ishga tushirish

```
npm install
npm run dev
```

Brauzerda: http://localhost:5173 (yoki terminal ko'rsatgan manzil). Kirishda rolni tanlang; yuqoridagi ro'yxatdan rolni istalgan payt almashtirish mumkin. ↺ tugmasi test ma'lumotlarini boshlang'ich holatga qaytaradi.

## Jarayon

Yangi ariza → Qo'mitalar ko'rigi (Komplayens + Investitsiya, parallel) → Yuridik ekspertiza → Shartnoma imzolash → Moliyalashtirildi (monitoring) → Yakunlandi

## Rollar

Administrator · Loyiha menejeri · Komplayens qo'mitasi · Investitsiya qo'mitasi · Yuridik xizmat · Ichki audit · Investor · Ijrochi sherik (biznes)

## Tuzilma

- `src/data/` — turlar, test ma'lumotlari, investitsiya siyosati
- `src/ai/analyze.ts` — AI tahlili (hozircha qoidaga asoslangan soxta model; keyin haqiqiy AI bilan almashtiriladi)
- `src/store.tsx` — holat va jarayon mantig'i (keyin backend API bilan almashtiriladi)
- `src/pages/` — sahifalar

## Terminologiya qoidasi

Faqat O'zbekiston qonunchiligidagi yuridik terminlar ishlatiladi (oddiy shirkat shartnomasi, investor, ijrochi sherik, foyda taqsimoti, komplayens, ichki audit). Diniy terminlar ishlatilmaydi.
