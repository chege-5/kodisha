import { useState } from 'react';
import { Link } from 'react-router-dom';
import { unitStatusColor } from '../utils/formatters';
import { formatCurrency } from '../utils/formatters';

const STATUS_LABEL = { OCCUPIED: 'Occupied', VACANT: 'Vacant', MAINTENANCE: 'Maintenance' };

export default function UnitGrid({ units = [] }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {units.map((unit) => (
          <button
            key={unit.id}
            onClick={() => setSelected(selected?.id === unit.id ? null : unit)}
            className={`relative border-2 rounded-xl p-3 text-center transition-all hover:scale-105 cursor-pointer ${unitStatusColor(unit.status)} ${selected?.id === unit.id ? 'ring-2 ring-kodi-navy' : ''}`}
          >
            <p className="text-sm font-bold">{unit.unitNumber}</p>
            <p className="text-xs mt-0.5 opacity-70">{STATUS_LABEL[unit.status]}</p>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-kodi-text-muted">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />Paid/Occupied</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />Maintenance</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-kodi-border/40 border border-kodi-border" />Vacant</span>
      </div>

      {/* Drawer for selected unit */}
      {selected && (
        <div className="glass-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-kodi-dark">Unit {selected.unitNumber}</h3>
              <p className="text-sm text-kodi-text-muted">{STATUS_LABEL[selected.status]}</p>
              <p className="text-sm font-semibold text-kodi-dark mt-1">{formatCurrency(selected.rentAmount)} / month</p>
              {selected.bedrooms && <p className="text-xs text-kodi-text-muted">{selected.bedrooms} bed · Floor {selected.floor}</p>}
            </div>
            <button onClick={() => setSelected(null)} className="text-kodi-text-muted hover:text-kodi-dark text-xl transition-colors">×</button>
          </div>

          {selected.tenants?.[0] && (
            <div className="mt-3 pt-3 border-t border-kodi-border/50">
              <p className="text-xs text-kodi-text-muted mb-1 font-medium uppercase tracking-wider">Current Tenant</p>
              <Link
                to={`/dashboard/tenants/${selected.tenants[0].id}`}
                className="text-sm font-bold text-kodi-accent hover:underline"
              >
                {selected.tenants[0].name}
              </Link>
            </div>
          )}

          {selected._count?.tickets > 0 && (
            <div className="mt-2 text-xs text-kodi-rose font-bold flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-kodi-rose animate-pulse" />
              {selected._count.tickets} open maintenance ticket{selected._count.tickets !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
