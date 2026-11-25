import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Badge, Card, Empty, inputCls, PageHeader } from '../components/ui';
import { ROLES } from '../data/mock';
import type { Role } from '../../shared/types';
import { dateTime } from '../../shared/format';
import { ROLE_TONE } from '../lib/labels';
import { useStore } from '../store';

export default function Audit() {
  const { audit } = useStore();
  const [role, setRole] = useState<Role | ''>('');
  const [q, setQ] = useState('');
  const list = audit.filter(
    (e) => (!role || e.role === role) && `${e.action} ${e.user} ${e.target ?? ''}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Audit jurnali" subtitle="Tizimdagi barcha qaror va harakatlar — o'zgartirib bo'lmaydigan yozuvlar" />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <select value={role} onChange={(e) => setRole(e.target.value as Role | '')} className={`${inputCls} sm:w-60`}>
            <option value="">Barcha rollar</option>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="relative sm:ml-auto sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish…" className={`${inputCls} pl-9`} />
          </div>
        </div>
        {list.length === 0 ? (
          <Empty>Yozuv topilmadi</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Vaqt</th>
                  <th className="px-3 py-3 font-medium">Foydalanuvchi</th>
                  <th className="px-3 py-3 font-medium">Harakat</th>
                  <th className="px-5 py-3 font-medium">Obyekt</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500">{dateTime(e.at)}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{e.user}</div>
                      <Badge tone={ROLE_TONE[e.role]}>{ROLES.find((r) => r.id === e.role)?.label}</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-800">{e.action}</td>
                    <td className="px-5 py-3">
                      {e.target ? (
                        <Link to={`/arizalar/${e.target}`} className="text-emerald-700 hover:underline">
                          {e.target}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
