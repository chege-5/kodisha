import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import TicketQueue from '../components/TicketQueue';
import { useAuth } from '../hooks/useAuth';

function useTickets() {
  const { role } = useAuth();
  const endpoint = role === 'CARETAKER' ? '/caretakers/tickets' : '/tenants';

  return useQuery({
    queryKey: ['tickets', role],
    queryFn: async () => {
      if (role === 'CARETAKER') {
        return api.get('/caretakers/tickets').then((r) => r.data);
      }
      // For landlords: collect tickets from all tenants
      const tenantsRes = await api.get('/tenants', { params: { limit: 200 } });
      const allTickets = [];
      for (const t of (tenantsRes.data.tenants || [])) {
        const tenantFull = await api.get(`/tenants/${t.id}`).then((r) => r.data);
        (tenantFull.tickets || []).forEach((tk) => allTickets.push({
          ...tk,
          tenant: { name: t.name, phone: t.phone },
          unit: tenantFull.unit,
        }));
      }
      return allTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  });
}

export default function Maintenance() {
  const { data: tickets, isLoading } = useTickets();

  const open = tickets?.filter((t) => t.status === 'OPEN').length ?? 0;
  const inProgress = tickets?.filter((t) => t.status === 'IN_PROGRESS').length ?? 0;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        <p className="text-gray-500 text-sm">{open} open · {inProgress} in progress</p>
      </div>
      <TicketQueue tickets={tickets || []} isLoading={isLoading} />
    </div>
  );
}
