import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { useDashboard } from '../hooks/usePayments';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  BanknotesIcon, ExclamationTriangleIcon, HomeIcon,
  WrenchScrewdriverIcon, BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function StatCard({ icon: Icon, label, value, color = 'blue', sub }) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-600',
  };
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  if (isLoading) return (
    <div className="p-8 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />
      ))}
    </div>
  );

  const { overview, monthlyTrend = [], arrears = [] } = data || {};

  const chartData = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [{
      label: 'Rent Collected (KSh)',
      data: monthlyTrend.map((m) => m.collected),
      borderColor: '#1a365d',
      backgroundColor: 'rgba(26, 54, 93, 0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `KSh ${c.raw.toLocaleString('en-KE')}` } } },
    scales: {
      y: { ticks: { callback: (v) => `KSh ${(v / 1000).toFixed(0)}k` } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/tenants" className="btn-primary">+ Add Tenant</Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={BanknotesIcon} label="Collected This Month" value={formatCurrency(overview?.collectedThisMonth)} color="green" />
        <StatCard icon={ExclamationTriangleIcon} label="Total Arrears" value={formatCurrency(overview?.totalArrears)} color="red" />
        <StatCard icon={HomeIcon} label="Occupied Units" value={overview?.occupiedUnits ?? '—'} color="blue" />
        <StatCard icon={BuildingOffice2Icon} label="Vacant Units" value={overview?.vacantUnits ?? '—'} color="gray" />
        <StatCard icon={WrenchScrewdriverIcon} label="Open Tickets" value={overview?.openTickets ?? '—'} color="amber" />
      </div>

      {/* Chart + Arrears table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Rent Collection — Last 6 Months</h2>
          {monthlyTrend.length > 0
            ? <Line data={chartData} options={chartOptions} />
            : <p className="text-gray-400 text-sm">No payment data yet.</p>}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Arrears</h2>
            <Link to="/tenants?status=overdue" className="text-xs text-kodi-blue hover:underline">View all</Link>
          </div>
          {arrears.length === 0
            ? <p className="text-green-600 text-sm font-medium">All tenants paid up ✓</p>
            : <div className="space-y-3">
                {arrears.slice(0, 8).map((t) => (
                  <div key={t.tenantId} className="flex items-center justify-between text-sm">
                    <div>
                      <Link to={`/tenants/${t.tenantId}`} className="font-medium text-gray-900 hover:text-kodi-blue">{t.name}</Link>
                      <p className="text-gray-400 text-xs">Unit {t.unit} · {t.daysOverdue}d overdue</p>
                    </div>
                    <span className="font-semibold text-red-600">{formatCurrency(t.arrears)}</span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
