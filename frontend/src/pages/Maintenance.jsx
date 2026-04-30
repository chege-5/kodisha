import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import TicketQueue from '../components/TicketQueue';
import { useAuth } from '../hooks/useAuth';

function useTickets() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ['tickets', role],
    queryFn: async () => {
      if (role === 'CARETAKER') {
        return api.get('/caretakers/tickets').then((response) => response.data);
      }

      const tenantsResponse = await api.get('/tenants', { params: { limit: 200 } });
      const allTickets = [];
      for (const tenant of (tenantsResponse.data.tenants || [])) {
        const tenantFull = await api.get(`/tenants/${tenant.id}`).then((response) => response.data);
        (tenantFull.tickets || []).forEach((ticket) => allTickets.push({
          ...ticket,
          tenant: { name: tenant.name, phone: tenant.phone },
          unit: tenantFull.unit,
        }));
      }
      return allTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  });
}

export default function Maintenance() {
  const { data: tickets, isLoading } = useTickets();

  const open = tickets?.filter((ticket) => ticket.status === 'OPEN').length ?? 0;
  const inProgress = tickets?.filter((ticket) => ticket.status === 'IN_PROGRESS').length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <p className="section-eyebrow text-kodi-accent-light">Service desk</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-kodi-text-primary">Maintenance</h1>
        <p className="mt-1 text-sm text-kodi-text-muted">{open} open, {inProgress} in progress</p>
      </div>
      <TicketQueue tickets={tickets || []} isLoading={isLoading} />
    </div>
  );
}
