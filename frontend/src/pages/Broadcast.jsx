import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import BroadcastComposer from '../components/BroadcastComposer';
import { formatDate } from '../utils/formatters';
import { MessageSquare, Radio, Smartphone } from 'lucide-react';

function useBroadcastHistory() {
  return useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/broadcast').then((r) => r.data),
  });
}

const CHANNEL_ICON = { SMS: Smartphone, WHATSAPP: MessageSquare, BOTH: Radio };

export default function Broadcast() {
  const { data: history = [] } = useBroadcastHistory();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <p className="section-eyebrow text-kodi-accent-light">Tenant messaging</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-kodi-text-primary">Broadcast</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-kodi-text-muted">
          Send clear SMS notices for rent reminders, building updates, outages, and issue follow-ups.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <BroadcastComposer />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-kodi-text-primary">Message History</h2>
            <span className="badge badge-gray">{history.length} total</span>
          </div>

          {history.length === 0 && (
            <div className="glass-card py-10 text-center">
              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-kodi-text-muted" />
              <p className="text-sm text-kodi-text-secondary">No broadcasts sent yet.</p>
            </div>
          )}

          {history.map((broadcast) => {
            const Icon = CHANNEL_ICON[broadcast.channel] || Smartphone;
            return (
              <div key={broadcast.id} className="glass-card p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-kodi-border/60 bg-kodi-navy/40 text-kodi-accent-light">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className={`badge ${broadcast.status === 'SENT' ? 'badge-green' : broadcast.status === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>
                      {broadcast.status}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-xs text-kodi-text-muted">{formatDate(broadcast.sentAt || broadcast.scheduledAt)}</span>
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-kodi-text-primary">{broadcast.message}</p>
                <p className="mt-2 text-xs text-kodi-text-muted">
                  {broadcast.property?.name || 'All properties'} &middot; {broadcast.recipientCount} recipient{broadcast.recipientCount !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
