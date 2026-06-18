import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';

const CARETAKER_PERMISSIONS = [
  { id: 'VIEW_UNITS', label: 'View units' },
  { id: 'MANAGE_TENANTS', label: 'Manage tenants' },
  { id: 'METER_READINGS', label: 'Meter readings' },
  { id: 'LOG_PAYMENTS', label: 'Log payments' },
  { id: 'MANAGE_TICKETS', label: 'Manage tickets' },
];

function useCaretakers() {
  return useQuery({ queryKey: ['caretakers'], queryFn: () => api.get('/caretakers').then((r) => r.data) });
}

export default function Settings() {
  const qc = useQueryClient();
  const [profile, setProfile] = useState({ name: '', language: 'en', currencyPref: 'KES', monthlyAirtimeCap: 5000 });
  const [newCaretaker, setNewCaretaker] = useState({ name: '', phone: '', password: '', permissions: [] });
  const { data: caretakers = [] } = useCaretakers();

  const { data: myProfile } = useQuery({ queryKey: ['myProfile'], queryFn: () => api.get('/landlords/me').then((r) => r.data) });

  useEffect(() => {
    if (myProfile) setProfile({ name: myProfile.name, language: myProfile.language, currencyPref: myProfile.currencyPref, monthlyAirtimeCap: myProfile.monthlyAirtimeCap });
  }, [myProfile]);

  const updateProfile = useMutation({
    mutationFn: (data) => api.patch('/landlords/me', data).then((r) => r.data),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries(['myProfile']); },
    onError: () => toast.error('Update failed'),
  });

  const addCaretaker = useMutation({
    mutationFn: (data) => api.post('/landlords/caretakers', data).then((r) => r.data),
    onSuccess: () => { toast.success('Caretaker added'); qc.invalidateQueries(['caretakers']); setNewCaretaker({ name: '', phone: '', password: '', permissions: [] }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const toggleCaretaker = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/caretakers/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['caretakers']); },
  });

  const updateCaretakerPermissions = useMutation({
    mutationFn: ({ id, permissions }) => api.patch(`/caretakers/${id}`, { permissions }).then((r) => r.data),
    onSuccess: () => { toast.success('Permissions updated'); qc.invalidateQueries(['caretakers']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not update permissions'),
  });

  function togglePermission(permission) {
    setNewCaretaker((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  }

  function toggleExistingPermission(caretaker, permission) {
    const permissions = caretaker.permissions.includes(permission)
      ? caretaker.permissions.filter((item) => item !== permission)
      : [...caretaker.permissions, permission];
    updateCaretakerPermissions.mutate({ id: caretaker.id, permissions });
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-kodi-dark">Settings</h1>

      {/* Profile */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-kodi-dark">Account Details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Language</label>
            <select className="input" value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </select>
          </div>
          <div>
            <label className="label">Dashboard Currency</label>
            <select className="input" value={profile.currencyPref} onChange={(e) => setProfile({ ...profile, currencyPref: e.target.value })}>
              {['KES', 'USD', 'GBP', 'EUR'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Monthly Airtime Cap (KSh)</label>
            <input type="number" className="input" value={profile.monthlyAirtimeCap}
              onChange={(e) => setProfile({ ...profile, monthlyAirtimeCap: parseInt(e.target.value) })} />
          </div>
        </div>
        <button onClick={() => updateProfile.mutate(profile)} disabled={updateProfile.isPending} className="btn-primary">
          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Caretakers */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-kodi-dark">Caretaker Sub-Accounts</h2>

        {caretakers.map((c) => (
          <div key={c.id} className="space-y-3 py-3 border-b border-kodi-border/60 last:border-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-kodi-dark">{c.name}</p>
                <p className="text-xs text-kodi-text-muted">{c.phone} · {c.permissions.join(', ') || 'No permissions'}</p>
              </div>
              <button
                onClick={() => toggleCaretaker.mutate({ id: c.id, isActive: !c.isActive })}
                className={`badge cursor-pointer ${c.isActive ? 'badge-green' : 'badge-red'}`}
              >
                {c.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {CARETAKER_PERMISSIONS.map((permission) => (
                <button
                  key={permission.id}
                  type="button"
                  onClick={() => toggleExistingPermission(c, permission.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    c.permissions.includes(permission.id)
                      ? 'border-kodi-accent bg-kodi-accent text-white'
                      : 'border-kodi-border bg-kodi-navy text-kodi-text-muted'
                  }`}
                >
                  {permission.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="border-t border-kodi-border/60 pt-4">
          <p className="text-sm font-medium text-kodi-text-secondary mb-3">Add Caretaker</p>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Full name" value={newCaretaker.name} onChange={(e) => setNewCaretaker({ ...newCaretaker, name: e.target.value })} />
            <input className="input" placeholder="+254712..." value={newCaretaker.phone} onChange={(e) => setNewCaretaker({ ...newCaretaker, phone: e.target.value })} />
            <input type="password" className="input" placeholder="Password" value={newCaretaker.password} onChange={(e) => setNewCaretaker({ ...newCaretaker, password: e.target.value })} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CARETAKER_PERMISSIONS.map((permission) => (
              <button
                key={permission.id}
                type="button"
                onClick={() => togglePermission(permission.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  newCaretaker.permissions.includes(permission.id)
                    ? 'border-kodi-accent bg-kodi-accent text-white'
                    : 'border-kodi-border bg-kodi-navy text-kodi-text-muted'
                }`}
              >
                {permission.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => addCaretaker.mutate(newCaretaker)}
            disabled={addCaretaker.isPending || !newCaretaker.name || !newCaretaker.phone || !newCaretaker.password}
            className="btn-primary mt-3"
          >
            {addCaretaker.isPending ? 'Adding…' : 'Add Caretaker'}
          </button>
        </div>
      </div>
    </div>
  );
}
