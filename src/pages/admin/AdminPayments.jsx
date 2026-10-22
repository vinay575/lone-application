import { useEffect, useState } from 'react';
import Loader from '../../components/Loader.jsx';
import { api } from '../../lib/api.js';
import { formatDateTime, formatINR } from '../../lib/format.js';

export default function AdminPayments() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/payments').then(setData).catch(() => setData({ payments: [] }));
  }, []);

  if (!data) return <Loader />;

  const total = data.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="fade-up">
      <h1>Payments</h1>
      <div className="alert alert-info">
        Sandbox gateway — payments are recorded for the workflow but no live funds are captured.{' '}
        {data.note}
      </div>
      <div className="dash-stats dash-stats-3">
        <div className="dash-stat">
          <span>Total records</span>
          <strong>{data.payments.length}</strong>
        </div>
        <div className="dash-stat">
          <span>Total collected</span>
          <strong>{formatINR(total)}</strong>
        </div>
        <div className="dash-stat">
          <span>Live money charged</span>
          <strong>₹0</strong>
        </div>
      </div>
      <div className="table-wrap mt-2">
        <table className="data">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Reference</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.customer}<div className="text-sm text-muted">{p.email}</div></td>
                <td>{p.refNumber || '—'}</td>
                <td>{p.planCode}</td>
                <td>{formatINR(p.amount)}</td>
                <td>{p.method}</td>
                <td><span className="badge badge-done">Paid</span></td>
                <td>{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
            {data.payments.length === 0 && (
              <tr><td colSpan={8} className="center text-muted">No payments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
