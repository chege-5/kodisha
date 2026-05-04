import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Building2, CheckCircle, Droplets, Plus, Send, UserPlus, Users, Wrench } from 'lucide-react';
import { useAddTenant } from '../hooks/useTenants';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'meters', label: 'Meters', icon: Droplets },
  { id: 'tickets', label: 'Tickets', icon: Wrench },
];

function AddTenantPanel({ units }) {
  const addTenant = useAddTenant();
  const vacantUnits = units.filter((unit) => unit.status === 'VACANT');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
    unitId: '',
    leaseStart: new Date().toISOString().slice(0, 10),
    depositAmount: '',
    password: '',
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await addTenant.mutateAsync(form);
    setForm((current) => ({
      ...current,
      name: '',
      phone: '',
      email: '',
      idNumber: '',
      unitId: '',
      depositAmount: '',
      password: '',
    }));
  }

  return (
    <div className="glass-card space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-kodi-text-primary">
          <UserPlus className="h-4 w-4 text-kodi-accent-light" /> Upload Tenant
        </h2>
        <p className="mt-1 text-sm text-kodi-text-muted">Add a tenant to any vacant unit assigned to your landlord account.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +254 7XX XXX XXX" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">ID Number</label>
          <input className="input" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} required />
        </div>
        <div>
          <label className="label">Unit</label>
          <select className="input" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} required>
            <option value="">Select vacant unit</option>
            {vacantUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.property?.name} - Unit {unit.unitNumber} ({formatCurrency(unit.rentAmount)})
              </option>
            ))}
          </select>
          {vacantUnits.length === 0 && <p className="mt-1 text-xs text-kodi-amber">No vacant units are available right now.</p>}
        </div>
        <div>
          <label className="label">Lease Start</label>
          <input className="input" type="date" value={form.leaseStart} onChange={(e) => setForm({ ...form, leaseStart: e.target.value })} required />
        </div>
        <div>
          <label className="label">Deposit Amount</label>
          <input className="input" type="number" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} required />
        </div>
        <div>
          <label className="label">Initial Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Optional" />
        </div>
        <div className="md:col-span-2">
          <button className="btn-primary w-full" disabled={addTenant.isPending || vacantUnits.length === 0}>
            <UserPlus className="h-4 w-4" /> {addTenant.isPending ? 'Adding...' : 'Add Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CaretakerPortal() {
  const [tab, setTab] = useState('overview');
  const [meterForm, setMeterForm] = useState({ unitId: '', currentReading: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['caretaker-portal'],
    queryFn: () => api.get('/caretakers/portal').then((r) => r.data),
  });

  const { data: readings } = useQuery({
    queryKey: ['meter-readings'],
    queryFn: () => api.get('/meter-readings').then((r) => r.data),
  });

  const submitReading = useMutation({
    mutationFn: (payload) => api.post('/meter-readings', payload).then((r) => r.data),
    onSuccess: (result) => {
      toast.success(`Reading saved. Water bill: KSh ${Number(result.bill?.amount || 0).toLocaleString()}`);
      setMeterForm({ unitId: '', currentReading: '' });
      qc.invalidateQueries(['meter-readings']);
      qc.invalidateQueries(['caretaker-portal']);
    },
    onError: () => toast.error('We could not save that reading. Please check the details and try again.'),
  });

  const units = data?.units || [];
  const openTickets = units.reduce((sum, unit) => sum + (unit.tickets?.length || 0), 0);
  const occupiedCount = units.filter((unit) => unit.status === 'OCCUPIED').length;
  const tenants = units.flatMap((unit) => (unit.tenants || []).map((tenant) => ({ ...tenant, unit })));

  if (isLoading) return (
    <div className="space-y-4 p-8">
      {[...Array(4)].map((_, index) => <div key={index} className="skeleton h-20" />)}
    </div>
  );

  return (
    <div className="page-shell mx-auto max-w-6xl space-y-6 p-4 lg:p-8 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-eyebrow text-kodi-accent-light">Field operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-kodi-text-primary">Caretaker Portal</h1>
          <p className="mt-2 text-sm text-kodi-text-muted">
            {units.length} units, {openTickets} open tickets, {occupiedCount} occupied
          </p>
        </div>
      </div>


      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card" style={{ '--stat-color': '#06b6d4' }}>
          <span className="text-xs text-kodi-text-muted">Total Units</span>
          <p className="text-2xl font-bold text-kodi-text-primary">{units.length}</p>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#f59e0b' }}>
          <span className="text-xs text-kodi-text-muted">Open Tickets</span>
          <p className="text-2xl font-bold text-kodi-amber">{openTickets}</p>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#10b981' }}>
          <span className="text-xs text-kodi-text-muted">Occupied</span>
          <p className="text-2xl font-bold text-kodi-emerald">{occupiedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-kodi-border/50 bg-kodi-card/80 p-1 md:grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              tab === id ? 'bg-kodi-accent text-white shadow-lg shadow-kodi-accent/30' : 'text-kodi-text-muted hover:text-kodi-text-primary'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-3">
          {units.map((unit) => {
            const paid = (unit.payments || []).reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
            const rentDue = parseFloat(unit.rentAmount);
            const hasArrears = paid < rentDue && unit.status === 'OCCUPIED';
            return (
              <div key={unit.id} className={`glass-card flex items-center justify-between gap-4 border-l-4 p-4 ${hasArrears ? 'border-l-kodi-rose' : unit.status === 'VACANT' ? 'border-l-kodi-text-muted/30' : 'border-l-kodi-emerald'}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-kodi-text-primary">Unit {unit.unitNumber}</span>
                    <span className={`badge ${unit.status === 'OCCUPIED' ? 'badge-green' : unit.status === 'VACANT' ? 'badge-gray' : 'badge-amber'}`}>{unit.status}</span>
                    {(unit.tickets?.length || 0) > 0 && <span className="badge badge-red">{unit.tickets.length} ticket(s)</span>}
                  </div>
                  {unit.tenants?.[0] && <p className="mt-1 text-sm text-kodi-text-muted">{unit.tenants[0].name} - {unit.tenants[0].phone}</p>}
                  <p className="text-xs text-kodi-text-muted">{unit.property?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-kodi-text-primary">{formatCurrency(rentDue)}/mo</p>
                  {unit.status === 'OCCUPIED' && (
                    <p className={`text-xs font-medium ${hasArrears ? 'text-kodi-rose' : 'text-kodi-emerald'}`}>
                      {hasArrears ? `Owes ${formatCurrency(rentDue - paid)}` : 'Paid'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'tenants' && (
        <div className="space-y-4">
          <AddTenantPanel units={units} />
          <div className="glass-card p-0">
            {tenants.length === 0 ? (
              <div className="py-10 text-center text-sm text-kodi-text-muted">No active tenants yet.</div>
            ) : (
              <div className="divide-y divide-kodi-border/30">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium text-kodi-text-primary">{tenant.name}</p>
                      <p className="text-sm text-kodi-text-muted">Unit {tenant.unit.unitNumber} - {tenant.phone}</p>
                    </div>
                    <span className="badge badge-green">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'meters' && (
        <div className="space-y-4">
          <div className="glass-card space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-kodi-text-primary">
              <Plus className="h-4 w-4 text-kodi-cyan" /> Record Meter Reading
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Unit</label>
                <select className="input" value={meterForm.unitId} onChange={(e) => setMeterForm({ ...meterForm, unitId: e.target.value })}>
                  <option value="">Select unit</option>
                  {units.filter((unit) => unit.status === 'OCCUPIED').map((unit) => (
                    <option key={unit.id} value={unit.id}>Unit {unit.unitNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Current Reading</label>
                <input className="input" type="number" placeholder="e.g. 450" value={meterForm.currentReading} onChange={(e) => setMeterForm({ ...meterForm, currentReading: e.target.value })} />
              </div>
            </div>
            <button onClick={() => submitReading.mutate(meterForm)} disabled={submitReading.isPending || !meterForm.unitId || !meterForm.currentReading} className="btn-primary w-full">
              <Send className="h-4 w-4" /> {submitReading.isPending ? 'Saving...' : 'Submit Reading and Generate Bill'}
            </button>
          </div>

          {(readings?.readings || []).length > 0 && (
            <div className="glass-card">
              <h3 className="mb-3 text-sm font-semibold text-kodi-text-primary">Recent Readings</h3>
              <div className="space-y-2">
                {(readings.readings || []).slice(0, 10).map((reading) => (
                  <div key={reading.id} className="flex items-center justify-between border-b border-kodi-border/20 py-2 last:border-0">
                    <div>
                      <p className="text-sm text-kodi-text-primary">Unit {reading.unit?.unitNumber}</p>
                      <p className="text-xs text-kodi-text-muted">{reading.periodMonth}/{reading.periodYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-kodi-cyan">{Number(reading.consumption).toFixed(1)} units</p>
                      <p className="text-xs text-kodi-text-muted">{Number(reading.previousReading)} to {Number(reading.currentReading)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'tickets' && (
        <div className="space-y-3">
          {units.flatMap((unit) => (unit.tickets || []).map((ticket) => ({ ...ticket, unitNumber: unit.unitNumber }))).length === 0 ? (
            <div className="glass-card py-10 text-center">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-kodi-emerald" />
              <p className="text-kodi-text-secondary">No open tickets</p>
            </div>
          ) : units.flatMap((unit) => (unit.tickets || []).map((ticket) => ({ ...ticket, unitNumber: unit.unitNumber }))).map((ticket) => (
            <div key={ticket.id} className="glass-card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-kodi-text-primary">Unit {ticket.unitNumber} - {ticket.category}</span>
                <span className={`badge ${ticket.status === 'OPEN' ? 'badge-amber' : ticket.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-green'}`}>{ticket.status}</span>
              </div>
              <p className="mt-1 text-xs text-kodi-text-muted">{ticket.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
