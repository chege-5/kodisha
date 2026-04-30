import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCreditPassport } from '../hooks/usePayments';
import { useTenant, useSTKPush } from '../hooks/useTenants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import CreditPassport from '../components/CreditPassport';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TABS = ['Balance', 'Payments', 'My Passport', 'Report Issue'];

export default function TenantPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Balance');
  const [issueForm, setIssueForm] = useState({ category: 'PLUMBING', description: '' });
  const { data: tenant } = useTenant(user?.id);
  const { data: passport } = useCreditPassport(user?.id);
  const stkPush = useSTKPush();
  const qc = useQueryClient();

  const reportIssue = useMutation({
    mutationFn: (data) => api.post(`/tenants/${user.id}/tickets`, data).then((r) => r.data),
    onSuccess: () => { toast.success('Issue reported — caretaker notified'); setIssueForm({ category: 'PLUMBING', description: '' }); },
    onError: () => toast.error('Failed to submit issue'),
  });

  const now = new Date();
  const thisMonth = (tenant?.payments || []).filter((p) => p.periodMonth === now.getMonth() + 1 && p.periodYear === now.getFullYear());
  const paid = thisMonth.reduce((s, p) => s + parseFloat(p.amount), 0);
  const rentAmount = parseFloat(tenant?.unit?.rentAmount || 0);
  const balance = Math.max(0, rentAmount - paid);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-kodi-navy text-white px-4 py-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">KODI</h1>
            <p className="text-blue-200 text-sm">Welcome, {user?.name?.split(' ')[0]}</p>
          </div>
          <button onClick={async () => { await logout(); navigate('/login'); }} className="text-blue-200 text-sm hover:text-white">Sign out</button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === t ? 'bg-kodi-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Balance' && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-6 text-white ${balance > 0 ? 'bg-red-600' : 'bg-green-600'}`}>
              <p className="text-sm opacity-80">{balance > 0 ? 'Outstanding Balance' : 'Balance'}</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(balance)}</p>
              <p className="text-sm opacity-70 mt-1">{now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</p>
              {balance === 0 && <p className="text-sm mt-1">✅ Fully paid. Thank you!</p>}
            </div>

            {balance > 0 && (
              <button
                onClick={() => stkPush.mutate({ tenantId: user.id, amount: balance })}
                disabled={stkPush.isPending}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {stkPush.isPending ? 'Sending M-Pesa prompt…' : `📱 Pay ${formatCurrency(balance)} via M-Pesa`}
              </button>
            )}

            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Unit</p>
              <p className="font-semibold">{tenant?.unit ? `${tenant.unit.property?.name} — Unit ${tenant.unit.unitNumber}` : '—'}</p>
              <p className="text-sm text-gray-500 mt-2 mb-1">Rent</p>
              <p className="font-semibold">{formatCurrency(rentAmount)} / month</p>
            </div>
          </div>
        )}

        {tab === 'Payments' && (
          <div className="space-y-3">
            {(tenant?.payments || []).length === 0
              ? <p className="text-gray-400 text-center py-8">No payment records</p>
              : (tenant?.payments || []).map((p) => (
                <div key={p.id} className="card py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(p.paymentDate)} · {p.channel}</p>
                  </div>
                  <span className={`badge ${p.daysLate > 0 ? 'badge-red' : 'badge-green'}`}>
                    {p.daysLate > 0 ? `${p.daysLate}d late` : 'On time'}
                  </span>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'My Passport' && (
          <div className="card">
            <CreditPassport data={passport} />
          </div>
        )}

        {tab === 'Report Issue' && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Report a Maintenance Issue</h2>
            <div>
              <label className="label">Issue Type</label>
              <select className="input" value={issueForm.category} onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}>
                <option value="PLUMBING">🚿 Plumbing</option>
                <option value="ELECTRICAL">⚡ Electrical</option>
                <option value="SECURITY">🔒 Security</option>
                <option value="OTHER">🔧 Other</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={4} placeholder="Describe the issue in detail…"
                value={issueForm.description} onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })} />
            </div>
            <button
              onClick={() => reportIssue.mutate({ ...issueForm, unitId: tenant?.unitId, tenantId: user.id })}
              disabled={reportIssue.isPending || !issueForm.description.trim()}
              className="btn-primary w-full justify-center"
            >
              {reportIssue.isPending ? 'Submitting…' : 'Submit Issue'}
            </button>
            <p className="text-xs text-gray-400 text-center">You can also dial <strong>*384*100#</strong> or call the maintenance line</p>
          </div>
        )}
      </div>
    </div>
  );
}
