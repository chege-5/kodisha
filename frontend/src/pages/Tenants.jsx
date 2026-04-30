import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenants, useAddTenant } from '../hooks/useTenants';
import { useProperties } from '../hooks/useProperties';
import { formatCurrency, formatDate } from '../utils/formatters';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { PlusIcon, MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';

function AddTenantModal({ onClose }) {
  const { data: properties } = useProperties();
  const addTenant = useAddTenant();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', idNumber: '', unitId: '',
    leaseStart: '', depositAmount: '', password: '',
  });

  const allUnits = properties?.flatMap((p) => p.units.map((u) => ({ ...u, propertyName: p.name }))) || [];
  const vacantUnits = allUnits.filter((u) => u.status === 'VACANT');

  async function handleSubmit(e) {
    e.preventDefault();
    await addTenant.mutateAsync(form);
    onClose();
  }

  const f = (key, label, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="label">{label}</label>
      <input type={type} className="input" placeholder={placeholder} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={['name','phone','idNumber','leaseStart','depositAmount'].includes(key)} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Add New Tenant</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {f('name', 'Full Name', 'text', 'Amina Hassan')}
          {f('phone', 'Phone', 'tel', '+254712000010')}
          {f('email', 'Email (optional)', 'email', 'amina@email.com')}
          {f('idNumber', 'ID Number', 'text', '12345678')}
          <div>
            <label className="label">Unit</label>
            <select className="input" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} required>
              <option value="">Select unit…</option>
              {vacantUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.propertyName} — Unit {u.unitNumber} ({formatCurrency(u.rentAmount)}/mo)</option>
              ))}
            </select>
            {vacantUnits.length === 0 && <p className="text-xs text-amber-600 mt-1">No vacant units. Add units in Properties first.</p>}
          </div>
          {f('leaseStart', 'Lease Start', 'date')}
          {f('depositAmount', 'Deposit Amount (KSh)', 'number', '24000')}
          <div>
            <label className="label">Initial Password <span className="text-gray-400">(optional — defaults to KODI + last 4 of phone)</span></label>
            <input type="password" className="input" placeholder="Leave blank for default" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={addTenant.isPending} className="btn-primary flex-1 justify-center">
              {addTenant.isPending ? 'Adding…' : 'Add Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tenants() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading } = useTenants({ search: search || undefined });
  const { tenants = [], total = 0 } = data || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 text-sm">{total} total</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Tenant
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
      ) : tenants.length === 0 ? (
        <div className="card text-center py-16">
          <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tenants found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Unit', 'Phone', 'Lease Start', 'Trust Score', 'Actions'].map((h) => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{t.name}</td>
                  <td className="table-td text-gray-500">{t.unit ? `${t.unit.property.name} — ${t.unit.unitNumber}` : '—'}</td>
                  <td className="table-td text-gray-500">{t.phone}</td>
                  <td className="table-td text-gray-500">{formatDate(t.leaseStart)}</td>
                  <td className="table-td">
                    {t.trustScore ? (
                      <TrustScoreBadge score={t.trustScore.score} tier={t.trustScore.tier || 'Fair'} size="sm" />
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="table-td">
                    <Link to={`/tenants/${t.id}`} className="text-kodi-blue text-sm hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddTenantModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
