import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTenant, useLogPayment, useSTKPush } from '../hooks/useTenants';
import { useCreditPassport } from '../hooks/usePayments';
import { useMutation } from '@tanstack/react-query';
import CreditPassport from '../components/CreditPassport';
import { formatCurrency, formatDate } from '../utils/formatters';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Payments', 'Credit Passport', 'Maintenance'];

export default function TenantDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('Overview');
  const { data: tenant, isLoading } = useTenant(id);
  const { data: passport } = useCreditPassport(id);
  const logPayment = useLogPayment(id);
  const stkPush = useSTKPush();
  const [payForm, setPayForm] = useState({ amount: '', channel: 'CASH', notes: '' });

  const generateLease = useMutation({
    mutationFn: () => api.post('/leases/generate', { tenantId: id, unitId: tenant?.unit?.id, landlordId: tenant?.unit?.property?.landlordId }).then((r) => r.data),
    onSuccess: (d) => { toast.success('Lease generated'); window.open(d.pdfUrl, '_blank'); },
    onError: () => toast.error('Lease generation failed'),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading tenant…</div>;
  if (!tenant) return <div className="p-8 text-red-500">Tenant not found</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tenants" className="text-gray-400 hover:text-gray-600 text-sm">← Tenants</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="card flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-500 text-sm">{tenant.phone} · {tenant.email || 'No email'}</p>
          {tenant.unit && (
            <p className="text-sm mt-1">
              <span className="font-medium">{tenant.unit.property.name}</span> — Unit {tenant.unit.unitNumber} · {formatCurrency(tenant.unit.rentAmount)}/mo
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">Lease: {formatDate(tenant.leaseStart)} → {tenant.leaseEnd ? formatDate(tenant.leaseEnd) : 'Ongoing'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => stkPush.mutate({ tenantId: id })}
            disabled={stkPush.isPending}
            className="btn-primary text-sm"
          >
            {stkPush.isPending ? 'Sending…' : '📱 STK Push'}
          </button>
          <button onClick={() => generateLease.mutate()} disabled={generateLease.isPending} className="btn-secondary text-sm">
            {generateLease.isPending ? 'Generating…' : '📄 Lease'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-kodi-navy text-kodi-navy' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Deposit Amount', formatCurrency(tenant.depositAmount)],
            ['Deposit Status', tenant.depositStatus],
            ['Total Payments', tenant._count?.payments ?? 0],
            ['Open Tickets', tenant._count?.tickets ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="stat-card">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-lg font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'Payments' && (
        <div className="space-y-4">
          {/* Log manual payment */}
          <div className="card">
            <h3 className="font-medium text-gray-900 mb-3">Log Manual Payment</h3>
            <div className="flex gap-3">
              <input type="number" placeholder="Amount (KSh)" className="input flex-1" value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
              <select className="input w-32" value={payForm.channel} onChange={(e) => setPayForm({ ...payForm, channel: e.target.value })}>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
              </select>
              <input placeholder="Notes" className="input flex-1" value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
              <button
                onClick={() => logPayment.mutate(payForm)}
                disabled={logPayment.isPending || !payForm.amount}
                className="btn-primary whitespace-nowrap"
              >
                {logPayment.isPending ? 'Saving…' : 'Log'}
              </button>
            </div>
          </div>

          {/* Payment history */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Date', 'Amount', 'Channel', 'Ref', 'Days Late', 'Partial'].map((h) => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(tenant.payments || []).map((p) => (
                  <tr key={p.id} className={p.daysLate > 0 ? 'bg-red-50' : ''}>
                    <td className="table-td">{formatDate(p.paymentDate)}</td>
                    <td className="table-td font-medium">{formatCurrency(p.amount)}</td>
                    <td className="table-td"><span className="badge badge-blue">{p.channel}</span></td>
                    <td className="table-td text-xs text-gray-400">{p.mpesaTransactionId || '—'}</td>
                    <td className="table-td">{p.daysLate > 0 ? <span className="badge badge-red">{p.daysLate}d</span> : <span className="badge badge-green">On time</span>}</td>
                    <td className="table-td">{p.isPartial ? <span className="badge badge-amber">Partial</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Credit Passport' && (
        <div className="card">
          <CreditPassport data={passport} />
        </div>
      )}

      {tab === 'Maintenance' && (
        <div className="space-y-3">
          {(tenant.tickets || []).length === 0
            ? <div className="card text-center py-12 text-gray-400">No maintenance tickets</div>
            : (tenant.tickets || []).map((t) => (
              <div key={t.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`badge ${t.status === 'CLOSED' ? 'badge-green' : t.status === 'IN_PROGRESS' ? 'badge-amber' : 'badge-red'}`}>
                      {t.status}
                    </span>
                    <p className="font-medium text-gray-900 mt-1">{t.category}</p>
                    <p className="text-sm text-gray-500">{t.description}</p>
                    {t.rating && <p className="text-xs text-gray-400 mt-1">Rating: {'⭐'.repeat(t.rating)}</p>}
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                </div>
                {t.voiceRecordingUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Voice Recording</p>
                    <audio controls src={t.voiceRecordingUrl} className="w-full h-8" />
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
