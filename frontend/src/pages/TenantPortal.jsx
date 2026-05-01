import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Wallet, Receipt, CreditCard, Wrench, Bell, LogOut,
  Send, ChevronRight, Droplets, Bot, Shield,
  UserCircle,
} from 'lucide-react';

const TABS = [
  { id: 'balance', label: 'Balance', icon: Wallet },
  { id: 'bills', label: 'Bills', icon: Receipt },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'issues', label: 'Issues', icon: Wrench },
  { id: 'notify', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: UserCircle },
];

export default function TenantPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('balance');
  const [issueForm, setIssueForm] = useState({ category: 'PLUMBING', description: '' });
  const qc = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ['tenant-detail', user?.id],
    queryFn: () => api.get(`/tenants/${user?.id}`).then((r) => r.data),
    enabled: !!user?.id,
  });

  const { data: billsData } = useQuery({
    queryKey: ['tenant-bills'],
    queryFn: () => api.get('/bills').then((r) => r.data),
  });

  const { data: notifData } = useQuery({
    queryKey: ['tenant-notifications'],
    queryFn: () => api.get('/notifications?limit=10').then((r) => r.data),
  });

  const stkPush = useMutation({
    mutationFn: (data) => api.post('/mpesa/stkpush', data).then((r) => r.data),
    onSuccess: () => toast.success('M-Pesa prompt sent! Check your phone.'),
    onError: () => toast.error('Payment request failed'),
  });

  const reportIssue = useMutation({
    mutationFn: (data) => api.post(`/tenants/${user.id}/tickets`, data).then((r) => r.data),
    onSuccess: () => { toast.success('Issue reported!'); setIssueForm({ category: 'PLUMBING', description: '' }); qc.invalidateQueries(['tenant-detail']); },
    onError: () => toast.error('Failed to submit'),
  });

  const now = new Date();
  const payments = tenant?.payments || [];
  const thisMonth = payments.filter((p) => p.periodMonth === now.getMonth() + 1 && p.periodYear === now.getFullYear());
  const paid = thisMonth.reduce((s, p) => s + parseFloat(p.amount), 0);
  const rentAmount = parseFloat(tenant?.unit?.rentAmount || 0);
  const balance = Math.max(0, rentAmount - paid);
  const bills = billsData?.bills || [];
  const notifications = notifData?.notifications || [];

  return (
    <div className="min-h-screen bg-kodi-navy">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-kodi-accent/20 via-kodi-dark to-kodi-navy" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-kodi-accent/10 rounded-full blur-3xl" />
        <div className="relative px-4 py-6 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kodi-accent to-kodi-cyan flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Kodishaa</h1>
                <p className="text-xs text-kodi-text-muted">Welcome, {user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            <button onClick={async () => { await logout(); navigate('/login'); }}
              className="p-2 rounded-xl hover:bg-kodi-border/20 text-kodi-text-muted hover:text-white transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-4 -mt-2">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-kodi-card rounded-2xl border border-kodi-border/50 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                tab === id ? 'bg-kodi-accent text-white shadow-lg shadow-kodi-accent/30' : 'text-kodi-text-muted hover:text-kodi-text-primary'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Balance Tab */}
        {tab === 'balance' && (
          <div className="space-y-4 animate-fade-in">
            <div className={`rounded-2xl p-6 relative overflow-hidden ${balance > 0 ? 'bg-gradient-to-br from-rose-600 to-rose-800' : 'bg-gradient-to-br from-emerald-600 to-emerald-800'}`}>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />
              <p className="text-sm text-white/70">{balance > 0 ? 'Outstanding Balance' : 'Balance'}</p>
              <p className="text-4xl font-bold text-white mt-1">{formatCurrency(balance)}</p>
              <p className="text-sm text-white/50 mt-1">{now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</p>
              {balance === 0 && <p className="text-sm text-white/80 mt-2">✅ Fully paid. Thank you!</p>}
            </div>

            {balance > 0 && (
              <button onClick={() => stkPush.mutate({ tenantId: user.id, amount: balance })}
                disabled={stkPush.isPending}
                className="btn-success w-full py-3.5 text-base">
                <Send className="w-5 h-5" />
                {stkPush.isPending ? 'Sending M-Pesa prompt…' : `Pay ${formatCurrency(balance)} via M-Pesa`}
              </button>
            )}

            <div className="glass-card">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-kodi-text-muted">Unit</p>
                  <p className="text-sm font-semibold text-kodi-text-primary mt-0.5">{tenant?.unit ? `${tenant.unit.property?.name} — ${tenant.unit.unitNumber}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-kodi-text-muted">Monthly Rent</p>
                  <p className="text-sm font-semibold text-kodi-text-primary mt-0.5">{formatCurrency(rentAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-kodi-text-muted">Trust Score</p>
                  <p className="text-sm font-semibold text-kodi-accent mt-0.5 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> {tenant?.trustScore?.score || 500}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-kodi-text-muted">Lease Since</p>
                  <p className="text-sm font-semibold text-kodi-text-primary mt-0.5">{tenant?.leaseStart ? formatDate(tenant.leaseStart) : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bills Tab */}
        {tab === 'bills' && (
          <div className="space-y-3 animate-fade-in">
            {bills.length === 0 ? (
              <div className="glass-card text-center py-8">
                <Receipt className="w-8 h-8 text-kodi-text-muted mx-auto mb-2" />
                <p className="text-kodi-text-muted text-sm">No bills yet</p>
              </div>
            ) : bills.map((b) => (
              <div key={b.id} className="glass-card py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${b.type === 'WATER' ? 'bg-cyan-500/10' : 'bg-kodi-accent/10'}`}>
                      {b.type === 'WATER' ? <Droplets className="w-4 h-4 text-cyan-400" /> : <Receipt className="w-4 h-4 text-kodi-accent" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-kodi-text-primary">{b.type} Bill</p>
                      <p className="text-xs text-kodi-text-muted">{b.description?.slice(0, 40)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-kodi-text-primary">{formatCurrency(b.amount)}</p>
                    <span className={`badge text-[10px] ${b.status === 'PAID' ? 'badge-green' : b.status === 'OVERDUE' ? 'badge-red' : 'badge-amber'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments Tab */}
        {tab === 'payments' && (
          <div className="space-y-3 animate-fade-in">
            {payments.length === 0 ? (
              <div className="glass-card text-center py-8">
                <CreditCard className="w-8 h-8 text-kodi-text-muted mx-auto mb-2" />
                <p className="text-kodi-text-muted text-sm">No payment records</p>
              </div>
            ) : payments.map((p) => (
              <div key={p.id} className="glass-card py-3 px-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-kodi-text-primary">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-kodi-text-muted">{formatDate(p.paymentDate)} · {p.channel}</p>
                </div>
                <span className={`badge ${p.daysLate > 0 ? 'badge-red' : 'badge-green'}`}>
                  {p.daysLate > 0 ? `${p.daysLate}d late` : 'On time'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Issues Tab */}
        {tab === 'issues' && (
          <div className="space-y-4 animate-fade-in">
            {/* Existing tickets */}
            {(tenant?.tickets || []).length > 0 && (
              <div className="space-y-2">
                {tenant.tickets.map((t) => (
                  <div key={t.id} className="glass-card py-3 px-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-kodi-text-primary">{t.category}</span>
                      <span className={`badge ${t.status === 'OPEN' ? 'badge-amber' : t.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-green'}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-kodi-text-muted mt-1">{t.description?.slice(0, 60)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Report form */}
            <div className="glass-card space-y-4">
              <h2 className="font-semibold text-kodi-text-primary flex items-center gap-2">
                <Wrench className="w-4 h-4 text-kodi-amber" /> Report Issue
              </h2>
              <div>
                <label className="label">Type</label>
                <select className="input" value={issueForm.category} onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}>
                  <option value="PLUMBING">🚿 Plumbing</option>
                  <option value="ELECTRICAL">⚡ Electrical</option>
                  <option value="SECURITY">🔒 Security</option>
                  <option value="OTHER">🔧 Other</option>
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} placeholder="Describe the issue…"
                  value={issueForm.description} onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })} />
              </div>
              <button onClick={() => reportIssue.mutate({ ...issueForm, unitId: tenant?.unitId, tenantId: user.id })}
                disabled={reportIssue.isPending || !issueForm.description.trim()}
                className="btn-primary w-full">
                {reportIssue.isPending ? 'Submitting…' : 'Submit Issue'}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notify' && (
          <div className="space-y-3 animate-fade-in">
            {notifications.length === 0 ? (
              <div className="glass-card text-center py-8">
                <Bell className="w-8 h-8 text-kodi-text-muted mx-auto mb-2" />
                <p className="text-kodi-text-muted text-sm">No notifications</p>
              </div>
            ) : notifications.map((n) => (
              <div key={n.id} className={`glass-card py-3 px-5 ${!n.isRead ? 'border-l-2 border-l-kodi-accent' : ''}`}>
                <p className="text-sm font-medium text-kodi-text-primary">{n.title}</p>
                <p className="text-xs text-kodi-text-muted mt-0.5">{n.message}</p>
                <p className="text-[10px] text-kodi-text-muted mt-1">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-3 animate-fade-in">
            <div className="glass-card space-y-4">
              <h2 className="flex items-center gap-2 font-semibold text-kodi-dark">
                <UserCircle className="h-4 w-4 text-kodi-accent" /> Profile
              </h2>
              {[
                ['Name', tenant?.name || user?.name],
                ['Phone', tenant?.phone || user?.phone],
                ['Email', tenant?.email || 'Not provided'],
                ['Unit', tenant?.unit ? `${tenant.unit.property?.name} - ${tenant.unit.unitNumber}` : 'Unassigned'],
                ['Lease start', tenant?.leaseStart ? formatDate(tenant.leaseStart) : 'Not set'],
                ['Deposit status', tenant?.depositStatus || 'Not set'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-kodi-border py-2 last:border-0">
                  <span className="text-sm text-kodi-text-muted">{label}</span>
                  <span className="text-right text-sm font-semibold text-kodi-text-secondary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
