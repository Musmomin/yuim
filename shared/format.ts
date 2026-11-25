const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export const money = (n: number) => `${nf.format(Math.round(n))} so'm`;

export function shortMoney(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(abs >= 1e10 ? 1 : 2).replace('.', ',')} mlrd so'm`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)} mln so'm`;
  return `${sign}${nf.format(abs)} so'm`;
}

export const num = (n: number) => nf.format(n);

export function date(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function dateTime(iso: string) {
  const d = new Date(iso);
  return `${date(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
export function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}
