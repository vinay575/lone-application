import { useEffect, useState } from 'react';
import Loader from '../../components/Loader.jsx';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/format.js';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get(`/admin/users?q=${encodeURIComponent(q)}`)
        .then((d) => setUsers(d.users))
        .catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="fade-up">
      <h1>Registered Users</h1>
      <div className="field" style={{ maxWidth: 380, marginBottom: '1rem' }}>
        <label htmlFor="q">Search</label>
        <input id="q" placeholder="Name, email or mobile…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!users ? (
        <Loader />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Role</th>
                <th>Apps</th>
                <th>Payments</th>
                <th>Active plans</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.mobile}</td>
                  <td>{u.role}</td>
                  <td>{u.applicationCount}</td>
                  <td>{u.paymentCount}</td>
                  <td>{(u.plansUnlocked || []).join(', ') || '—'}</td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={9} className="center text-muted">No users match.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
