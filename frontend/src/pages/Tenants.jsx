import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenants, useAddTenant } from '../hooks/useTenants';
import { useProperties } from '../hooks/useProperties';
import { formatCurrency, formatDate } from '../utils/formatters';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { PlusIcon, MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';
import Loading from '../components/Loading';

function AddTenantModal({ onClose }) {
  const { data: properties } = useProperties();
  const addTenant = useAddTenant();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
    unitId: '',
    leaseStart: '',
    depositAmount: '',
    password: '',
  });

  const allUnits = properties?.flatMap((property) => property.units.map((unit) => ({ ...unit, propertyName: property.name }))) || [];
  const vacantUnits = allUnits.filter((unit) => unit.status === 'VACANT');

  async function handleSubmit(event) {
    event.preventDefault();
    await addTenant.mutateAsync(form);
    onClose();
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        placeholder={placeholder}
        value={form[key]}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
        required={['name', 'phone', 'idNumber', 'leaseStart', 'depositAmount'].includes(key)}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg overflow-y-auto p-6 max-h-[90vh]">
        <h2 className="mb-4 text-lg font-semibold text-kodi-text-primary">Add New Tenant</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {field('name', 'Full Name', 'text', 'Enter tenant\'s full legal name')}
          {field('phone', 'Phone', 'tel', 'e.g. +254 7XX XXX XXX')}
          {field('email', 'Email', 'email', 'e.g. tenant@example.com')}
          {field('idNumber', 'ID Number', 'text', 'Enter National ID or Passport number')}
          <div>
            <label className="label">Unit</label>
            <select className="input" value={form.unitId} onChange={(event) => setForm({ ...form, unitId: event.target.value })} required>
              <option value="">Select unit</option>
              {vacantUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.propertyName} - Unit {unit.unitNumber} ({formatCurrency(unit.rentAmount)}/mo)</option>
              ))}
            </select>
            {vacantUnits.length === 0 && <p className="mt-1 text-xs text-kodi-amber">No vacant units. Add units in Properties first.</p>}
          </div>
          {field('leaseStart', 'Lease Start', 'date')}
          {field('depositAmount', 'Deposit Amount (KSh)', 'number', '24000')}
          <div>
            <label className="label">Initial Password <span className="font-normal text-kodi-text-muted">(optional)</span></label>
            <input
              type="password"
              className="input"
              placeholder="Leave blank for KODI + phone last 4"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addTenant.isPending} className="btn-primary flex-1">
              {addTenant.isPending ? 'Adding...' : 'Add Tenant'}
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
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow text-kodi-accent-light">Residents</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-kodi-text-primary">Tenants</h1>
          <p className="mt-1 text-sm text-kodi-text-muted">{total} active tenant{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Tenant
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-4 w-4 text-kodi-text-muted" />
        <input
          className="input pl-9"
          placeholder="Search by name or phone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? (
        <Loading message="Fetching residents..." />
      ) : tenants.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <UsersIcon className="mx-auto mb-4 h-12 w-12 text-kodi-text-muted" />
          <p className="text-kodi-text-secondary">No tenants found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-kodi-border/40 bg-kodi-navy/40">
                <tr>
                  {['Name', 'Unit', 'Phone', 'Lease Start', 'Trust Score', 'Actions'].map((heading) => (
                    <th key={heading} className="table-th">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-kodi-border/30">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="table-row">
                    <td className="table-td font-medium">{tenant.name}</td>
                    <td className="table-td text-kodi-text-muted">{tenant.unit ? `${tenant.unit.property.name} - ${tenant.unit.unitNumber}` : 'Unassigned'}</td>
                    <td className="table-td text-kodi-text-muted">{tenant.phone}</td>
                    <td className="table-td text-kodi-text-muted">{formatDate(tenant.leaseStart)}</td>
                    <td className="table-td">
                      {tenant.trustScore ? (
                        <TrustScoreBadge score={tenant.trustScore.score} tier={tenant.trustScore.tier || 'Fair'} size="sm" />
                      ) : <span className="text-xs text-kodi-text-muted">Not scored</span>}
                    </td>
                    <td className="table-td">
                      <Link to={`/dashboard/tenants/${tenant.id}`} className="text-sm font-semibold text-kodi-accent-light hover:text-kodi-text-primary">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddTenantModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
