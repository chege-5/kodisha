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
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 border border-green-400" />Paid/Occupied</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" />Maintenance</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-400" />Vacant</span>
      </div>

      {/* Drawer for selected unit */}
      {selected && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Unit {selected.unitNumber}</h3>
              <p className="text-sm text-gray-500">{STATUS_LABEL[selected.status]}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(selected.rentAmount)} / month</p>
              {selected.bedrooms && <p className="text-xs text-gray-400">{selected.bedrooms} bed · Floor {selected.floor}</p>}
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>

          {selected.tenants?.[0] && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Current Tenant</p>
              <Link
                to={`/tenants/${selected.tenants[0].id}`}
                className="text-sm font-medium text-kodi-blue hover:underline"
              >
                {selected.tenants[0].name}
              </Link>
            </div>
          )}

          {selected._count?.tickets > 0 && (
            <div className="mt-2 text-xs text-amber-600 font-medium">
              ⚠ {selected._count.tickets} open maintenance ticket{selected._count.tickets !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
