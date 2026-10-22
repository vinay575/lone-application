const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatINR = (n) => inr.format(Number(n) || 0);

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusClass(status) {
  switch (status) {
    case 'Draft':
      return 'badge badge-draft';
    case 'Submitted':
      return 'badge badge-submitted';
    case 'Under Review':
      return 'badge badge-review';
    case 'Additional Information Required':
      return 'badge badge-info';
    case 'Demo Completed':
    case 'Completed':
      return 'badge badge-done';
    case 'Open':
      return 'badge badge-open';
    case 'In Progress':
      return 'badge badge-progress';
    case 'Resolved':
      return 'badge badge-resolved';
    default:
      return 'badge badge-draft';
  }
}
