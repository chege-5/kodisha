import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useState } from 'react';
import { Receipt, Droplets, Zap, Trash2, Filter } from 'lucide-react';

const TYPE_ICON = { RENT: Receipt, WATER: Droplets, ELECTRICITY: Zap, GARBAGE: Trash2, OTHER: Receipt };
const TYPE_COLOR = { RENT: 'text-indigo-400 bg-indigo-500/10', WATER: 'text-cyan-400 bg-cyan-500/10', ELECTRICITY: 'text-amber-400 bg-amber-500/10' };

export default function Billing() {
  const [filter, setFilter] = useState({ type: '', status: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['bills', filter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter.type) params.set('type', filter.type);
      if (filter.status) params.set('status', filter.status);
      return api.get(`/bills?${params}`).then((r) => r.data);
    },
  });

  const bills = data?.bills || [];

  if (isLoading) return (
    <div className="p-8 space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton" />)}
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kodi-text-primary flex items-center gap-2">
            <Receipt className="w-6 h-6 text-kodi-accent" /> Billing
          </h1>
          <p className="text-kodi-text-muted text-sm mt-0.5">{bills.length} bill(s)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Filter className="w-4 h-4 text-kodi-text-muted" />
        <select className="input w-auto" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="RENT">Rent</option>
          <option value="WATER">Water</option>
          <option value="ELECTRICITY">Electricity</option>
        </select>
        <select className="input w-auto" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="PARTIALLY_PAID">Partial</option>
        </select>
      </div>

      {/* Bills List */}
      <div className="space-y-3">
        {bills.length === 0 ? (
          <div className="glass-card text-center py-12">
            <Receipt className="w-10 h-10 text-kodi-text-muted mx-auto mb-3" />
            <p className="text-kodi-text-secondary">No bills found</p>
          </div>
        ) : bills.map((b) => {
          const Icon = TYPE_ICON[b.type] || Receipt;
          const colorClass = TYPE_COLOR[b.type] || 'text-kodi-text-muted bg-kodi-border/20';
          const progress = Number(b.amount) > 0 ? (Number(b.paidAmount) / Number(b.amount)) * 100 : 0;
          return (
            <div key={b.id} className="glass-card-hover py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${colorClass}`}><Icon className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-kodi-text-primary">{b.type} Bill — {b.tenant?.name || 'Unknown'}</p>
                    <p className="text-xs text-kodi-text-muted">Unit {b.unit?.unitNumber} · {b.description?.slice(0, 50)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-kodi-text-primary">{formatCurrency(b.amount)}</p>
                  <span className={`badge text-[10px] ${b.status === 'PAID' ? 'badge-green' : b.status === 'OVERDUE' ? 'badge-red' : b.status === 'PARTIALLY_PAID' ? 'badge-amber' : 'badge-gray'}`}>
                    {b.status}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-kodi-border/30 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${b.status === 'PAID' ? 'bg-kodi-emerald' : b.status === 'OVERDUE' ? 'bg-kodi-rose' : 'bg-kodi-accent'}`}
                  style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-kodi-text-muted">
                <span>Paid: {formatCurrency(b.paidAmount)}</span>
                <span>Due: {formatDate(b.dueDate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
