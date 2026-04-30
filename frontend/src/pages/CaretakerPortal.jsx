import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Droplets, Wrench, Users, Building2, Plus, Send, CheckCircle } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'meters', label: 'Meters', icon: Droplets },
  { id: 'tickets', label: 'Tickets', icon: Wrench },
];

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
    mutationFn: (data) => api.post('/meter-readings', data).then((r) => r.data),
    onSuccess: (result) => {
      toast.success(`Reading saved! Water bill: KSh ${Number(result.bill?.amount || 0).toLocaleString()}`);
      setMeterForm({ unitId: '', currentReading: '' });
      qc.invalidateQueries(['meter-readings']);
    },
    onError: () => toast.error('Failed to save reading'),
  });

  const units = data?.units || [];
  const openTickets = units.reduce((s, u) => s + (u.tickets?.length || 0), 0);
  const occupiedCount = units.filter((u) => u.status === 'OCCUPIED').length;

  if (isLoading) return (
    <div className="p-8 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton" />)}
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-kodi-text-primary">Caretaker Portal</h1>
        <p className="text-kodi-text-muted text-sm mt-0.5">{units.length} units · {openTickets} open tickets · {occupiedCount} occupied</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card" style={{ '--stat-color': '#6366f1' }}>
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-kodi-card rounded-2xl border border-kodi-border/50">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              tab === id ? 'bg-kodi-accent text-white shadow-lg shadow-kodi-accent/30' : 'text-kodi-text-muted hover:text-kodi-text-primary'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-3">
          {units.map((unit) => {
            const paid = (unit.payments || []).reduce((s, p) => s + parseFloat(p.amount), 0);
            const rentDue = parseFloat(unit.rentAmount);
            const hasArrears = paid < rentDue && unit.status === 'OCCUPIED';
            return (
              <div key={unit.id} className={`glass-card flex items-center justify-between border-l-4 ${hasArrears ? 'border-l-kodi-rose' : unit.status === 'VACANT' ? 'border-l-kodi-text-muted/30' : 'border-l-kodi-emerald'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-kodi-text-primary">Unit {unit.unitNumber}</span>
                    <span className={`badge ${unit.status === 'OCCUPIED' ? 'badge-green' : unit.status === 'VACANT' ? 'badge-gray' : 'badge-amber'}`}>
                      {unit.status}
                    </span>
                    {(unit.tickets?.length || 0) > 0 && <span className="badge badge-red">{unit.tickets.length} ticket(s)</span>}
                  </div>
                  {unit.tenants?.[0] && <p className="text-sm text-kodi-text-muted mt-0.5">{unit.tenants[0].name} · {unit.tenants[0].phone}</p>}
                  <p className="text-xs text-kodi-text-muted">{unit.property?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-kodi-text-primary">{formatCurrency(rentDue)}/mo</p>
                  {unit.status === 'OCCUPIED' && (
                    <p className={`text-xs font-medium ${hasArrears ? 'text-kodi-rose' : 'text-kodi-emerald'}`}>
                      {hasArrears ? `Owes ${formatCurrency(rentDue - paid)}` : '✓ Paid'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meter Readings */}
      {tab === 'meters' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card space-y-4">
            <h2 className="font-semibold text-kodi-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-kodi-cyan" /> Record Meter Reading
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Unit</label>
                <select className="input" value={meterForm.unitId}
                  onChange={(e) => setMeterForm({ ...meterForm, unitId: e.target.value })}>
                  <option value="">Select unit</option>
                  {units.filter((u) => u.status === 'OCCUPIED').map((u) => (
                    <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Current Reading</label>
                <input type="number" className="input" placeholder="e.g. 450"
                  value={meterForm.currentReading}
                  onChange={(e) => setMeterForm({ ...meterForm, currentReading: e.target.value })} />
              </div>
            </div>
            <button onClick={() => submitReading.mutate(meterForm)}
              disabled={submitReading.isPending || !meterForm.unitId || !meterForm.currentReading}
              className="btn-primary w-full">
              <Send className="w-4 h-4" /> {submitReading.isPending ? 'Saving…' : 'Submit Reading & Generate Bill'}
            </button>
          </div>

          {/* Reading History */}
          {(readings?.readings || []).length > 0 && (
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-kodi-text-primary mb-3">Recent Readings</h3>
              <div className="space-y-2">
                {(readings.readings || []).slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-kodi-border/20 last:border-0">
                    <div>
                      <p className="text-sm text-kodi-text-primary">Unit {r.unit?.unitNumber}</p>
                      <p className="text-xs text-kodi-text-muted">{r.periodMonth}/{r.periodYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-kodi-cyan">{Number(r.consumption).toFixed(1)} units</p>
                      <p className="text-xs text-kodi-text-muted">{Number(r.previousReading)} → {Number(r.currentReading)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tickets */}
      {tab === 'tickets' && (
        <div className="space-y-3 animate-fade-in">
          {units.flatMap((u) => (u.tickets || []).map((t) => ({ ...t, unitNumber: u.unitNumber }))).length === 0 ? (
            <div className="glass-card text-center py-8">
              <CheckCircle className="w-8 h-8 text-kodi-emerald mx-auto mb-2" />
              <p className="text-kodi-text-secondary">No open tickets</p>
            </div>
          ) : units.flatMap((u) => (u.tickets || []).map((t) => ({ ...t, unitNumber: u.unitNumber }))).map((t) => (
            <div key={t.id} className="glass-card py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-kodi-text-primary">Unit {t.unitNumber} — {t.category}</span>
                <span className={`badge ${t.status === 'OPEN' ? 'badge-amber' : t.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-green'}`}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-kodi-text-muted mt-1">{t.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
