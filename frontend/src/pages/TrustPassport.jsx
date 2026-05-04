import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import TrustScoreBadge from '../components/TrustScoreBadge';
import { Award, Download, KeyRound, Search, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TrustPassport() {
  const [query, setQuery] = useState('');
  const [generatingId, setGeneratingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-passport-tenants', query],
    queryFn: () => api.get('/tenants', { params: { search: query || undefined, limit: 100 } }).then((response) => response.data),
  });

  const tenants = data?.tenants || [];
  const scored = tenants.filter((tenant) => tenant.trustScore);
  const averageScore = scored.length
    ? Math.round(scored.reduce((sum, tenant) => sum + Number(tenant.trustScore.score || 500), 0) / scored.length)
    : 0;
  const excellent = scored.filter((tenant) => Number(tenant.trustScore.score || 0) >= 750).length;

  const generatePassport = useMutation({
    mutationFn: (tenantId) => api.post(`/passport/${tenantId}/share`).then((response) => response.data),
    onMutate: (tenantId) => setGeneratingId(tenantId),
    onSuccess: (result) => {
      toast.success('Credit passport generated');
      if (result.pdfUrl) window.open(result.pdfUrl, '_blank');
    },
    onError: () => toast.error('Could not generate passport PDF'),
    onSettled: () => setGeneratingId(null),
  });

  return (
    <div className="page-shell mx-auto max-w-7xl space-y-6 p-4 lg:p-8 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-eyebrow">Trust Passport</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-kodi-dark">Tenant trust and credit passports</h1>
          <p className="mt-1 max-w-3xl text-sm text-kodi-text-muted">
            Differentiate Kodishaa with portable tenant payment history, trust tiers, on-time behavior, and shareable passport PDFs.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card" style={{ '--stat-color': '#1D4ED8' }}>
          <span className="text-xs text-kodi-text-muted">Tracked tenants</span>
          <p className="text-2xl font-black text-kodi-dark">{tenants.length}</p>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#10B981' }}>
          <span className="text-xs text-kodi-text-muted">Average score</span>
          <p className="text-2xl font-black text-kodi-emerald">{averageScore || 'N/A'}</p>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#F59E0B' }}>
          <span className="text-xs text-kodi-text-muted">Excellent tenants</span>
          <p className="text-2xl font-black text-kodi-amber">{excellent}</p>
        </div>
      </div>

      <div className="glass-card">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-kodi-text-muted" />
          <input
            className="input pl-9"
            placeholder="Search tenant by name or phone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, index) => <div key={index} className="h-48 skeleton" />)
        ) : tenants.length === 0 ? (
          <div className="glass-card py-12 text-center text-kodi-text-muted md:col-span-2 xl:col-span-3">No tenants found.</div>
        ) : tenants.map((tenant) => {
          const score = tenant.trustScore?.score || 500;
          const tier = tenant.trustScore?.tier || (score >= 750 ? 'Excellent' : score >= 600 ? 'Good' : score >= 400 ? 'Fair' : 'Poor');
          return (
            <article key={tenant.id} className="glass-card-hover">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-kodi-dark">{tenant.name}</h2>
                  <p className="text-sm text-kodi-text-muted">{tenant.unit ? `${tenant.unit.property.name} - Unit ${tenant.unit.unitNumber}` : 'Unassigned'}</p>
                </div>
                <KeyRound className="h-5 w-5 text-kodi-accent" />
              </div>
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-kodi-border bg-kodi-navy p-4">
                <div>
                  <p className="text-xs text-kodi-text-muted">Trust score</p>
                  <p className="text-3xl font-black text-kodi-dark">{score}</p>
                </div>
                <TrustScoreBadge score={score} tier={tier} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <Award className="mb-2 h-4 w-4 text-kodi-emerald" />
                  <p className="font-semibold text-kodi-dark">{tier}</p>
                  <p className="text-xs text-kodi-text-muted">Current tier</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <TrendingUp className="mb-2 h-4 w-4 text-kodi-accent" />
                  <p className="font-semibold text-kodi-dark">{tenant._count?.payments || 0}</p>
                  <p className="text-xs text-kodi-text-muted">Payments</p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Link to={`/dashboard/tenants/${tenant.id}`} className="btn-secondary flex-1 text-xs">
                  <Shield className="h-4 w-4" /> View
                </Link>
                <button
                  onClick={() => generatePassport.mutate(tenant.id)}
                  disabled={generatePassport.isPending && generatingId === tenant.id}
                  className="btn-primary flex-1 text-xs"
                >
                  <Download className="h-4 w-4" /> {generatingId === tenant.id ? 'Generating' : 'PDF'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
