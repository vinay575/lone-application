import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Loader from '../../components/Loader.jsx';
import { api } from '../../lib/api.js';
import { APP_FLOW } from '../../lib/constants.js';
import { formatDateTime, formatINR, statusClass } from '../../lib/format.js';

export default function AdminApplications() {
  const [apps, setApps] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get(`/admin/applications?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`)
        .then((d) => setApps(d.applications))
        .catch(() => setApps([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, status]);

  return (
    <div className="fade-up">
      <h1>Applications</h1>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <div className="field" style={{ maxWidth: 340, flex: 1 }}>
          <label htmlFor="ref">Search by reference / customer</label>
          <div style={{ position: 'relative' }}>
            <input
              id="ref"
              placeholder="e.g. LN-2026-30001"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {APP_FLOW.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {!apps ? (
        <Loader />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Applicant</th>
                <th>Plan</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Docs</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.refNumber}</strong>
                  </td>
                  <td>
                    {a.applicant}
                    <div className="text-sm text-muted">{a.email}</div>
                  </td>
                  <td>{a.planCode || '—'}</td>
                  <td>{formatINR(a.requestedAmount || 0)}</td>
                  <td>
                    <span className={statusClass(a.status)}>{a.status}</span>
                  </td>
                  <td>
                    {a.docsComplete ? (
                      <span className="badge badge-done">Complete</span>
                    ) : (
                      <span className="badge badge-draft">Incomplete</span>
                    )}
                  </td>
                  <td>{formatDateTime(a.updatedAt)}</td>
                  <td>
                    <Link to={`/admin/applications/${a.id}`} className="btn btn-ghost btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={8} className="center text-muted">
                    No applications match. <Search size={14} style={{ verticalAlign: -2 }} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
