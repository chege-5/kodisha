import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function useAllPayments(params) {
  return useQuery({
    queryKey: ['all-payments', params],
    queryFn: () => api.get('/tenants', { params: { ...params, limit: 200 } })
      .then(async (r) => {
        const tenants = r.data.tenants || [];
        const allPayments = [];
        for (const t of tenants) {
          const pRes = await api.get(`/tenants/${t.id}/payments`);
          pRes.data.forEach((p) => allPayments.push({ ...p, tenantName: t.name, unitNumber: t.unit?.unitNumber }));
        }
        return allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      }),
  });
}

export default function Payments() {
  const [channel, setChannel] = useState('');
  const { data: payments = [], isLoading } = useAllPayments({ channel: channel || undefined });

  function exportCSV() {
    const rows = [
      ['Date', 'Tenant', 'Unit', 'Amount', 'Channel', 'Reference', 'Days Late', 'Partial'],
      ...payments.map((p) => [
        formatDate(p.paymentDate), p.tenantName, p.unitNumber,
        p.amount, p.channel, p.mpesaTransactionId || '', p.daysLate, p.isPartial,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kodi-payments-${Date.now()}.csv`;
    a.click();
  }

  const totalCollected = payments.reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="page-shell p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Payments</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-kodi-dark">Payment Ledger</h1>
          <p className="mt-1 text-sm text-kodi-text-muted">{payments.length} transactions · {formatCurrency(totalCollected)} total</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-36" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">All channels</option>
            <option value="MPESA">M-Pesa</option>
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
          </select>
          <button onClick={exportCSV} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-kodi-border/50 bg-slate-50">
              <tr>
                {['Date', 'Tenant', 'Unit', 'Amount', 'Channel', 'M-Pesa Ref', 'Status'].map((h) => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className={`table-row ${p.daysLate > 0 ? 'bg-rose-50/50' : ''}`}>
                  <td className="table-td">{formatDate(p.paymentDate)}</td>
                  <td className="table-td font-medium">{p.tenantName}</td>
                  <td className="table-td text-kodi-text-muted">Unit {p.unitNumber}</td>
                  <td className="table-td font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="table-td"><span className="badge badge-blue">{p.channel}</span></td>
                  <td className="table-td text-xs text-kodi-text-muted">{p.mpesaTransactionId || '—'}</td>
                  <td className="table-td">
                    {p.isPartial
                      ? <span className="badge badge-amber">Partial</span>
                      : p.daysLate > 0
                      ? <span className="badge badge-red">{p.daysLate}d late</span>
                      : <span className="badge badge-green">On time</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div className="text-center py-12 text-gray-400">No payments found</div>
          )}
        </div>
      )}
    </div>
  );
}
