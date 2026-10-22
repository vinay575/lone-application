import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader.jsx';
import { api } from '../../lib/api.js';
import { formatINR } from '../../lib/format.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(setStats).catch(() => setStats({}));
  }, []);

  if (!stats) return <Loader label="Loading statistics…" />;

  const cards = [
    { label: 'Registered users', value: stats.users },
    { label: 'Applications', value: stats.applications },
    { label: 'Payments', value: stats.payments },
    { label: 'Collected fees', value: formatINR(stats.simulatedRevenue || 0) },
  ];

  return (
    <div className="fade-up">
      <h1>Admin Dashboard</h1>
      <p className="text-muted text-sm">{stats.demoNotice || 'Overview of activity across the platform.'}</p>
      <div className="dash-stats">
        {cards.map((c) => (
          <div className="dash-stat" key={c.label}>
            <span>{c.label}</span>
            <strong>{c.value ?? '—'}</strong>
          </div>
        ))}
      </div>
      <div className="card mt-2">
        <h3>Applications by status</h3>
        <div className="row" style={{ gap: '0.6rem' }}>
          {Object.entries(stats.byStatus || {}).map(([status, count]) => (
            <span key={status} className="badge badge-submitted" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}>
              {status}: {count}
            </span>
          ))}
        </div>
      </div>
      <div className="card mt-2">
        <h3>Quick links</h3>
        <div className="row">
          <Link to="/admin/applications" className="btn btn-ghost btn-sm">Review applications</Link>
          <Link to="/admin/plans" className="btn btn-ghost btn-sm">Manage plans</Link>
        </div>
      </div>
    </div>
  );
}
