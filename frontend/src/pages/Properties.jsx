import { useState } from 'react';
import { useProperties, useAddProperty, useAddUnit } from '../hooks/useProperties';
import UnitGrid from '../components/UnitGrid';
import { formatCurrency } from '../utils/formatters';
import { PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Loading from '../components/Loading';

function AddPropertyModal({ onClose }) {
  const [form, setForm] = useState({ name: '', address: '', county: 'Nairobi', type: 'APARTMENT' });
  const addProperty = useAddProperty();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await addProperty.mutateAsync(form);
      onClose();
    } catch {
      // Error toast is handled by the mutation hook.
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-kodi-card rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4 text-kodi-dark">Add Property</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[['name', 'Property Name', 'e.g. Skyline Apartments'], ['address', 'Address', 'e.g. Westlands Road, Block B'], ['county', 'County', 'e.g. Nairobi']].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input className="input" placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
            </div>
          ))}
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['APARTMENT', 'BEDSITTER', 'MAISONETTE', 'BUNGALOW', 'COMMERCIAL'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={addProperty.isPending} className="btn-primary flex-1 justify-center">{addProperty.isPending ? 'Saving...' : 'Add Property'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddUnitModal({ propertyId, onClose }) {
  const [form, setForm] = useState({ unitNumber: '', rentAmount: '', floor: '', bedrooms: '' });
  const addUnit = useAddUnit(propertyId);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await addUnit.mutateAsync(form);
      onClose();
    } catch {
      // Error toast is handled by the mutation hook.
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-kodi-card rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4 text-kodi-dark">Add Unit</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="label">Unit Number</label><input className="input" placeholder="e.g. A4, 101, or B-02" value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} required /></div>
          <div><label className="label">Monthly Rent (KSh)</label><input type="number" className="input" placeholder="Enter base rent amount" value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Floor</label><input type="number" className="input" placeholder="e.g. 1" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
            <div><label className="label">Bedrooms</label><input type="number" className="input" placeholder="e.g. 2" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={addUnit.isPending} className="btn-primary flex-1 justify-center">{addUnit.isPending ? 'Saving...' : 'Add Unit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Properties() {
  const { data: properties, isLoading } = useProperties();
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [addingUnitFor, setAddingUnitFor] = useState(null);
  const [expanded, setExpanded] = useState(null);

  if (isLoading) return <Loading message="Syncing properties..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-kodi-dark">Properties & Units</h1>
        <button onClick={() => setShowAddProperty(true)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Property
        </button>
      </div>

      {properties?.length === 0 && (
        <div className="glass-card text-center py-16">
          <BuildingOfficeIcon className="h-12 w-12 text-kodi-text-muted mx-auto mb-4" />
          <h3 className="text-kodi-text-secondary font-medium">No properties yet</h3>
          <p className="text-kodi-text-muted text-sm mt-1">Add your first property to get started</p>
        </div>
      )}

      {properties?.map((p) => {
        const occupiedCount = p.units.filter((u) => u.status === 'OCCUPIED').length;
        const totalRent = p.units.filter((u) => u.status === 'OCCUPIED').reduce((s, u) => s + parseFloat(u.rentAmount), 0);

        return (
          <div key={p.id} className="glass-card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-kodi-dark">{p.name}</h2>
                <p className="text-sm text-kodi-text-muted">{p.address}, {p.county} - {p.type}</p>
                <div className="flex gap-4 mt-2 text-sm text-kodi-text-secondary">
                  <span>{p.units.length} units</span>
                  <span>{occupiedCount} occupied</span>
                  <span className="font-semibold text-kodi-dark">{formatCurrency(totalRent)} / month potential</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddingUnitFor(p.id)} className="btn-secondary text-xs">+ Unit</button>
                <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="btn-secondary text-xs">
                  {expanded === p.id ? 'Collapse' : 'View Units'}
                </button>
              </div>
            </div>

            {expanded === p.id && <UnitGrid units={p.units} />}

            {addingUnitFor === p.id && (
              <AddUnitModal propertyId={p.id} onClose={() => setAddingUnitFor(null)} />
            )}
          </div>
        );
      })}

      {showAddProperty && <AddPropertyModal onClose={() => setShowAddProperty(false)} />}
    </div>
  );
}
