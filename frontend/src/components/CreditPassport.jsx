import { useMutation } from '@tanstack/react-query';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';
import { paymentStatusColor } from '../utils/formatters';
import TrustScoreBadge from './TrustScoreBadge';

const STATUS_EMOJI = { paid: '✅', late: '🔴', partial: '🟡', missed: '⬜', future: '⬜' };

export default function CreditPassport({ data }) {
  const { tenant, passport, trustScore, paymentCalendar } = data || {};

  const shareMutation = useMutation({
    mutationFn: () => api.post(`/passport/${tenant.id}/share`).then((r) => r.data),
    onSuccess: (d) => {
      toast.success('Passport PDF generated');
      window.open(d.pdfUrl, '_blank');
    },
    onError: () => toast.error('Failed to generate passport'),
  });

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Credit Passport</h3>
          <p className="text-sm text-gray-500">{tenant?.name}</p>
        </div>
        <button
          onClick={() => shareMutation.mutate()}
          disabled={shareMutation.isPending}
          className="btn-secondary text-xs"
        >
          {shareMutation.isPending ? 'Generating…' : '↓ Download PDF'}
        </button>
      </div>

      <TrustScoreBadge score={trustScore?.score} tier={trustScore?.tier} />

      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          ['Months Tracked', passport?.totalMonths],
          ['On-Time Rate', passport?.onTimeRate],
          ['Late Payments', passport?.lateMonths],
          ['Avg Days Late', passport?.averageDaysLate],
        ].map(([label, value]) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold text-gray-900 mt-0.5">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* 12-month payment calendar */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">12-Month History</p>
        <div className="grid grid-cols-6 gap-1.5">
          {paymentCalendar?.map((m) => (
            <div
              key={`${m.year}-${m.monthNum}`}
              title={`${m.month}: ${m.status}${m.daysLate > 0 ? ` (${m.daysLate}d late)` : ''}`}
              className={`rounded p-1.5 text-center cursor-help badge ${paymentStatusColor(m.status)}`}
            >
              <p className="text-xs font-medium">{STATUS_EMOJI[m.status]}</p>
              <p className="text-xs opacity-70" style={{ fontSize: '9px' }}>{m.month.slice(0, 3)}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          <span>✅ On-time</span><span>🔴 Late</span><span>🟡 Partial</span><span>⬜ Missed</span>
        </div>
      </div>
    </div>
  );
}
