import { useState } from 'react';
import { Link } from 'react-router-dom';
import { unitStatusColor } from '../utils/formatters';
import { formatCurrency } from '../utils/formatters';
import { User, Activity, X } from 'lucide-react';

const STATUS_LABEL = { OCCUPIED: 'Occupied', VACANT: 'Vacant', MAINTENANCE: 'Maintenance' };

export default function UnitGrid({ units = [] }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {units.map((unit) => {
          const isSelected = selected?.id === unit.id;
          const statusBadge = unitStatusColor(unit.status);
          return (
            <button
              key={unit.id}
              onClick={() => setSelected(isSelected ? null : unit)}
              className={`relative border-2 rounded-xl p-3 text-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${statusBadge} ${
                isSelected 
                  ? 'ring-2 ring-kodi-accent border-kodi-accent scale-105 shadow-kodi-accent-10' 
                  : 'border-kodi-border/40 hover:border-kodi-accent/40'
              }`}
            >
              <p className="text-sm font-extrabold">{unit.unitNumber}</p>
              <p className="text-[10px] mt-1 font-semibold uppercase tracking-wider opacity-90">{STATUS_LABEL[unit.status]}</p>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-kodi-text-muted bg-kodi-navy/40 p-2.5 rounded-xl border border-kodi-border/20 max-w-fit">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/15 border border-emerald-500/20" />Paid/Occupied</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/20" />Maintenance</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-500/15 border border-slate-500/20" />Vacant</span>
      </div>

      {/* Drawer for selected unit */}
      {selected && (
        <div className="glass-card p-5 animate-fade-in relative overflow-hidden border border-kodi-accent/30 shadow-kodi-accent-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-kodi-text-primary">Unit {selected.unitNumber}</h3>
                <span className={`badge ${unitStatusColor(selected.status)}`}>{STATUS_LABEL[selected.status]}</span>
              </div>
              <p className="text-sm font-bold text-kodi-accent-light mt-1.5">{formatCurrency(selected.rentAmount)} / month</p>
              {selected.bedrooms && <p className="text-xs text-kodi-text-muted mt-1">{selected.bedrooms} bedroom(s) · Floor {selected.floor}</p>}
            </div>
            <button onClick={() => setSelected(null)} className="p-1 rounded-lg bg-kodi-navy hover:bg-kodi-border/30 text-kodi-text-muted hover:text-kodi-text-primary transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selected.tenants?.[0] && (
            <div className="mt-4 pt-4 border-t border-kodi-border/30 flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-kodi-accent/10 border border-kodi-accent/20 flex items-center justify-center">
                <User className="w-4 h-4 text-kodi-accent" />
              </div>
              <div>
                <p className="text-[10px] text-kodi-text-muted font-bold uppercase tracking-wider">Current Tenant</p>
                <Link
                  to={`/dashboard/tenants/${selected.tenants[0].id}`}
                  className="text-sm font-extrabold text-kodi-accent hover:text-kodi-accent-light hover:underline block"
                >
                  {selected.tenants[0].name}
                </Link>
              </div>
            </div>
          )}

          {selected._count?.tickets > 0 && (
            <div className="mt-3 pt-3 border-t border-kodi-border/30 text-xs text-kodi-rose font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse text-kodi-rose" />
              {selected._count.tickets} open maintenance ticket{selected._count.tickets !== 1 ? 's' : ''} currently active
            </div>
          )}
        </div>
      )}
    </div>
  );
}
