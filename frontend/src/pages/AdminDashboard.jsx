import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';
import { Shield, Users, Building2, CreditCard, Wrench, Activity, UserPlus, KeyRound, Copy } from 'lucide-react';

function makeInitialPassword() {
  const stamp = Math.random().toString(36).slice(2, 8);
  return `Kodisha-${stamp}-2026`;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [suggestedPassword, setSuggestedPassword] = useState(makeInitialPassword);
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    plan: 'STARTER',
  });

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

  const createOwner = useMutation({
    mutationFn: (payload) => api.post('/admin/landlords', payload).then((r) => r.data),
    onSuccess: ({ landlord }) => {
      toast.success(`${landlord.name} can now sign in as a landlord.`);
      setOwnerForm({ name: '', phone: '', email: '', password: '', plan: 'STARTER' });
      setSuggestedPassword(makeInitialPassword());
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    },
    onError: (err) => {
      const message = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Could not create landlord.';
      toast.error(message);
    },
  });

  function updateOwnerField(key, value) {
    setOwnerForm((current) => ({ ...current, [key]: value }));
  }

  function submitOwner(event) {
    event.preventDefault();
    createOwner.mutate({
      ...ownerForm,
      password: ownerForm.password || suggestedPassword,
    });
  }

  function copyPassword() {
    const value = ownerForm.password || suggestedPassword;
    navigator.clipboard?.writeText(value);
    toast.success('Initial password copied.');
  }

  if (isLoading) return (
    <div className="p-8 space-y-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-24 skeleton" />)}
    </div>
  );

  const users = usersData?.users || [];
  const logs = logsData?.logs || [];

  return (
    <div className="page-shell p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="section-eyebrow">Admin</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-kodi-dark flex items-center gap-2">
          <Shield className="w-6 h-6 text-kodi-accent" /> Super Admin Dashboard
        </h1>
        <p className="text-kodi-text-muted text-sm mt-1">Create home owners, then they add properties, units, caretakers, and tenants.</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        {/* Create Owner */}
        <div className="glass-card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-kodi-text-primary flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-kodi-accent" /> Add Home Owner
              </h2>
              <p className="mt-1 text-sm text-kodi-text-muted">Create the landlord account that starts a new rental workspace.</p>
            </div>
            <span className="badge badge-purple">Super admin</span>
          </div>

          <form onSubmit={submitOwner} className="space-y-4">
            <div>
              <label className="label">Owner name</label>
              <input
                className="input"
                value={ownerForm.name}
                onChange={(event) => updateOwnerField('name', event.target.value)}
                placeholder="e.g. Mary Wambui"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={ownerForm.phone}
                  onChange={(event) => updateOwnerField('phone', event.target.value)}
                  placeholder="+254712345678"
                  required
                />
              </div>
              <div>
                <label className="label">Plan</label>
                <select
                  className="input"
                  value={ownerForm.plan}
                  onChange={(event) => updateOwnerField('plan', event.target.value)}
                >
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={ownerForm.email}
                onChange={(event) => updateOwnerField('email', event.target.value)}
                placeholder="owner@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Initial password</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kodi-text-muted" />
                  <input
                    className="input pl-9"
                    value={ownerForm.password}
                    onChange={(event) => updateOwnerField('password', event.target.value)}
                    placeholder={suggestedPassword}
                  />
                </div>
                <button type="button" onClick={copyPassword} className="btn-secondary px-3" title="Copy password">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button type="submit" disabled={createOwner.isPending} className="btn-primary w-full justify-center">
              {createOwner.isPending ? 'Creating owner...' : 'Create Home Owner'}
            </button>
          </form>
        </div>

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
