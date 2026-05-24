import { useMutation } from '@tanstack/react-query';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';
import { paymentStatusColor } from '../utils/formatters';
import TrustScoreBadge from './TrustScoreBadge';
import { CheckCircle2, Circle, Clock3, Download, MinusCircle } from 'lucide-react';

const STATUS_ICON = { paid: CheckCircle2, late: Clock3, partial: Circle, missed: MinusCircle, future: Circle };

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
          <h3 className="font-semibold text-kodi-text-primary">Credit Passport</h3>
          <p className="text-sm text-kodi-text-muted">{tenant?.name}</p>
        </div>
        <button
          onClick={() => shareMutation.mutate()}
          disabled={shareMutation.isPending}
          className="btn-secondary text-xs"
        >
          {shareMutation.isPending ? 'Generating...' : <><Download className="h-3.5 w-3.5" /> Download PDF</>}
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
          <div key={label} className="bg-kodi-navy/80 rounded-lg p-3 border border-kodi-border/30">
            <p className="text-xs text-kodi-text-muted">{label}</p>
            <p className="font-semibold text-kodi-text-primary mt-0.5">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* 12-month payment calendar */}
      <div>
        <p className="text-xs font-medium text-kodi-text-muted uppercase tracking-wider mb-2">12-Month History</p>
        <div className="grid grid-cols-6 gap-1.5">
          {paymentCalendar?.map((m) => (
            <MonthCell key={`${m.year}-${m.monthNum}`} month={m} />
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-xs text-kodi-text-muted">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> On-time</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Late</span>
          <span className="inline-flex items-center gap-1"><Circle className="h-3.5 w-3.5" /> Partial</span>
          <span className="inline-flex items-center gap-1"><MinusCircle className="h-3.5 w-3.5" /> Missed</span>
        </div>
      </div>
    </div>
  );
}

function MonthCell({ month }) {
  const Icon = STATUS_ICON[month.status] || Circle;
  return (
    <div
      title={`${month.month}: ${month.status}${month.daysLate > 0 ? ` (${month.daysLate}d late)` : ''}`}
      className={`rounded p-1.5 text-center cursor-help badge ${paymentStatusColor(month.status)}`}
    >
      <Icon className="mx-auto h-3.5 w-3.5" />
      <p className="text-xs opacity-70" style={{ fontSize: '9px' }}>{month.month.slice(0, 3)}</p>
    </div>
  );
}
