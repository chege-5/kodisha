import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  Database,
  Eye,
  Gauge,
  LogIn,
  LogOut,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'activity', label: 'Access', icon: LogIn },
  { id: 'revenue', label: 'Cash flow', icon: CircleDollarSign },
  { id: 'properties', label: 'Properties', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'logs', label: 'Audit trail', icon: Bell },
];

function StatCard({ icon: Icon, title, value, detail, accent = 'from-sky-500/20 to-cyan-500/10', textClass = 'text-codi-text-primary' }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#101521]/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${accent} p-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-sm text-kodi-text-muted">{title}</p>
      <p className={`mt-1 text-3xl font-black tracking-tight ${textClass}`}>{value}</p>
      {detail ? <p className="mt-2 text-xs text-kodi-text-muted">{detail}</p> : null}
    </div>
  );
}

function MiniBarChart({ labels, values, color = 'bg-cyan-400' }) {
  const maxValue = Math.max(...values, 1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {labels.map((label, index) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-kodi-text-muted">{label}</p>
            <div className="mt-3 h-24 rounded-2xl bg-black/20 px-2 pb-2 pt-4">
              <div className="flex h-full items-end">
                <div
                  className={`w-full rounded-t-xl ${color}`}
                  style={{ height: `${Math.max(8, Math.round((values[index] / maxValue) * 100))}%` }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-kodi-text-primary">{values[index]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-kodi-text-muted">
          <Icon className="h-4 w-4 text-kodi-accent" />
          <span className="text-xs uppercase tracking-[0.24em]">Super admin control room</span>
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-kodi-text-muted">{subtitle}</p>
      </div>
      <div className="hidden rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right sm:block">
        <p className="text-[11px] uppercase tracking-[0.2em] text-kodi-text-muted">Connected identity</p>
        <p className="mt-1 text-sm font-semibold text-white">admin@kodisha.org</p>
      </div>
    </div>
  );
}

function formatMoney(amount) {
  return `KSh ${Number(amount || 0).toLocaleString('en-KE')}`;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((response) => response.data),
    refetchInterval: 15000,
  });

  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics?days=14').then((response) => response.data),
    refetchInterval: 15000,
  });

  const propertiesQuery = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => api.get('/admin/properties?limit=12').then((response) => response.data),
    refetchInterval: 30000,
  });

  const transactionsQuery = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => api.get('/admin/transactions?limit=12').then((response) => response.data),
    refetchInterval: 15000,
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users?limit=20').then((response) => response.data),
    refetchInterval: 30000,
  });

  const logsQuery = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => api.get('/admin/logs?limit=25').then((response) => response.data),
    refetchInterval: 10000,
  });

  const stats = statsQuery.data || {};
  const analytics = analyticsQuery.data || {};
  const properties = propertiesQuery.data?.properties || [];
  const transactions = transactionsQuery.data?.transactions || [];
  const users = usersQuery.data?.users || [];
  const logs = logsQuery.data?.logs || [];

  const activeUsers = useMemo(() => users.filter((user) => user.isActive !== false), [users]);
  const topProperty = properties[0];

  if (statsQuery.isLoading && analyticsQuery.isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="space-y-4">
          <div className="h-28 rounded-[32px] bg-white/6" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => <div key={index} className="h-40 rounded-[32px] bg-white/6" />)}
          </div>
        </div>
      </div>
    );
  }

  const accessSeries = analytics.series?.logins || [];
  const logoutSeries = analytics.series?.logouts || [];
  const revenueSeries = analytics.series?.revenue || [];
  const userEventSeries = analytics.series?.userEvents || [];

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_32%),linear-gradient(180deg,_#0a0f1c_0%,_#060914_100%)] px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] gap-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[290px] flex-col rounded-[32px] border border-white/10 bg-[#0b1120]/85 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl xl:flex">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 p-3 shadow-lg shadow-cyan-500/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-kodi-text-muted">Kodisha</p>
                <h2 className="text-lg font-black text-white">Super Admin</h2>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-black/20 p-3">
                <p className="text-kodi-text-muted">Live users</p>
                <p className="mt-1 text-xl font-black text-white">{stats?.users?.total || activeUsers.length || 0}</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-3">
                <p className="text-kodi-text-muted">Revenue</p>
                <p className="mt-1 text-xl font-black text-white">{formatMoney(stats?.cashTransacted || stats?.totalRevenue || 0)}</p>
              </div>
            </div>
          </div>

          <nav className="mt-4 space-y-2 overflow-y-auto pr-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${active ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-400/15 to-sky-600/10 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <CalendarClock className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-xs text-kodi-text-muted">Realtime sync</p>
                <p className="text-sm font-semibold text-white">15s dashboard polling</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <section className="rounded-[36px] border border-white/10 bg-white/6 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8">
            <SectionTitle
              title="Control every part of the system from one live console."
              subtitle="This super-admin panel mirrors platform activity in near real time: access, revenue, properties, users, and audit history."
            />

            <div className="mt-6 flex flex-wrap gap-2 xl:hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${active ? 'bg-cyan-400 text-slate-950' : 'bg-white/8 text-white hover:bg-white/12'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>

          {activeTab === 'overview' && (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Users} title="Total users" value={stats?.users?.total || 0} detail={`${stats?.users?.landlords || 0} landlords, ${stats?.users?.tenants || 0} tenants`} />
              <StatCard icon={Building2} title="Properties" value={stats?.properties || 0} detail={`${stats?.units || 0} units / ${stats?.occupiedUnits || 0} occupied`} accent="from-emerald-500/20 to-green-500/10" />
              <StatCard icon={Wallet} title="Cash transacted" value={formatMoney(stats?.cashTransacted || stats?.totalRevenue || 0)} detail={`${stats?.paymentsCount || 0} payments captured`} accent="from-amber-500/20 to-orange-500/10" />
              <StatCard icon={Shield} title="Open issues" value={stats?.openTickets || 0} detail={`${stats?.recentLoginCount || 0} logins in the last day`} accent="from-rose-500/20 to-pink-500/10" />
            </section>
          )}

          {activeTab === 'activity' && (
            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-[32px] border border-white/10 bg-[#0c1324]/85 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-kodi-text-muted">Access timeline</p>
                    <h3 className="mt-1 text-2xl font-black text-white">Logins and logouts</h3>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-kodi-text-muted">
                    {analytics.totals?.accessEvents || 0} total access events
                  </div>
                </div>
                <div className="mt-6">
                  <MiniBarChart labels={analytics.labels?.slice(-4) || []} values={accessSeries.slice(-4)} color="bg-cyan-400" />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-kodi-text-muted">
                        <LogIn className="h-4 w-4 text-cyan-300" />
                        <span className="text-sm">Logins</span>
                      </div>
                      <p className="mt-2 text-3xl font-black text-white">{accessSeries.reduce((sum, value) => sum + value, 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-kodi-text-muted">
                        <LogOut className="h-4 w-4 text-amber-300" />
                        <span className="text-sm">Logouts</span>
                      </div>
                      <p className="mt-2 text-3xl font-black text-white">{logoutSeries.reduce((sum, value) => sum + value, 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-kodi-text-muted">
                    <Clock3 className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm uppercase tracking-[0.2em]">Recent activity</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="rounded-2xl border border-white/10 bg-black/15 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{log.action}</p>
                          <span className="text-[11px] text-kodi-text-muted">{new Date(log.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="mt-1 text-xs text-kodi-text-muted">{log.resource || 'system'} · {log.details || 'platform event recorded'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'revenue' && (
            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
              <div className="rounded-[32px] border border-white/10 bg-[#0c1324]/85 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-kodi-text-muted">Revenue curve</p>
                    <h3 className="mt-1 text-2xl font-black text-white">Money moving through the platform</h3>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-kodi-text-muted">
                    {analytics.totals?.revenue ? formatMoney(analytics.totals.revenue) : 'KSh 0'}
                  </div>
                </div>
                <div className="mt-6">
                  <MiniBarChart labels={analytics.labels?.slice(-4) || []} values={revenueSeries.slice(-4)} color="bg-emerald-400" />
                </div>
              </div>

              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{transaction.tenant?.name || 'Tenant payment'}</p>
                        <p className="mt-1 text-xs text-kodi-text-muted">
                          {transaction.unit?.property?.name || 'Property'} · Unit {transaction.unit?.unitNumber || 'N/A'}
                        </p>
                      </div>
                      <p className="text-sm font-black text-emerald-300">{formatMoney(transaction.amount)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-kodi-text-muted">
                      <span>{transaction.channel || 'Unknown channel'}</span>
                      <span>{new Date(transaction.paymentDate).toLocaleDateString('en-KE')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'properties' && (
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] border border-white/10 bg-[#0c1324]/85 p-5">
                <div className="flex items-center gap-2 text-kodi-text-muted">
                  <Building2 className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm uppercase tracking-[0.2em]">Portfolio overview</span>
                </div>
                <div className="mt-5 space-y-3">
                  {properties.map((property) => (
                    <div key={property.id} className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-base font-semibold text-white">{property.name}</h4>
                          <p className="mt-1 text-xs text-kodi-text-muted">{property.address || property.county || 'No address'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{property.unitCount} units</p>
                          <p className="text-xs text-kodi-text-muted">{property.occupiedUnits} occupied</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-kodi-text-muted">
                        <span className="rounded-full bg-black/20 px-3 py-1">{property.type || 'Unknown type'}</span>
                        <span className="rounded-full bg-black/20 px-3 py-1">{property.county || 'Unknown county'}</span>
                        <span className="rounded-full bg-black/20 px-3 py-1">{formatMoney(property.cashTransacted)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-kodi-text-muted">
                  <BarChart3 className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm uppercase tracking-[0.2em]">Property leader</span>
                </div>
                {topProperty ? (
                  <div className="mt-5 rounded-[28px] border border-white/10 bg-black/15 p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-kodi-text-muted">Highest visibility</p>
                    <h4 className="mt-2 text-2xl font-black text-white">{topProperty.name}</h4>
                    <p className="mt-2 text-sm text-kodi-text-muted">{topProperty.address || topProperty.county || 'No address'}</p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-xs text-kodi-text-muted">Occupied</p>
                        <p className="mt-1 text-2xl font-black text-white">{topProperty.occupiedUnits}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-xs text-kodi-text-muted">Cash</p>
                        <p className="mt-1 text-lg font-black text-white">{formatMoney(topProperty.cashTransacted)}</p>
                      </div>
                    </div>
                    <div className="mt-5 rounded-2xl bg-cyan-400/10 p-4 text-sm text-cyan-100">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        System visibility is limited to the properties the platform currently knows about.
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-kodi-text-muted">No properties have been created yet.</p>
                )}
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section className="rounded-[32px] border border-white/10 bg-[#0c1324]/85 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-kodi-text-muted">User registry</p>
                  <h3 className="mt-1 text-2xl font-black text-white">Platform accounts</h3>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-kodi-text-muted">{users.length} records</div>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.2em] text-kodi-text-muted">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Role</th>
                      <th className="pb-2 font-medium">Contact</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 12).map((user) => (
                      <tr key={user.id} className="rounded-2xl bg-white/5">
                        <td className="rounded-l-2xl px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-black text-cyan-200">
                              {(user.name || user.email || 'U').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{user.name || 'Unnamed user'}</p>
                              <p className="text-xs text-kodi-text-muted">ID {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className="rounded-full bg-black/20 px-3 py-1 text-xs text-white">{user.role}</span></td>
                        <td className="px-4 py-4 text-sm text-kodi-text-muted">{user.email || user.phone || 'No contact'}</td>
                        <td className="rounded-r-2xl px-4 py-4 text-sm text-emerald-300">{user.isActive === false ? 'Disabled' : 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'logs' && (
            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[32px] border border-white/10 bg-[#0c1324]/85 p-5">
                <div className="flex items-center gap-2 text-kodi-text-muted">
                  <Bell className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm uppercase tracking-[0.2em]">Audit trail</span>
                </div>
                <div className="mt-5 space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{log.action}</p>
                          <p className="mt-1 text-xs text-kodi-text-muted">{log.resource || 'system'} · {log.details || 'No extra details'}</p>
                        </div>
                        <span className="text-xs text-kodi-text-muted">{new Date(log.createdAt).toLocaleString('en-KE')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-kodi-text-muted">
                    <Database className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm uppercase tracking-[0.2em]">System note</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-kodi-text-muted">
                    Super admin events are now written to the audit trail. Login, logout, password change, bootstrap, and landlord creation events can be surfaced here as the platform grows.
                  </p>
                </div>
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-kodi-text-muted">
                    <ArrowUpRight className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm uppercase tracking-[0.2em]">Data refresh</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-kodi-text-muted">
                    <p>Access and revenue panels refresh every 15 seconds.</p>
                    <p>Properties refresh every 30 seconds.</p>
                    <p>Audit trail refreshes every 10 seconds.</p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
