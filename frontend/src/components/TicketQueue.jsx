import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Droplets, Lock, Star, Wrench, Zap } from 'lucide-react';

const CATEGORY_ICON = { PLUMBING: Droplets, ELECTRICAL: Zap, SECURITY: Lock, OTHER: Wrench };
const STATUS_COLOR = { OPEN: 'badge-red', IN_PROGRESS: 'badge-amber', CLOSED: 'badge-green' };

export default function TicketQueue({ tickets = [], isLoading }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('OPEN');

  const updateTicket = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/caretakers/tickets/${id}`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries(['tickets']); toast.success('Ticket updated'); },
    onError: () => toast.error('Update failed'),
  });

  const filtered = filter === 'ALL' ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['OPEN', 'IN_PROGRESS', 'CLOSED', 'ALL'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === s 
                ? 'bg-kodi-accent text-white shadow-kodi-accent-20' 
                : 'bg-kodi-card border border-kodi-border text-kodi-text-secondary hover:bg-kodi-navy'
            }`}
          >
            {s.replace('_', ' ')}
            <span className="ml-1 opacity-70">({s === 'ALL' ? tickets.length : tickets.filter((t) => t.status === s).length})</span>
          </button>
        ))}
      </div>

      {isLoading && <div className="text-kodi-text-muted text-sm animate-pulse">Loading tickets…</div>}

      <div className="space-y-3">
        {filtered.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} updateTicket={updateTicket} />
        ))}

        {filtered.length === 0 && !isLoading && (
          <div className="card text-center py-10 text-kodi-text-muted">
            No {filter !== 'ALL' ? filter.toLowerCase().replace('_', ' ') : ''} tickets found.
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, updateTicket }) {
  const CategoryIcon = CATEGORY_ICON[ticket.category] || Wrench;

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-kodi-border bg-kodi-navy p-2">
            <CategoryIcon className="h-5 w-5 text-kodi-accent" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-kodi-text-primary">{ticket.category}</span>
              <span className={`badge ${STATUS_COLOR[ticket.status]}`}>{ticket.status}</span>
              {ticket.priority === 'URGENT' && <span className="badge badge-red animate-pulse">URGENT</span>}
            </div>
            <p className="text-xs text-kodi-text-muted mt-1">
              Ticket #{ticket.id.slice(0, 8)} · Unit {ticket.unit?.unitNumber} · {ticket.tenant?.name}
            </p>
          </div>
        </div>
        <p className="text-xs text-kodi-text-muted">{formatDate(ticket.createdAt)}</p>
      </div>

      <p className="text-sm text-kodi-text-secondary leading-relaxed bg-kodi-navy/55 rounded-xl p-3 border border-kodi-border/30">
        {ticket.description}
      </p>

      {ticket.voiceRecordingUrl && (
        <div className="bg-kodi-navy/40 p-2.5 rounded-xl border border-kodi-border/30">
          <p className="text-xs font-semibold text-kodi-text-secondary mb-1.5">Voice Note Recording</p>
          <audio controls src={ticket.voiceRecordingUrl} className="w-full h-8 rounded-lg" />
        </div>
      )}

      {ticket.assignedTo && (
        <p className="text-xs text-kodi-text-muted bg-kodi-navy/40 py-1.5 px-3 rounded-lg border border-kodi-border/20 inline-block">
          Assigned field officer: <span className="font-semibold text-kodi-text-secondary">{ticket.assignedTo}</span>
        </p>
      )}

      {ticket.rating && (
        <p className="flex items-center gap-1.5 text-xs text-kodi-text-muted border-t border-kodi-border/30 pt-2">
          Tenant feedback: {Array.from({ length: ticket.rating }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current text-kodi-amber" />)} ({ticket.rating}/5)
          {ticket.ratingComment && <span className="italic text-kodi-text-secondary"> — "{ticket.ratingComment}"</span>}
        </p>
      )}

      {/* Actions */}
      {ticket.status !== 'CLOSED' && (
        <div className="flex gap-2 pt-2.5 border-t border-kodi-border/30">
          {ticket.status === 'OPEN' && (
            <button
              onClick={() => updateTicket.mutate({ id: ticket.id, data: { status: 'IN_PROGRESS' } })}
              className="btn-secondary text-xs"
            >
              Start Ticket Work
            </button>
          )}
          <button
            onClick={() => updateTicket.mutate({ id: ticket.id, data: { status: 'CLOSED' } })}
            className="btn-primary text-xs"
          >
            Mark Resolved
          </button>
        </div>
      )}
    </div>
  );
}
