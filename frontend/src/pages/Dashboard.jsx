import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, Brain, Building2, CreditCard, Droplets,
  FileText, Home, Megaphone, Receipt, TrendingUp, Users, Wrench, Zap,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

function StatCard({ icon: Icon, label, value, color = '#1D4ED8', sub }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-kodi-text-muted">{label}</span>
        <div className="rounded-xl border border-kodi-border bg-kodi-navy p-2">
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="mt-1 text-2xl font-black text-kodi-dark">{value}</p>
      {sub && <p className="text-xs text-kodi-text-muted">{sub}</p>}
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#14213D',
      borderColor: '#1D4ED8',
      borderWidth: 1,
      titleColor: '#F8FAFC',
      bodyColor: '#E2E8F0',
      cornerRadius: 12,
      padding: 12,
      callbacks: { label: (context) => `KSh ${Number(context.raw || 0).toLocaleString('en-KE')}` },
    },
  },
  scales: {
    y: {
      grid: { color: 'rgba(226, 232, 240, 0.9)', drawBorder: false },
      ticks: { color: '#64748B', callback: (value) => `${(value / 1000).toFixed(0)}k`, font: { size: 11 } },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#64748B', font: { size: 11 } },
    },
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['landlord-dashboard'],
    queryFn: () => api.get('/landlords/dashboard').then((response) => response.data),
  });
  const { data: insights } = useQuery({
    queryKey: ['insights-prediction'],
    queryFn: () => api.get('/insights/overdue-prediction').then((response) => response.data),
  });
  const { data: occupancy } = useQuery({
    queryKey: ['insights-occupancy'],
    queryFn: () => api.get('/insights/occupancy').then((response) => response.data),
  });
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-dashboard'],
    queryFn: () => api.get('/landlords/properties').then((response) => response.data),
  });
  const { data: billsData } = useQuery({
    queryKey: ['dashboard-overdue-bills'],
    queryFn: () => api.get('/bills?status=OVERDUE&limit=6').then((response) => response.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <div className="h-10 w-72 skeleton" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          {[...Array(6)].map((_, index) => <div key={index} className="h-28 skeleton" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 skeleton lg:col-span-2" />
          <div className="h-80 skeleton" />
        </div>
      </div>
    );
  }

  const { overview = {}, monthlyTrend = [], arrears = [] } = data || {};
  const totalUnits = (overview.occupiedUnits || 0) + (overview.vacantUnits || 0) + (overview.maintenanceUnits || 0);
  const occupancyRate = totalUnits > 0 ? Math.round((overview.occupiedUnits / totalUnits) * 100) : 0;
  const vacancyRate = totalUnits > 0 ? Math.round((overview.vacantUnits / totalUnits) * 100) : 0;
  const atRisk = insights?.totalAtRisk || 0;
  const overdueBills = billsData?.bills || [];

  const lineData = {
    labels: monthlyTrend.map((month) => {
      const [year, monthNum] = month.month.split('-');
      return new Date(year, monthNum - 1).toLocaleDateString('en-KE', { month: 'short' });
    }),
    datasets: [{
      data: monthlyTrend.map((month) => month.collected),
      borderColor: '#1D4ED8',
      backgroundColor: (context) => {
        const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(29, 78, 216, 0.24)');
        gradient.addColorStop(1, 'rgba(29, 78, 216, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#1D4ED8',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
    }],
  };

  const donutData = {
    labels: ['Occupied', 'Vacant', 'Maintenance'],
    datasets: [{
      data: [overview.occupiedUnits || 0, overview.vacantUnits || 0, overview.maintenanceUnits || 0],
      backgroundColor: ['#1D4ED8', '#94A3B8', '#F59E0B'],
      borderColor: '#FFFFFF',
      borderWidth: 3,
    }],
  };

  const propertyBarData = {
    labels: (occupancy?.properties || []).map((property) => property.name),
    datasets: [{
      data: (occupancy?.properties || []).map((property) => Number(property.occupancyRate || 0)),
      backgroundColor: '#10B981',
      borderRadius: 8,
    }],
  };

  const attentionItems = [
    ...arrears.slice(0, 3).map((tenant) => ({
      title: tenant.name,
      type: 'Overdue tenant',
      detail: `Unit ${tenant.unit} owes ${formatCurrency(tenant.arrears)}`,
      icon: AlertTriangle,
      tone: 'text-kodi-rose bg-red-50',
      to: `/dashboard/tenants/${tenant.tenantId}`,
    })),
    ...(overview.vacantUnits ? [{
      title: `${overview.vacantUnits} vacant unit${overview.vacantUnits === 1 ? '' : 's'}`,
      type: 'Vacancy',
      detail: 'Review inventory and add tenants',
      icon: Home,
      tone: 'text-kodi-amber bg-amber-50',
      to: '/dashboard/units',
    }] : []),
    ...overdueBills.slice(0, 2).map((bill) => ({
      title: `${bill.type} bill`,
      type: 'Pending bill',
      detail: `${bill.tenant?.name || 'Tenant'} - ${formatCurrency(bill.amount)} due ${formatDate(bill.dueDate)}`,
      icon: Receipt,
      tone: 'text-kodi-accent bg-blue-50',
      to: '/dashboard/billing',
    })),
    ...(atRisk ? [{
      title: `${atRisk} tenant${atRisk === 1 ? '' : 's'} at risk`,
      type: 'Insight',
      detail: 'Review likely late payers',
      icon: Brain,
      tone: 'text-kodi-accent bg-blue-50',
      to: '/dashboard/insights',
    }] : []),
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">Overview</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-kodi-dark">Financial command center</h1>
          <p className="mt-1 max-w-3xl text-sm text-kodi-text-muted">
            Welcome back, {user?.name?.split(' ')[0]}. Know who paid, who owes, what needs fixing, and what money is missing.
          </p>
        </div>
        <Link to="/dashboard/tenants" className="btn-primary">
          <Users className="h-4 w-4" /> Add Tenant
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard icon={Building2} label="Properties" value={properties.length || occupancy?.properties?.length || 0} color="#14213D" sub="managed" />
        <StatCard icon={Home} label="Occupied units" value={overview.occupiedUnits || 0} color="#1D4ED8" sub={`${occupancyRate}% occupied`} />
        <StatCard icon={AlertTriangle} label="Vacancy rate" value={`${vacancyRate}%`} color="#F59E0B" sub={`${overview.vacantUnits || 0} empty`} />
        <StatCard icon={TrendingUp} label="Collections" value={formatCurrency(overview.collectedThisMonth)} color="#10B981" sub="this month" />
        <StatCard icon={Receipt} label="Arrears" value={formatCurrency(overview.totalArrears)} color="#EF4444" sub={`${arrears.length} tenants`} />
        <StatCard icon={Wrench} label="Open tickets" value={overview.openTickets || 0} color="#F59E0B" sub="maintenance backlog" />
      </div>

      <div className="glass-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-kodi-dark">Smart actions</h2>
            <p className="text-xs text-kodi-text-muted">Fast paths for common landlord workflows.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {[
            ['/dashboard/properties', Building2, 'Add property'],
            ['/dashboard/properties', Home, 'Add unit'],
            ['/dashboard/tenants', Users, 'Add tenant'],
            ['/dashboard/payments', CreditCard, 'Record payment'],
            ['/dashboard/billing', Receipt, 'Generate bill'],
            ['/dashboard/broadcast', Megaphone, 'Raise broadcast'],
            ['/dashboard/tenants', FileText, 'Create lease'],
          ].map(([to, Icon, label]) => (
            <Link key={label} to={to} className="rounded-2xl border border-kodi-border bg-kodi-navy p-4 text-sm font-semibold text-kodi-text-secondary transition hover:border-kodi-accent hover:text-kodi-accent">
              <Icon className="mb-3 h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-kodi-dark">Collections trend by month</h2>
              <p className="text-xs text-kodi-text-muted">Last 6 months of rent movement.</p>
            </div>
            <Link to="/dashboard/reports" className="text-xs font-semibold text-kodi-accent">Reports</Link>
          </div>
          <div className="h-64">
            {monthlyTrend.length ? <Line data={lineData} options={chartOptions} /> : <div className="flex h-full items-center justify-center text-sm text-kodi-text-muted">No payment data yet</div>}
          </div>
        </div>

        <div className="glass-card">
          <h2 className="mb-4 text-base font-bold text-kodi-dark">Occupancy by status</h2>
          <div className="flex h-48 items-center justify-center">
            <Doughnut data={donutData} options={{ cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#64748B', font: { size: 11 }, padding: 16, usePointStyle: true } } } }} />
          </div>
          <div className="mt-2 text-center">
            <p className="gradient-text text-3xl font-black">{occupancyRate}%</p>
            <p className="text-xs text-kodi-text-muted">overall occupancy</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="glass-card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-kodi-dark">Needs attention now</h2>
              <p className="text-xs text-kodi-text-muted">Overdue tenants, vacancies, pending bills, and risk signals.</p>
            </div>
            <Link to="/dashboard/tenants" className="text-xs font-semibold text-kodi-accent">View tenants</Link>
          </div>
          {attentionItems.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
              <TrendingUp className="mx-auto mb-2 h-7 w-7 text-kodi-emerald" />
              <p className="font-semibold text-kodi-emerald">Nothing urgent right now</p>
              <p className="mt-1 text-xs text-kodi-text-muted">Rent, bills, and tickets look controlled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionItems.slice(0, 7).map(({ title, type, detail, icon: Icon, tone, to }) => (
                <Link key={`${type}-${title}`} to={to} className="flex items-center justify-between gap-4 rounded-2xl border border-kodi-border p-4 transition hover:border-kodi-accent/40 hover:bg-kodi-navy">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2 ${tone}`}><Icon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-semibold text-kodi-dark">{title}</p>
                      <p className="text-xs text-kodi-text-muted">{type}</p>
                    </div>
                  </div>
                  <p className="max-w-[45%] text-right text-xs font-medium text-kodi-text-secondary">{detail}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-kodi-dark"><Zap className="h-4 w-4 text-kodi-amber" /> Insight panel</h2>
              <span className="badge badge-blue"><Brain className="mr-1 h-3 w-3" /> Smart analysis</span>
            </div>
            <div className="space-y-3">
              {(insights?.high || []).slice(0, 3).map((tenant) => (
                <div key={tenant.tenantId} className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-kodi-dark">{tenant.name}</p>
                    <span className="badge badge-red">High risk</span>
                  </div>
                  <p className="mt-1 text-xs text-kodi-text-muted">{tenant.riskFactors?.join(' - ')}</p>
                </div>
              ))}
              {(insights?.medium || []).slice(0, 2).map((tenant) => (
                <div key={tenant.tenantId} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-kodi-dark">{tenant.name}</p>
                    <span className="badge badge-amber">Medium risk</span>
                  </div>
                  <p className="mt-1 text-xs text-kodi-text-muted">{tenant.riskFactors?.join(' - ')}</p>
                </div>
              ))}
              {!(insights?.high?.length || insights?.medium?.length) && (
                <div className="rounded-2xl border border-kodi-border bg-kodi-navy p-5 text-center">
                  <Brain className="mx-auto mb-2 h-7 w-7 text-kodi-accent" />
                  <p className="text-sm font-semibold text-kodi-text-secondary">All tenants look healthy</p>
                  <p className="mt-1 text-xs text-kodi-text-muted">No risk flags detected.</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-kodi-dark"><BarChart3 className="h-4 w-4 text-kodi-emerald" /> Occupancy by property</h2>
            <div className="h-48">
              {(occupancy?.properties || []).length ? (
                <Bar data={propertyBarData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, tooltip: { ...chartOptions.plugins.tooltip, callbacks: { label: (context) => `${context.raw}% occupied` } } }, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100, ticks: { color: '#64748B', callback: (value) => `${value}%`, font: { size: 11 } } } } }} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-kodi-text-muted">No property occupancy data yet</div>
              )}
            </div>
          </div>

          <div className="glass-card">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-kodi-dark"><Droplets className="h-4 w-4 text-cyan-500" /> Water bills pending</h2>
            {overdueBills.length === 0 ? (
              <p className="text-sm text-kodi-text-muted">No overdue bills found.</p>
            ) : (
              <div className="space-y-2">
                {overdueBills.slice(0, 3).map((bill) => (
                  <Link key={bill.id} to="/dashboard/billing" className="flex items-center justify-between rounded-xl bg-kodi-navy px-3 py-2 text-sm">
                    <span className="font-medium text-kodi-text-secondary">{bill.tenant?.name || 'Tenant'} - {bill.type}</span>
                    <span className="text-kodi-rose">{formatCurrency(bill.amount)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
