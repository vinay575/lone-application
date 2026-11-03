export const UPI_VPA = import.meta.env.VITE_UPI_VPA || 'loanledger@sandbox';
export const UPI_PAYEE = import.meta.env.VITE_UPI_PAYEE || 'LoanLedger Demo';

export function buildUpiUri({ amount, note, txnRef }) {
  const params = [
    ['pa', UPI_VPA],
    ['pn', UPI_PAYEE],
    ['am', Number(amount || 0).toFixed(2)],
    ['cu', 'INR'],
  ];
  if (note) params.push(['tn', note]);
  if (txnRef) params.push(['tr', txnRef]);
  return `upi://pay?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
}
