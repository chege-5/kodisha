export function formatCurrency(amount, currency = 'KES') {
  const symbols = { KES: 'KSh', USD: '$', GBP: '£', EUR: '€' };
  const sym = symbols[currency] || currency;
  return `${sym} ${parseFloat(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(date, opts = {}) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric', ...opts,
  });
}

export function formatMonth(year, month) {
  return new Date(year, month - 1).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' });
}

export function daysOverdue(from = new Date()) {
  const dueDate = new Date(new Date(from).getFullYear(), new Date(from).getMonth(), 1);
  const diff = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function paymentStatusColor(status) {
  const map = {
    paid: 'badge-green',
    partial: 'badge-amber',
    late: 'badge-red',
    missed: 'badge-red',
    future: 'badge-gray',
  };
  return map[status] || 'badge-gray';
}

export function unitStatusColor(status) {
  const map = {
    OCCUPIED: 'bg-green-100 border-green-300 text-green-800',
    VACANT: 'bg-gray-100 border-gray-300 text-gray-600',
    MAINTENANCE: 'bg-amber-100 border-amber-300 text-amber-800',
  };
  return map[status] || 'bg-gray-100';
}

export function trustTierColor(tier) {
  const map = {
    Excellent: 'text-green-700 bg-green-50',
    Good: 'text-blue-700 bg-blue-50',
    Fair: 'text-amber-700 bg-amber-50',
    Poor: 'text-red-700 bg-red-50',
  };
  return map[tier] || 'text-gray-700 bg-gray-50';
}
