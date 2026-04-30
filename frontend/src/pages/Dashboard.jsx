import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, ArcElement,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, Building2, Wrench, Users,
  ArrowUpRight, ArrowDownRight, Zap, Brain, ChevronRight,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

function StatCard({ icon: Icon, label, value, trend, trendUp, color, sub }) {
  const colorMap = {
    emerald: { bg: 'from-emerald-500/20 to-emerald-500/5', icon: 'text-emerald-400', border: 'border-emerald-500/20', stat: '--stat-color: #10b981' },
    rose: { bg: 'from-rose-500/20 to-rose-500/5', icon: 'text-rose-400', border: 'border-rose-500/20', stat: '--stat-color: #f43f5e' },
    indigo: { bg: 'from-indigo-500/20 to-indigo-500/5', icon: 'text-indigo-400', border: 'border-indigo-500/20', stat: '--stat-color: #6366f1' },
    amber: { bg: 'from-amber-500/20 to-amber-500/5', icon: 'text-amber-400', border: 'border-amber-500/20', stat: '--stat-color: #f59e0b' },
    cyan: { bg: 'from-cyan-500/20 to-cyan-500/5', icon: 'text-cyan-400', border: 'border-cyan-500/20', stat: '--stat-color: #06b6d4' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="stat-card group" style={{ [c.stat.split(':')[0]]: c.stat.split(':')[1] }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-kodi-text-muted uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl bg-gradient-to-br ${c.bg} ${c.border} border`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-kodi-text-primary mt-1">{value}</p>
      <div className="flex items-center gap-2">
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
        {sub && <span className="text-xs text-kodi-text-muted">{sub}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['landlord-dashboard'],
    queryFn: () => api.get('/landlords/dashboard').then((r) => r.data),
  });
  const { data: insights } = useQuery({
    queryKey: ['insights-prediction'],
    queryFn: () => api.get('/insights/overdue-prediction').then((r) => r.data),
  });
  const { data: occupancy } = useQuery({
    queryKey: ['insights-occupancy'],
    queryFn: () => api.get('/insights/occupancy').then((r) => r.data),
  });

  if (isLoading) return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="h-10 w-72 skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-28 skeleton" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 skeleton lg:col-span-2" />
        <div className="h-80 skeleton" />
      </div>
    </div>
  );

  const { overview, monthlyTrend = [], arrears = [] } = data || {};
  const totalUnits = (overview?.occupiedUnits || 0) + (overview?.vacantUnits || 0) + (overview?.maintenanceUnits || 0);
  const occupancyRate = totalUnits > 0 ? ((overview?.occupiedUnits / totalUnits) * 100).toFixed(0) : 0;

  const chartData = {
    labels: monthlyTrend.map((m) => {
      const [y, mo] = m.month.split('-');
      return new Date(y, mo - 1).toLocaleDateString('en-KE', { month: 'short' });
    }),
    datasets: [{
      label: 'Collected',
      data: monthlyTrend.map((m) => m.collected),
      borderColor: '#6366f1',
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#0a0e27',
      pointBorderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161b3d',
        borderColor: '#1e2452',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        cornerRadius: 12,
        padding: 12,
        callbacks: { label: (c) => `KSh ${c.raw.toLocaleString('en-KE')}` },
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(30, 36, 82, 0.5)', drawBorder: false },
        ticks: { color: '#64748b', callback: (v) => `${(v / 1000).toFixed(0)}k`, font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
    },
  };

  const donutData = {
    labels: ['Occupied', 'Vacant', 'Maintenance'],
    datasets: [{
      data: [overview?.occupiedUnits || 0, overview?.vacantUnits || 0, overview?.maintenanceUnits || 0],
      backgroundColor: ['#6366f1', '#64748b', '#f59e0b'],
      borderColor: '#161b3d',
      borderWidth: 3,
    }],
  };

  const atRisk = insights?.totalAtRisk || 0;

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-kodi-text-primary">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-kodi-text-muted text-sm mt-0.5">Here's your property portfolio overview</p>
        </div>
        <Link to="/tenants" className="btn-primary">
          <Users className="w-4 h-4" /> Add Tenant
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={TrendingUp} label="Collected" value={formatCurrency(overview?.collectedThisMonth)} color="emerald" sub="this month" />
        <StatCard icon={AlertTriangle} label="Arrears" value={formatCurrency(overview?.totalArrears)} color="rose" sub={`${arrears.length} tenants`} />
        <StatCard icon={Building2} label="Occupancy" value={`${occupancyRate}%`} color="indigo" sub={`${overview?.occupiedUnits || 0}/${totalUnits} units`} />
        <StatCard icon={Wrench} label="Tickets" value={overview?.openTickets ?? 0} color="amber" sub="open issues" />
        <StatCard icon={Brain} label="At Risk" value={atRisk} color="cyan" sub="tenants flagged" />
      </div>

      {/* Chart + Occupancy + Arrears */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-kodi-text-primary">Revenue Trend</h2>
              <p className="text-xs text-kodi-text-muted mt-0.5">Last 6 months collection</p>
            </div>
            <Link to="/reports" className="text-xs text-kodi-accent hover:text-kodi-accent-light flex items-center gap-1">
              View Reports <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-64">
            {monthlyTrend.length > 0
              ? <Line data={chartData} options={chartOptions} />
              : <div className="flex items-center justify-center h-full text-kodi-text-muted text-sm">No payment data yet</div>}
          </div>
        </div>

        {/* Occupancy Donut */}
        <div className="glass-card">
          <h2 className="text-base font-semibold text-kodi-text-primary mb-4">Occupancy</h2>
          <div className="h-48 flex items-center justify-center">
            <Doughnut data={donutData} options={{
              cutout: '70%',
              plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 8 } },
              },
            }} />
          </div>
          <div className="text-center mt-2">
            <p className="text-3xl font-bold gradient-text">{occupancyRate}%</p>
            <p className="text-xs text-kodi-text-muted">occupancy rate</p>
          </div>
        </div>
      </div>

      {/* Arrears + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrears */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-kodi-text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-kodi-rose" /> Outstanding Arrears
            </h2>
            <Link to="/tenants?status=overdue" className="text-xs text-kodi-accent hover:text-kodi-accent-light flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {arrears.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-medium">All tenants paid up ✓</p>
              <p className="text-xs text-kodi-text-muted mt-1">Great collection rate this month!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {arrears.slice(0, 6).map((t, i) => (
                <Link key={t.tenantId} to={`/tenants/${t.tenantId}`}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-kodi-border/15 transition-all animate-in stagger-${i + 1}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-kodi-rose/10 flex items-center justify-center text-kodi-rose text-xs font-bold">
                      {t.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-kodi-text-primary">{t.name}</p>
                      <p className="text-xs text-kodi-text-muted">Unit {t.unit} · {t.daysOverdue}d overdue</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-kodi-rose">{formatCurrency(t.arrears)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-kodi-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-kodi-amber" /> AI Insights
            </h2>
            <span className="badge badge-purple">
              <Brain className="w-3 h-3 mr-1" /> Smart Analysis
            </span>
          </div>
          <div className="space-y-3">
            {(insights?.high || []).slice(0, 3).map((t) => (
              <div key={t.tenantId} className="p-3 rounded-xl bg-kodi-rose/5 border border-kodi-rose/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-kodi-text-primary">{t.name}</span>
                  <span className="badge badge-red">HIGH RISK</span>
                </div>
                <p className="text-xs text-kodi-text-muted">{t.riskFactors?.join(' · ')}</p>
              </div>
            ))}
            {(insights?.medium || []).slice(0, 2).map((t) => (
              <div key={t.tenantId} className="p-3 rounded-xl bg-kodi-amber/5 border border-kodi-amber/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-kodi-text-primary">{t.name}</span>
                  <span className="badge badge-amber">MEDIUM RISK</span>
                </div>
                <p className="text-xs text-kodi-text-muted">{t.riskFactors?.join(' · ')}</p>
              </div>
            ))}
            {!(insights?.high?.length || insights?.medium?.length) && (
              <div className="flex flex-col items-center py-6 text-center">
                <Brain className="w-8 h-8 text-kodi-accent mb-2" />
                <p className="text-sm text-kodi-text-secondary">All tenants look healthy</p>
                <p className="text-xs text-kodi-text-muted mt-1">No risk flags detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
