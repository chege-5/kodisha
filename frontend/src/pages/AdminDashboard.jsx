import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { Shield, Users, Building2, CreditCard, Wrench, Activity, ChevronRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-${color}-500/10`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-xs text-kodi-text-muted">{label}</p>
          <p className="text-2xl font-bold text-kodi-text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
  });

  const { data: logsData } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => api.get('/admin/logs?limit=10').then((r) => r.data),
  });

  if (isLoading) return (
    <div className="p-8 space-y-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-24 skeleton" />)}
    </div>
  );

  const users = usersData?.users || [];
  const logs = logsData?.logs || [];

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-kodi-text-primary flex items-center gap-2">
          <Shield className="w-6 h-6 text-kodi-accent" /> Admin Dashboard
        </h1>
        <p className="text-kodi-text-muted text-sm mt-0.5">Platform-wide overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10"><Users className="w-5 h-5 text-indigo-400" /></div>
            <div>
              <p className="text-xs text-kodi-text-muted">Total Users</p>
              <p className="text-2xl font-bold text-kodi-text-primary">{stats?.users?.total || 0}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-3 text-xs text-kodi-text-muted">
            <span>{stats?.users?.landlords || 0} landlords</span>
            <span>{stats?.users?.tenants || 0} tenants</span>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10"><Building2 className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <p className="text-xs text-kodi-text-muted">Properties</p>
              <p className="text-2xl font-bold text-kodi-text-primary">{stats?.properties || 0}</p>
            </div>
          </div>
          <p className="text-xs text-kodi-text-muted mt-3">{stats?.units || 0} total units</p>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10"><CreditCard className="w-5 h-5 text-cyan-400" /></div>
            <div>
              <p className="text-xs text-kodi-text-muted">Total Revenue</p>
              <p className="text-2xl font-bold text-kodi-text-primary">KSh {(Number(stats?.totalRevenue || 0) / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10"><Wrench className="w-5 h-5 text-amber-400" /></div>
            <div>
              <p className="text-xs text-kodi-text-muted">Open Tickets</p>
              <p className="text-2xl font-bold text-kodi-amber">{stats?.openTickets || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users */}
        <div className="glass-card">
          <h2 className="text-base font-semibold text-kodi-text-primary mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-kodi-accent" /> Users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-kodi-border/30">
                  <th className="table-th">Name</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Contact</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 10).map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-kodi-accent/10 flex items-center justify-center text-kodi-accent text-xs font-bold">
                          {u.name?.[0]}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : u.role === 'LANDLORD' ? 'badge-blue' : u.role === 'TENANT' ? 'badge-green' : 'badge-amber'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="table-td text-kodi-text-muted text-xs">{u.email || u.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Logs */}
        <div className="glass-card">
          <h2 className="text-base font-semibold text-kodi-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-kodi-emerald" /> System Logs
          </h2>
          {logs.length === 0 ? (
            <p className="text-kodi-text-muted text-sm text-center py-8">No logs yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-kodi-border/20 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-kodi-emerald mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-kodi-text-primary">{log.action}</p>
                    <p className="text-xs text-kodi-text-muted">{log.resource} · {new Date(log.createdAt).toLocaleString('en-KE')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
