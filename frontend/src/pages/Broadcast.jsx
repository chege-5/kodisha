import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import BroadcastComposer from '../components/BroadcastComposer';
import { formatDate } from '../utils/formatters';

function useBroadcastHistory() {
  return useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/broadcast').then((r) => r.data),
  });
}

const CH_ICON = { SMS: '📱', WHATSAPP: '💬', BOTH: '📡' };

export default function Broadcast() {
  const { data: history = [] } = useBroadcastHistory();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Broadcast</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BroadcastComposer />

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Sent History</h2>
          {history.length === 0 && <p className="text-gray-400 text-sm">No broadcasts yet</p>}
          {history.map((b) => (
            <div key={b.id} className="card py-3 px-4">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{CH_ICON[b.channel]}</span>
                  <span className={`badge ${b.status === 'SENT' ? 'badge-green' : b.status === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>{b.status}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(b.sentAt || b.scheduledAt)}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{b.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {b.property?.name || 'All properties'} · {b.recipientCount} recipient{b.recipientCount !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
