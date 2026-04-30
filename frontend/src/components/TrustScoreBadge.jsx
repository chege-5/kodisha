import { trustTierColor } from '../utils/formatters';

export default function TrustScoreBadge({ score, tier, size = 'md' }) {
  const color = trustTierColor(tier);
  const barPercent = Math.min(100, Math.max(0, ((score - 100) / 800) * 100));

  if (size === 'sm') {
    return (
      <span className={`badge ${color} font-semibold`}>
        {score} · {tier}
      </span>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">Trust Score</span>
        <span className="text-xs font-bold">{tier}</span>
      </div>
      <p className="text-3xl font-bold">{score}</p>
      <div className="mt-2 h-2 bg-black/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-current rounded-full opacity-60 transition-all"
          style={{ width: `${barPercent}%` }}
        />
      </div>
      <p className="text-xs opacity-60 mt-1">Range: 100 (Poor) — 900 (Excellent)</p>
    </div>
  );
}
