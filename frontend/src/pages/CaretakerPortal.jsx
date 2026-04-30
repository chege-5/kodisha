import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatCurrency } from '../utils/formatters';
import { unitStatusColor } from '../utils/formatters';

function useCaretakerPortal() {
  return useQuery({ queryKey: ['caretaker-portal'], queryFn: () => api.get('/caretakers/portal').then((r) => r.data) });
}

const STATUS_LABEL = { OCCUPIED: 'Occupied', VACANT: 'Vacant', MAINTENANCE: 'Maintenance' };

export default function CaretakerPortal() {
  const { data, isLoading } = useCaretakerPortal();

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;

  const { units = [] } = data || {};
  const openTicketCount = units.reduce((s, u) => s + u.tickets.length, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Caretaker Portal</h1>
        <p className="text-gray-500 text-sm">{units.length} units · {openTicketCount} open tickets</p>
      </div>

      <div className="space-y-3">
        {units.map((unit) => {
          const paid = unit.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
          const rentDue = parseFloat(unit.rentAmount);
          const hasArrears = paid < rentDue && unit.status === 'OCCUPIED';

          return (
            <div key={unit.id} className={`card flex items-center justify-between border-l-4 ${hasArrears ? 'border-l-red-400' : unit.status === 'VACANT' ? 'border-l-gray-300' : 'border-l-green-400'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Unit {unit.unitNumber}</span>
                  <span className={`badge ${unit.status === 'OCCUPIED' ? 'badge-green' : unit.status === 'VACANT' ? 'badge-gray' : 'badge-amber'}`}>
                    {STATUS_LABEL[unit.status]}
                  </span>
                  {unit.tickets.length > 0 && <span className="badge badge-red">{unit.tickets.length} ticket{unit.tickets.length !== 1 ? 's' : ''}</span>}
                </div>
                {unit.tenants[0] && <p className="text-sm text-gray-500 mt-0.5">{unit.tenants[0].name} · {unit.tenants[0].phone}</p>}
                <p className="text-xs text-gray-400">{unit.property.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(rentDue)}/mo</p>
                {unit.status === 'OCCUPIED' && (
                  <p className={`text-xs font-medium ${hasArrears ? 'text-red-600' : 'text-green-600'}`}>
                    {hasArrears ? `Owes ${formatCurrency(rentDue - paid)}` : '✓ Paid'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
