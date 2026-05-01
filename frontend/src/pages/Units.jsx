import { Link } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { formatCurrency } from '../utils/formatters';
import { AlertTriangle, Building2, CheckCircle2, Home, Search, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';

const statusBadge = {
  OCCUPIED: 'badge-green',
  VACANT: 'badge-gray',
  MAINTENANCE: 'badge-amber',
};

export default function Units() {
  const { data: properties = [], isLoading } = useProperties();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const units = useMemo(() => properties.flatMap((property) => (
    property.units || []
  ).map((unit) => ({
    ...unit,
    propertyName: property.name,
    county: property.county,
    waterRatePerUnit: property.waterRatePerUnit,
    tenant: unit.tenants?.[0] || null,
    openTickets: unit._count?.tickets || 0,
  }))), [properties]);

  const filtered = units.filter((unit) => {
    const haystack = `${unit.unitNumber} ${unit.propertyName} ${unit.tenant?.name || ''}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!status || unit.status === status);
  });

  const occupied = units.filter((unit) => unit.status === 'OCCUPIED').length;
  const vacant = units.filter((unit) => unit.status === 'VACANT').length;
  const maintenance = units.filter((unit) => unit.status === 'MAINTENANCE').length;

  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        {[...Array(6)].map((_, index) => <div key={index} className="h-20 skeleton" />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-eyebrow">Inventory</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-kodi-dark">Units</h1>
          <p className="mt-1 text-sm text-kodi-text-muted">Control the rent-producing inventory: status, rent, tenant, arrears hints, and maintenance flags.</p>
        </div>
        <Link to="/dashboard/properties" className="btn-primary">
          <Building2 className="h-4 w-4" /> Manage properties
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="stat-card" style={{ '--stat-color': '#14213D' }}><span className="text-xs text-kodi-text-muted">Total units</span><p className="text-2xl font-black text-kodi-dark">{units.length}</p></div>
        <div className="stat-card" style={{ '--stat-color': '#10B981' }}><span className="text-xs text-kodi-text-muted">Occupied</span><p className="text-2xl font-black text-kodi-emerald">{occupied}</p></div>
        <div className="stat-card" style={{ '--stat-color': '#94A3B8' }}><span className="text-xs text-kodi-text-muted">Vacant</span><p className="text-2xl font-black text-kodi-text-secondary">{vacant}</p></div>
        <div className="stat-card" style={{ '--stat-color': '#F59E0B' }}><span className="text-xs text-kodi-text-muted">Maintenance</span><p className="text-2xl font-black text-kodi-amber">{maintenance}</p></div>
      </div>

      <div className="glass-card flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-kodi-text-muted" />
          <input className="input pl-9" placeholder="Search unit, property, or tenant" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select className="input md:w-56" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="VACANT">Vacant</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-kodi-border bg-kodi-navy">
              <tr>
                {['Unit', 'Property', 'Status', 'Rent', 'Tenant', 'Last payment', 'Maintenance', 'Action'].map((heading) => (
                  <th key={heading} className="table-th">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-kodi-border">
              {filtered.map((unit) => {
                const hasTickets = unit.openTickets > 0;
                return (
                  <tr key={unit.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-2 font-semibold text-kodi-dark">
                        <Home className="h-4 w-4 text-kodi-accent" /> {unit.unitNumber}
                      </div>
                    </td>
                    <td className="table-td text-kodi-text-muted">{unit.propertyName}<br /><span className="text-xs">{unit.county}</span></td>
                    <td className="table-td"><span className={`badge ${statusBadge[unit.status] || 'badge-gray'}`}>{unit.status}</span></td>
                    <td className="table-td font-semibold">{formatCurrency(unit.rentAmount)}</td>
                    <td className="table-td">{unit.tenant ? unit.tenant.name : <span className="text-kodi-text-muted">Vacant</span>}</td>
                    <td className="table-td text-kodi-text-muted">{unit.tenant ? 'See payments' : 'Not occupied'}</td>
                    <td className="table-td">
                      {hasTickets ? (
                        <span className="badge badge-amber"><AlertTriangle className="mr-1 h-3 w-3" /> {unit.openTickets} open</span>
                      ) : (
                        <span className="badge badge-green"><CheckCircle2 className="mr-1 h-3 w-3" /> Clear</span>
                      )}
                    </td>
                    <td className="table-td">
                      {unit.tenant ? (
                        <Link to={`/dashboard/tenants/${unit.tenant.id}`} className="text-sm font-semibold text-kodi-accent">View tenant</Link>
                      ) : (
                        <Link to="/dashboard/tenants" className="text-sm font-semibold text-kodi-accent">Assign tenant</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-kodi-text-muted">
            <Wrench className="mx-auto mb-2 h-8 w-8" />
            No units match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
