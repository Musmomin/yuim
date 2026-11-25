import type { Role } from './types';

export const ROLES: { id: Role; label: string; desc: string }[] = [
  { id: 'admin', label: 'Administrator', desc: 'Tizim, foydalanuvchilar va sozlamalar' },
  { id: 'menejer', label: 'Loyiha menejeri', desc: 'Arizalarni qabul qiladi va jarayonni yuritadi' },
  { id: 'komplayens', label: "Komplayens qo'mitasi", desc: 'Faoliyat va shartlarning investitsiya siyosatiga muvofiqligi' },
  { id: 'investitsiya', label: "Investitsiya qo'mitasi", desc: 'Moliyaviy baho, risk va foyda taqsimoti nisbati' },
  { id: 'yuridik', label: 'Yuridik xizmat', desc: 'Shartnoma va hujjatlarning huquqiy ekspertizasi' },
  { id: 'audit', label: 'Ichki audit', desc: 'Jarayon va qarorlarni mustaqil taftish qiladi' },
  { id: 'investor', label: 'Investor', desc: 'Portfel, shartnomalar va daromadni kuzatadi' },
  { id: 'biznes', label: 'Ijrochi sherik (biznes)', desc: 'Investitsiya uchun ariza beradi, hisobot topshiradi' },
];

export const roleLabel = (r: Role) => ROLES.find((x) => x.id === r)?.label ?? r;
