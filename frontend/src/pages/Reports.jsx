import { useTrustLeaderboard, useAirtimeRewards } from '../hooks/usePayments';
import ITaxExporter from '../components/iTaxExporter';
import { trustTierColor, formatCurrency } from '../utils/formatters';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';

function useApiUsage() {
  return useQuery({ queryKey: ['api-usage'], queryFn: () => api.get('/reports/api-usage').then((r) => r.data) });
}

export default function Reports() {
  const { data: leaderboard = [] } = useTrustLeaderboard();
  const { data: airtime } = useAirtimeRewards();
  const { data: usage } = useApiUsage();

  return (
    <div className="page-shell p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="section-eyebrow">Reports</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-kodi-dark">Reports & Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* iTax */}
        <div className="lg:col-span-1">
          <ITaxExporter />
        </div>

        {/* Trust Leaderboard */}
        <div className="card lg:col-span-1">
          <h2 className="text-base font-semibold text-kodi-dark mb-4">Trust Score Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((t, i) => (
              <div key={t.tenantId} className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-300 w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-kodi-dark truncate">{t.name}</p>
                  <p className="text-xs text-kodi-text-muted">Unit {t.unit}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${trustTierColor(t.tier)}`}>
                  {t.score}
                </span>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="text-kodi-text-muted text-sm">No data yet</p>}
          </div>
        </div>

        {/* API Usage */}
        <div className="card lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-kodi-dark">API Usage This Month</h2>
          {usage ? (
            <div className="space-y-3">
              {[
                ['SMS Sent', usage.smsSent],
                ['USSD Sessions', usage.ussdSessions],
                ['Broadcasts', usage.broadcastsSent],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-kodi-text-muted">{label}</span>
                  <span className="font-semibold text-kodi-dark">{val ?? 0}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-kodi-text-muted text-sm">Loading…</p>}

          {airtime && (
            <div className="border-t border-kodi-border/50 pt-4">
              <h3 className="text-sm font-medium text-kodi-dark mb-2">Airtime Rewards</h3>
              <div className="flex justify-between text-sm">
                <span className="text-kodi-text-muted">Issued this month</span>
                <span className="font-semibold text-green-700">{formatCurrency(airtime.monthlyTotal)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-kodi-text-muted">Monthly cap</span>
                <span className="text-kodi-text-muted">{formatCurrency(airtime.cap)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
