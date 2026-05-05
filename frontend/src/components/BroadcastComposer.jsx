import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperties } from '../hooks/useProperties';
import api, { getFriendlyError } from '../utils/apiClient';
import toast from 'react-hot-toast';
import { MessageSquare, Send, Smartphone } from 'lucide-react';

const CHANNELS = [
  { id: 'SMS', label: 'SMS', icon: Smartphone },
  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { id: 'BOTH', label: 'Both', icon: Send },
];

export default function BroadcastComposer() {
  const qc = useQueryClient();
  const { data: properties = [] } = useProperties();
  const [form, setForm] = useState({ message: '', channel: 'SMS', propertyId: '', futureAt: '' });

  const send = useMutation({
    mutationFn: (data) => api.post('/broadcast', data).then((r) => r.data),
    onSuccess: (d) => {
      toast.success(d.message);
      setForm({ message: '', channel: 'SMS', propertyId: '', futureAt: '' });
      qc.invalidateQueries(['broadcasts']);
    },
    onError: (err) => toast.error(getFriendlyError(err, 'Broadcast failed')),
  });

  const charCount = form.message.length;

  return (
    <div className="glass-card space-y-4">
      <div>
        <h2 className="text-base font-semibold text-kodi-text-primary">Compose Broadcast</h2>
        <p className="mt-1 text-sm text-kodi-text-muted">Send SMS updates, reminders, or notices to active tenants.</p>
      </div>

      <div>
        <label className="label">Target</label>
        <select className="input" value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
          <option value="">All tenants across properties</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Channel</label>
        <div className="grid grid-cols-3 gap-2">
          {CHANNELS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm({ ...form, channel: id })}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                form.channel === id
                  ? 'border-kodi-accent bg-kodi-accent text-white shadow-kodi-accent-20'
                  : 'border-kodi-border/70 text-kodi-text-secondary hover:border-kodi-accent/50 hover:text-kodi-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Message <span className="font-normal text-kodi-text-muted">({charCount}/160)</span></label>
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="Dear tenants, rent is due on the 1st. Kindly pay via M-Pesa and keep your receipt."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, 320) })}
        />
        {charCount > 160 && (
          <p className="mt-1 text-xs text-kodi-amber">Over 160 characters. The SMS provider may split this into multiple messages.</p>
        )}
      </div>

      <div>
        <label className="label">Schedule</label>
        <input
          type="datetime-local"
          className="input"
          value={form.futureAt}
          onChange={(e) => setForm({ ...form, futureAt: e.target.value })}
          min={new Date().toISOString().slice(0, 16)}
        />
      </div>

      <button
        onClick={() => send.mutate({ ...form, futureAt: form.futureAt || undefined })}
        disabled={send.isPending || !form.message.trim()}
        className="btn-primary w-full justify-center"
      >
        <Send className="h-4 w-4" />
        {send.isPending ? 'Sending...' : form.futureAt ? 'Schedule Broadcast' : 'Send Now'}
      </button>
    </div>
  );
}
