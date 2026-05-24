import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Download, FileText, CheckCircle2, History } from 'lucide-react';

export default function ITaxExporter() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState('ANNUAL');

  const { data: history = [] } = useQuery({
    queryKey: ['itax-history'],
    queryFn: () => api.get('/reports/itax-history').then((r) => r.data),
  });

  const generate = useMutation({
    mutationFn: () => api.get(`/reports/itax/${user.id}`, { params: { year, quarter } }).then((r) => r.data),
    onSuccess: (d) => {
      toast.success(`Report generated — ${d.rowCount} transactions`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Generation failed'),
  });

  const result = generate.data;

  return (
    <div className="card space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-kodi-accent/10 border border-kodi-accent/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-kodi-accent" />
        </div>
        <div>
          <h2 className="text-base font-bold text-kodi-text-primary">iTax KRA Export</h2>
          <p className="text-xs text-kodi-text-muted">Generate KRA-compliant rental income reports</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">Tax Year</label>
          <select className="input select" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2026, 2025, 2024, 2023, 2022].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Filing Period</label>
          <select className="input select" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
            {['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)', 'ANNUAL'].map((q) => (
              <option key={q} value={q.split(' ')[0]}>{q}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => generate.mutate()}
        disabled={generate.isPending}
        className="btn-primary w-full justify-center"
      >
        {generate.isPending ? 'Generating Report…' : `Generate ${quarter} ${year} Report`}
      </button>

      {result && (
        <div className="border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/10 space-y-3">
          <div className="flex items-center gap-2 text-kodi-emerald text-sm font-extrabold">
            <CheckCircle2 className="w-4 h-4" /> Ready for KRA Portal
          </div>
          <p className="text-xs text-kodi-text-secondary">Downloaded documents match iTax layout specifications.</p>
          <div className="flex gap-2">
            <a href={result.csvUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs flex-1 justify-center py-2">
              <Download className="h-3.5 w-3.5 mr-1" /> CSV
            </a>
            <a href={result.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary text-xs flex-1 justify-center py-2">
              <Download className="h-3.5 w-3.5 mr-1" /> PDF
            </a>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="border-t border-kodi-border/30 pt-3">
          <p className="text-xs font-bold text-kodi-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Previous Filings
          </p>
          <div className="space-y-2">
            {history.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs bg-kodi-navy/40 border border-kodi-border/20 rounded-lg px-3 py-2">
                <span className="font-semibold text-kodi-text-secondary">{r.year} {r.quarter}</span>
                <div className="flex gap-3">
                  {r.csvUrl && <a href={r.csvUrl} target="_blank" rel="noreferrer" className="text-kodi-accent font-bold hover:underline">CSV</a>}
                  {r.pdfUrl && <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="text-kodi-accent font-bold hover:underline">PDF</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
