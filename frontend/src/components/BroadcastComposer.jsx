import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperties } from '../hooks/useProperties';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';

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
    onError: (err) => toast.error(err.response?.data?.error || 'Broadcast failed'),
  });

  const charCount = form.message.length;

  return (
    <div className="card space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Compose Broadcast</h2>

      <div>
        <label className="label">Target</label>
        <select className="input" value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
          <option value="">All Tenants (all properties)</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Channel</label>
        <div className="flex gap-2">
          {['SMS', 'WHATSAPP', 'BOTH'].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setForm({ ...form, channel: ch })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                form.channel === ch ? 'bg-kodi-navy text-white border-kodi-navy' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {ch === 'SMS' ? '📱 SMS' : ch === 'WHATSAPP' ? '💬 WhatsApp' : '📡 Both'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Message <span className="text-gray-400 font-normal">({charCount}/160)</span></label>
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="Dear tenants, your rent is due on the 1st of the month…"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, 320) })}
        />
        {charCount > 160 && <p className="text-xs text-amber-600 mt-1">Over 160 chars — will be split into 2 SMS messages</p>}
      </div>

      <div>
        <label className="label">Schedule (optional — leave blank to send now)</label>
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
        {send.isPending ? 'Sending…' : form.futureAt ? '📅 Schedule Broadcast' : '📤 Send Now'}
      </button>
    </div>
  );
}
