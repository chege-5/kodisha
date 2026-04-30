import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const CATEGORY_ICON = { PLUMBING: '🚿', ELECTRICAL: '⚡', SECURITY: '🔒', OTHER: '🔧' };
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
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {['OPEN', 'IN_PROGRESS', 'CLOSED', 'ALL'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? 'bg-kodi-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.replace('_', ' ')}
            <span className="ml-1 opacity-70">({s === 'ALL' ? tickets.length : tickets.filter((t) => t.status === s).length})</span>
          </button>
        ))}
      </div>

      {isLoading && <div className="text-gray-400 text-sm">Loading tickets…</div>}

      <div className="space-y-3">
        {filtered.map((ticket) => (
          <div key={ticket.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{CATEGORY_ICON[ticket.category]}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{ticket.category}</span>
                    <span className={`badge ${STATUS_COLOR[ticket.status]}`}>{ticket.status}</span>
                    {ticket.priority === 'URGENT' && <span className="badge badge-red">URGENT</span>}
                  </div>
                  <p className="text-xs text-gray-500">
                    Ticket #{ticket.id.slice(0, 8)} · Unit {ticket.unit?.unitNumber} · {ticket.tenant?.name}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</p>
            </div>

            <p className="text-sm text-gray-700">{ticket.description}</p>

            {ticket.voiceRecordingUrl && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Voice Recording</p>
                <audio controls src={ticket.voiceRecordingUrl} className="w-full h-8" />
              </div>
            )}

            {ticket.assignedTo && <p className="text-xs text-gray-500">Assigned to: {ticket.assignedTo}</p>}

            {ticket.rating && (
              <p className="text-xs text-gray-500">
                Tenant Rating: {'⭐'.repeat(ticket.rating)} ({ticket.rating}/5)
                {ticket.ratingComment && ` — "${ticket.ratingComment}"`}
              </p>
            )}

            {/* Actions */}
            {ticket.status !== 'CLOSED' && (
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                {ticket.status === 'OPEN' && (
                  <button
                    onClick={() => updateTicket.mutate({ id: ticket.id, data: { status: 'IN_PROGRESS' } })}
                    className="btn-secondary text-xs"
                  >
                    Start Work
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
        ))}

        {filtered.length === 0 && !isLoading && (
          <div className="card text-center py-10 text-gray-400">
            No {filter !== 'ALL' ? filter.toLowerCase().replace('_', ' ') : ''} tickets
          </div>
        )}
      </div>
    </div>
  );
}
