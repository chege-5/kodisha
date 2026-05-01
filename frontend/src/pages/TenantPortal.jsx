import { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { getFriendlyError } from '../utils/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Droplets,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Phone,
  Receipt,
  Send,
  ShieldCheck,
  UserCircle,
  Wallet,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bills', label: 'Bills', icon: Receipt },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: UserCircle },
];

const BILL_ICONS = {
  RENT: Receipt,
  WATER: Droplets,
  ELECTRICITY: Zap,
  GARBAGE: FileText,
  SERVICE_CHARGE: FileText,
  OTHER: FileText,
};

const ISSUE_TYPES = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'OTHER', label: 'Other' },
];

function statusBadge(status) {
  if (status === 'PAID' || status === 'CLOSED') return 'badge-green';
  if (status === 'OVERDUE' || status === 'URGENT') return 'badge-red';
  if (status === 'PARTIALLY_PAID' || status === 'OPEN') return 'badge-amber';
  if (status === 'IN_PROGRESS') return 'badge-blue';
  return 'badge-gray';
}

function trustLabel(score) {
  if (score >= 750) return 'Excellent';
  if (score >= 650) return 'Good';
  if (score >= 550) return 'Fair';
  return 'Building';
}

function monthLabel(date) {
  return date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-kodi-text-primary">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-kodi-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-kodi-border bg-white/70 px-6 py-10 text-center">
      <Icon className="mx-auto h-9 w-9 text-kodi-text-muted" />
      <p className="mt-3 text-sm font-semibold text-kodi-text-secondary">{title}</p>
      {text && <p className="mt-1 text-xs text-kodi-text-muted">{text}</p>}
    </div>
  );
}

function Sidebar({ activePage, setActivePage, user, tenant, onLogout, mobileOpen, setMobileOpen }) {
  const content = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-kodi-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-kodi-accent text-white">
          <Home className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-kodi-text-primary">Kodisha</p>
          <p className="truncate text-xs text-kodi-text-muted">Tenant workspace</p>
        </div>
      </div>

      <div className="border-b border-kodi-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-kodi-text-primary">{tenant?.name || user?.name || 'Tenant'}</p>
            <p className="truncate text-xs text-kodi-text-muted">{tenant?.phone || user?.phone || 'No phone'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActivePage(id);
              setMobileOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${
              activePage === id
                ? 'bg-kodi-accent text-white shadow-lg shadow-kodi-accent/20'
                : 'text-kodi-text-secondary hover:bg-white hover:text-kodi-text-primary'
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
            {activePage === id && <ChevronRight className="ml-auto h-4 w-4" />}
          </button>
        ))}
      </nav>

      <div className="border-t border-kodi-border p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-kodi-text-muted transition-all hover:bg-rose-500/10 hover:text-kodi-rose"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-72 flex-shrink-0 border-r border-kodi-border bg-slate-50/95 lg:flex lg:flex-col">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-80 max-w-[86vw] flex-col bg-slate-50 shadow-2xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-kodi-text-muted hover:bg-white hover:text-kodi-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

