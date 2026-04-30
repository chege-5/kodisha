import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/formatters';

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
    <div className="card space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">iTax Export</h2>
        <p className="text-xs text-gray-500 mt-0.5">Generate KRA-formatted rental income reports</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">Year</label>
          <select className="input" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2025, 2024, 2023, 2022].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Period</label>
          <select className="input" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
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
        {generate.isPending ? 'Generating…' : `Generate ${quarter} ${year} Report`}
      </button>

      {result && (
        <div className="border border-green-200 rounded-lg p-3 bg-green-50 space-y-2">
          <p className="text-sm font-medium text-green-800">Report ready</p>
          <div className="flex gap-2">
            <a href={result.csvUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs flex-1 justify-center">
              <ArrowDownTrayIcon className="h-3 w-3" /> CSV
            </a>
            <a href={result.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary text-xs flex-1 justify-center">
              <ArrowDownTrayIcon className="h-3 w-3" /> PDF
            </a>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Previous Reports</p>
          <div className="space-y-1.5">
            {history.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{r.year} {r.quarter}</span>
                <div className="flex gap-2">
                  {r.csvUrl && <a href={r.csvUrl} target="_blank" rel="noreferrer" className="text-kodi-blue text-xs hover:underline">CSV</a>}
                  {r.pdfUrl && <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="text-kodi-blue text-xs hover:underline">PDF</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
