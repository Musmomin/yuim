import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, Search } from 'lucide-react';
import AppTable from '../components/AppTable';
import { Button, Card, inputCls, PageHeader } from '../components/ui';
import type { Stage } from '../data/types';
import { STAGE_LABEL } from '../lib/labels';
import { useStore } from '../store';

const FILTERS: (Stage | 'all')[] = ['all', 'yangi', 'korik', 'yuridik', 'imzolash', 'moliyalashtirildi', 'yakunlandi', 'rad'];

export default function Applications() {
  const { apps, role } = useStore();
  const [filter, setFilter] = useState<Stage | 'all'>('all');
  const [q, setQ] = useState('');

  const list = apps.filter(
    (a) =>
      (filter === 'all' || a.stage === filter) &&
      `${a.company} ${a.id} ${a.stir} ${a.sector} ${a.region}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Arizalar"
        subtitle="Investitsiya uchun kelib tushgan barcha arizalar"
        action={
          (role === 'menejer' || role === 'admin') && (
            <Link to="/arizalar/yangi">
              <Button>
                <FilePlus2 size={16} /> Yangi ariza
              </Button>
            </Link>
          )
        }
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const n = f === 'all' ? apps.length : apps.filter((a) => a.stage === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {f === 'all' ? 'Barchasi' : STAGE_LABEL[f]} <span className="opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="relative lg:ml-auto lg:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kompaniya, STIR, ID…" className={`${inputCls} pl-9`} />
          </div>
        </div>
        <AppTable apps={list} />
      </Card>
    </>
  );
}
