import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatDate } from '../utils/formatters';
import { Bell, CheckCheck, Mail, AlertTriangle, CreditCard, Droplets, Wrench } from 'lucide-react';

const TYPE_ICONS = {
  PAYMENT_RECEIVED: CreditCard,
  RENT_DUE: AlertTriangle,
  BILL_GENERATED: Mail,
  WATER_BILL: Droplets,
  ISSUE_CREATED: Wrench,
  ISSUE_UPDATED: Wrench,
  METER_READING: Droplets,
  SYSTEM_ALERT: Bell,
  BROADCAST: Mail,
};

const TYPE_COLORS = {
  PAYMENT_RECEIVED: 'text-emerald-400 bg-emerald-500/10',
  RENT_DUE: 'text-amber-400 bg-amber-500/10',
  BILL_GENERATED: 'text-indigo-400 bg-indigo-500/10',
  WATER_BILL: 'text-cyan-400 bg-cyan-500/10',
  ISSUE_CREATED: 'text-rose-400 bg-rose-500/10',
  ISSUE_UPDATED: 'text-emerald-400 bg-emerald-500/10',
};

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=50').then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['notifications', 'unread-count']),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications', 'unread-count']),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  if (isLoading) return (
    <div className="p-8 space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton" />)}
    </div>
  );

  return (
    <div className="page-shell p-4 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Notifications</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-kodi-dark flex items-center gap-2">
            <Bell className="w-6 h-6 text-kodi-accent" /> Notifications
          </h1>
          <p className="text-kodi-text-muted text-sm mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead.mutate()} className="btn-ghost text-xs">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="glass-card text-center py-12">
            <Bell className="w-10 h-10 text-kodi-text-muted mx-auto mb-3" />
            <p className="text-kodi-text-secondary">No notifications yet</p>
          </div>
        ) : notifications.map((n) => {
          const Icon = TYPE_ICONS[n.type] || Bell;
          const colorClass = TYPE_COLORS[n.type] || 'text-kodi-text-muted bg-kodi-border/20';
          return (
            <div key={n.id}
              onClick={() => !n.isRead && markRead.mutate(n.id)}
              className={`glass-card py-4 px-5 flex items-start gap-4 cursor-pointer transition-all hover:border-kodi-accent/20 ${!n.isRead ? 'border-l-2 border-l-kodi-accent bg-kodi-accent/[0.02]' : 'opacity-70'}`}>
              <div className={`p-2 rounded-xl ${colorClass} flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-kodi-text-primary">{n.title}</p>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-kodi-accent flex-shrink-0" />}
                </div>
                <p className="text-xs text-kodi-text-muted mt-0.5">{n.message}</p>
                <p className="text-[10px] text-kodi-text-muted mt-1.5">{formatDate(n.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