function StatCard({ icon: Icon, label, value, tone = 'indigo', detail }) {
  const tones = {
    indigo: 'bg-indigo-500/10 text-indigo-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    rose: 'bg-rose-500/10 text-rose-600',
    amber: 'bg-amber-500/10 text-amber-600',
    cyan: 'bg-cyan-500/10 text-cyan-600',
  };

  return (
    <div className="rounded-2xl border border-kodi-border bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kodi-text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-kodi-text-primary">{value}</p>
          {detail && <p className="mt-1 text-xs text-kodi-text-muted">{detail}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone] || tones.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function TenantPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activePage, setActivePage] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ category: 'PLUMBING', description: '' });

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant-detail', user?.id],
    queryFn: () => api.get(`/tenants/${user?.id}`).then((r) => r.data),
    enabled: !!user?.id,
  });

  const { data: billsData, isLoading: billsLoading } = useQuery({
    queryKey: ['tenant-bills'],
    queryFn: () => api.get('/bills').then((r) => r.data),
  });

  const { data: notifData } = useQuery({
    queryKey: ['tenant-notifications'],
    queryFn: () => api.get('/notifications?limit=10').then((r) => r.data),
  });

  const stkPush = useMutation({
    mutationFn: (data) => api.post('/mpesa/stkpush', data).then((r) => r.data),
    onSuccess: () => toast.success('M-Pesa prompt sent. Check your phone.'),
    onError: (err) => toast.error(getFriendlyError(err, 'Payment request failed')),
  });

  const reportIssue = useMutation({
    mutationFn: (data) => api.post(`/tenants/${user.id}/tickets`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Issue reported.');
      setIssueForm({ category: 'PLUMBING', description: '' });
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', user?.id] });
    },
    onError: (err) => toast.error(getFriendlyError(err, 'Failed to submit issue')),
  });

  const now = new Date();
  const payments = tenant?.payments || [];
  const bills = billsData?.bills || [];
  const notifications = notifData?.notifications || [];
  const tickets = tenant?.tickets || [];
  const rentAmount = Number(tenant?.unit?.rentAmount || 0);
  const currentMonthPayments = payments.filter((p) => p.periodMonth === now.getMonth() + 1 && p.periodYear === now.getFullYear());
  const paidThisMonth = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const rentBalance = Math.max(0, rentAmount - paidThisMonth);
  const unpaidBills = bills.filter((b) => ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(b.status));
  const nonRentBills = unpaidBills.filter((bill) => bill.type !== 'RENT');
  const nonRentBillBalance = nonRentBills.reduce((sum, bill) => sum + Math.max(0, Number(bill.amount || 0) - Number(bill.paidAmount || 0)), 0);
  const totalDue = rentBalance + nonRentBillBalance;
  const openTickets = tickets.filter((ticket) => ticket.status !== 'CLOSED');
  const trustScore = tenant?.trustScore?.score || 500;
  const nextDueDate = new Date(now.getFullYear(), now.getMonth(), 5);
  const latestBill = bills[0];
  const latestPayment = payments[0];

  const paymentProgress = rentAmount > 0 ? Math.min(100, (paidThisMonth / rentAmount) * 100) : 0;

  const recentActivity = useMemo(() => {
    const paymentItems = payments.slice(0, 4).map((payment) => ({
      id: `payment-${payment.id}`,
      title: `${formatCurrency(payment.amount)} rent payment`,
      meta: `${formatDate(payment.paymentDate)} - ${payment.channel}`,
      icon: CreditCard,
      tone: 'bg-emerald-500/10 text-emerald-600',
    }));

    const billItems = bills.slice(0, 4).map((bill) => ({
      id: `bill-${bill.id}`,
      title: `${bill.type} bill ${formatCurrency(bill.amount)}`,
      meta: `Due ${formatDate(bill.dueDate)} - ${bill.status}`,
      icon: Receipt,
      tone: bill.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600',
    }));

    return [...paymentItems, ...billItems].slice(0, 6);
  }, [payments, bills]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function payAmount(amount) {
    if (!amount || amount <= 0) return;
    stkPush.mutate({ tenantId: user.id, amount });
  }

  function renderOverview() {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-kodi-border bg-white p-5 shadow-xl shadow-slate-200/60 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${totalDue > 0 ? 'badge-amber' : 'badge-green'}`}>
                  {totalDue > 0 ? 'Payment pending' : 'Clear balance'}
                </span>
                <span className="badge badge-cyan">{monthLabel(now)}</span>
              </div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-kodi-text-primary sm:text-4xl">
                Hi, {tenant?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-kodi-text-muted">
                {tenant?.unit
                  ? `${tenant.unit.property?.name || 'Your property'}, Unit ${tenant.unit.unitNumber}`
                  : 'Your unit assignment will appear here once it is active.'}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-kodi-text-muted">Rent balance</p>
                  <p className="mt-1 text-xl font-bold text-kodi-text-primary">{formatCurrency(rentBalance)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-kodi-text-muted">Other bills</p>
                  <p className="mt-1 text-xl font-bold text-kodi-text-primary">{formatCurrency(nonRentBillBalance)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-kodi-text-muted">Due date</p>
                  <p className="mt-1 text-xl font-bold text-kodi-text-primary">{formatDate(nextDueDate)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-kodi-navy p-5 text-white">
              <p className="text-sm text-white/70">Total due now</p>
              <p className="mt-2 text-4xl font-bold">{formatCurrency(totalDue)}</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${paymentProgress}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-white/60">
                <span>{formatCurrency(paidThisMonth)} paid</span>
                <span>{Math.round(paymentProgress)}%</span>
              </div>
              <button
                type="button"
                onClick={() => payAmount(totalDue)}
                disabled={stkPush.isPending || totalDue <= 0}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-kodi-navy transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {stkPush.isPending ? 'Sending prompt...' : totalDue > 0 ? 'Pay with M-Pesa' : 'No payment due'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Wallet} label="Monthly rent" value={formatCurrency(rentAmount)} detail="Current lease rent" />
          <StatCard icon={Receipt} label="Open bills" value={unpaidBills.length} detail={formatCurrency(nonRentBillBalance)} tone="amber" />
          <StatCard icon={Wrench} label="Open issues" value={openTickets.length} detail="Maintenance requests" tone="rose" />
          <StatCard icon={ShieldCheck} label="Trust score" value={trustScore} detail={trustLabel(trustScore)} tone="emerald" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-kodi-border bg-white p-5 shadow-sm shadow-slate-200/70">
            <SectionTitle title="Recent activity" subtitle="Payments and bill updates" />
            <div className="mt-5 space-y-3">
              {recentActivity.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No activity yet" text="Payments and bills will appear here." />
              ) : recentActivity.map((item) => {
                const ActivityIcon = item.icon;
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-kodi-border bg-slate-50 px-4 py-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-kodi-text-primary">{item.title}</p>
                      <p className="truncate text-xs text-kodi-text-muted">{item.meta}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-kodi-border bg-white p-5 shadow-sm shadow-slate-200/70">
            <SectionTitle title="Lease snapshot" subtitle="Unit, deposit, and contacts" />
            <div className="mt-5 space-y-3">
              {[
                ['Property', tenant?.unit?.property?.name || 'Not assigned', Building2],
                ['Unit', tenant?.unit?.unitNumber || 'Not assigned', Home],
                ['Lease start', tenant?.leaseStart ? formatDate(tenant.leaseStart) : 'Not set', CalendarDays],
                ['Deposit', `${formatCurrency(tenant?.depositAmount)} - ${tenant?.depositStatus || 'Not set'}`, Wallet],
                ['Phone', tenant?.phone || user?.phone || 'Not set', Phone],
              ].map(([label, value, Icon]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-kodi-accent" />
                    <span className="text-sm text-kodi-text-muted">{label}</span>
                  </div>
                  <span className="text-right text-sm font-semibold text-kodi-text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderBills() {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="Bills"
          subtitle={`${bills.length} bill records - ${unpaidBills.length} unpaid`}
          action={
            <button
              type="button"
              onClick={() => payAmount(totalDue)}
              disabled={stkPush.isPending || totalDue <= 0}
              className="btn-primary"
            >
              <Send className="h-4 w-4" />
              Pay due balance
            </button>
          }
        />

        {billsLoading ? (
          <div className="grid gap-3">
            {[...Array(4)].map((_, index) => <div key={index} className="h-24 skeleton" />)}
          </div>
        ) : bills.length === 0 ? (
          <EmptyState icon={Receipt} title="No bills found" text="Generated rent, water, and utility bills will appear here." />
        ) : (
          <div className="grid gap-3">
            {bills.map((bill) => {
              const Icon = BILL_ICONS[bill.type] || FileText;
              const due = Math.max(0, Number(bill.amount || 0) - Number(bill.paidAmount || 0));
              return (
                <div key={bill.id} className="rounded-2xl border border-kodi-border bg-white p-5 shadow-sm shadow-slate-200/70">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-kodi-text-primary">{bill.type} bill</p>
                          <span className={`badge ${statusBadge(bill.status)}`}>{bill.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-kodi-text-muted">{bill.description || `Due ${formatDate(bill.dueDate)}`}</p>
                        <p className="mt-2 text-xs text-kodi-text-muted">Unit {bill.unit?.unitNumber || tenant?.unit?.unitNumber || '-'}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-kodi-text-primary">{formatCurrency(bill.amount)}</p>
                      <p className="text-xs text-kodi-text-muted">Due {formatDate(bill.dueDate)}</p>
                      <p className="mt-1 text-xs text-kodi-text-muted">Balance {formatCurrency(due)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderPayments() {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="Payments"
          subtitle={`${payments.length} payment records - latest ${latestPayment ? formatDate(latestPayment.paymentDate) : 'none'}`}
        />
        {payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records" text="Rent receipts and M-Pesa payments will appear here." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-kodi-border bg-white shadow-sm shadow-slate-200/70">
            <div className="hidden grid-cols-[1fr_1fr_1fr_1fr] gap-4 border-b border-kodi-border bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-kodi-text-muted md:grid">
              <span>Amount</span>
              <span>Date</span>
              <span>Channel</span>
              <span>Status</span>
            </div>
            {payments.map((payment) => (
              <div key={payment.id} className="grid gap-3 border-b border-kodi-border px-5 py-4 last:border-b-0 md:grid-cols-[1fr_1fr_1fr_1fr] md:items-center">
                <div>
                  <p className="text-sm font-bold text-kodi-text-primary">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-kodi-text-muted md:hidden">{formatDate(payment.paymentDate)}</p>
                </div>
                <p className="hidden text-sm text-kodi-text-secondary md:block">{formatDate(payment.paymentDate)}</p>
                <p className="text-sm text-kodi-text-secondary">{payment.channel}</p>
                <span className={`badge w-fit ${payment.daysLate > 0 ? 'badge-red' : 'badge-green'}`}>
                  {payment.daysLate > 0 ? `${payment.daysLate} days late` : 'On time'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderMaintenance() {
    return (
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-kodi-border bg-white p-5 shadow-sm shadow-slate-200/70">
          <SectionTitle title="Report an issue" subtitle="Send maintenance requests to the property team" />
          <div className="mt-5 space-y-4">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={issueForm.category}
                onChange={(event) => setIssueForm({ ...issueForm, category: event.target.value })}
              >
                {ISSUE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-32 resize-none"
                placeholder="Describe the issue"
                value={issueForm.description}
                onChange={(event) => setIssueForm({ ...issueForm, description: event.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => reportIssue.mutate({ ...issueForm, unitId: tenant?.unitId, tenantId: user.id })}
              disabled={reportIssue.isPending || !issueForm.description.trim() || !tenant?.unitId}
              className="btn-primary w-full"
            >
              <MessageSquare className="h-4 w-4" />
              {reportIssue.isPending ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle title="Maintenance history" subtitle={`${openTickets.length} open request(s)`} />
          {tickets.length === 0 ? (
            <EmptyState icon={Wrench} title="No requests yet" text="Reported maintenance issues will appear here." />
          ) : tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-2xl border border-kodi-border bg-white p-5 shadow-sm shadow-slate-200/70">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-kodi-text-primary">{ticket.category}</p>
                    <span className={`badge ${statusBadge(ticket.status)}`}>{ticket.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-kodi-text-muted">{ticket.description}</p>
                  <p className="mt-3 text-xs text-kodi-text-muted">Reported {formatDate(ticket.createdAt)}</p>
                </div>
                <Wrench className="h-5 w-5 flex-shrink-0 text-kodi-amber" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAlerts() {
    return (
      <div className="space-y-6">
        <SectionTitle title="Alerts" subtitle={`${notifications.length} recent notification(s)`} />
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No alerts" text="Bill, payment, and maintenance alerts will appear here." />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className={`rounded-2xl border bg-white p-5 shadow-sm shadow-slate-200/70 ${notification.isRead ? 'border-kodi-border' : 'border-kodi-accent/40'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${notification.isRead ? 'bg-slate-100 text-kodi-text-muted' : 'bg-kodi-accent/10 text-kodi-accent'}`}>
                    {notification.type === 'BILL_GENERATED' ? <Receipt className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-kodi-text-primary">{notification.title}</p>
                      {!notification.isRead && <span className="badge badge-blue">New</span>}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-kodi-text-muted">{notification.message}</p>
                    <p className="mt-2 text-xs text-kodi-text-muted">{formatDate(notification.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderProfile() {
    const rows = [
      ['Full name', tenant?.name || user?.name || 'Not set', UserCircle],
      ['Phone', tenant?.phone || user?.phone || 'Not set', Phone],
      ['Email', tenant?.email || 'Not provided', MessageSquare],
      ['Property', tenant?.unit?.property?.name || 'Not assigned', Building2],
      ['Unit', tenant?.unit?.unitNumber || 'Not assigned', Home],
      ['Lease start', tenant?.leaseStart ? formatDate(tenant.leaseStart) : 'Not set', CalendarDays],
      ['Lease end', tenant?.leaseEnd ? formatDate(tenant.leaseEnd) : 'Not set', CalendarDays],
      ['Deposit amount', formatCurrency(tenant?.depositAmount), Wallet],
      ['Deposit status', tenant?.depositStatus || 'Not set', CheckCircle2],
      ['Trust score', `${trustScore} - ${trustLabel(trustScore)}`, ShieldCheck],
    ];

    return (
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-kodi-border bg-white p-6 shadow-sm shadow-slate-200/70">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-kodi-accent text-white">
              <UserCircle className="h-9 w-9" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-kodi-text-primary">{tenant?.name || user?.name || 'Tenant'}</h2>
              <p className="text-sm text-kodi-text-muted">{tenant?.phone || user?.phone || 'No phone'}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-kodi-text-muted">Trust score</p>
              <p className="mt-1 text-2xl font-bold text-kodi-text-primary">{trustScore}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-kodi-text-muted">Open issues</p>
              <p className="mt-1 text-2xl font-bold text-kodi-text-primary">{openTickets.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-kodi-border bg-white p-5 shadow-sm shadow-slate-200/70">
          <SectionTitle title="Profile details" subtitle="Account, lease, and unit information" />
          <div className="mt-5 divide-y divide-kodi-border">
            {rows.map(([label, value, Icon]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-kodi-accent" />
                  <span className="text-sm text-kodi-text-muted">{label}</span>
                </div>
                <span className="text-right text-sm font-semibold text-kodi-text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderPage() {
    if (tenantLoading) {
      return (
        <div className="space-y-4">
          <div className="h-56 skeleton" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => <div key={index} className="h-32 skeleton" />)}
          </div>
        </div>
      );
    }

    switch (activePage) {
      case 'bills':
        return renderBills();
      case 'payments':
        return renderPayments();
      case 'maintenance':
        return renderMaintenance();
      case 'alerts':
        return renderAlerts();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  }

  const activeNav = NAV_ITEMS.find((item) => item.id === activePage) || NAV_ITEMS[0];
  const latestSummary = latestBill
    ? `${latestBill.type} bill due ${formatDate(latestBill.dueDate)}`
    : 'No active bill yet';

  return (
    <div className="flex min-h-screen bg-slate-100 text-kodi-text-primary">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        tenant={tenant}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-kodi-border bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-2xl border border-kodi-border bg-white p-2 text-kodi-text-muted lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-kodi-text-primary">{activeNav.label}</p>
                <p className="hidden truncate text-xs text-kodi-text-muted sm:block">{latestSummary}</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-2xl border border-kodi-border bg-slate-50 px-4 py-2 text-sm">
                <span className="text-kodi-text-muted">Total due </span>
                <span className="font-bold text-kodi-text-primary">{formatCurrency(totalDue)}</span>
              </div>
              {totalDue > 0 ? (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            {renderPage()}
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-kodi-border bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-6 gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivePage(id)}
                className={`flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-all ${
                  activePage === id ? 'bg-kodi-accent text-white' : 'text-kodi-text-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="max-w-full truncate px-1">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
