import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, Save } from 'lucide-react';
import Loader from '../../components/Loader.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { api, ApiError } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { APP_FLOW } from '../../lib/constants.js';
import { formatDateTime, formatINR, statusClass } from '../../lib/format.js';

export default function AdminApplicationDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notifForm, setNotifForm] = useState({ title: '', body: '' });

  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const d = await api.get(`/admin/applications/${id}`);
      setData(d);
      setStatus(d.application.status);
    } catch {
      setLoadError(true);
      toast.error('Could not load application.');
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/admin/applications/${id}/status`, { status, note, notify });
      toast.success(notify ? 'Status updated & customer notified.' : 'Status updated.');
      setNote('');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Status update failed.');
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/applications/${id}/notes`, { text: newNote });
      setNewNote('');
      toast.success('Internal note added.');
      load();
    } catch {
      toast.error('Could not add note.');
    }
  };

  const sendNotif = async (e) => {
    e.preventDefault();
    if (!data) return;
    try {
      await api.post('/admin/notifications', {
        userId: data.application.userId,
        title: notifForm.title,
        body: notifForm.body,
      });
      setNotifForm({ title: '', body: '' });
      toast.success('Notification sent.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not send notification.');
    }
  };

  if (!data) {
    if (loadError) {
      return (
        <div className="fade-up" style={{ maxWidth: 480 }}>
          <div className="alert alert-error">Could not load this application. Check your connection and try again.</div>
          <button className="btn btn-teal" onClick={load}>Retry</button>
        </div>
      );
    }
    return <Loader label="Loading application…" />;
  }
  const { application: app, customer, payments } = data;
  const docs = app.documents || {};

  return (
    <div className="fade-up">
      <Link to="/admin/applications" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.8rem' }}>
        <ArrowLeft size={14} /> Back to applications
      </Link>
      <div className="row between">
        <h1 style={{ marginBottom: 0 }}>{app.refNumber}</h1>
        <span className={statusClass(app.status)}>{app.status}</span>
      </div>
      <p className="text-sm text-muted">
        Customer: {customer?.fullName} ({customer?.email})
      </p>

      <div className="dash-grid mt-2">
        <div style={{ display: 'grid', gap: '1.2rem' }}>
          <div className="card">
            <h3>Personal details</h3>
            <div className="form-grid text-sm">
              <div><span className="text-muted">Name:</span> {app.personal?.fullName || '—'}</div>
              <div><span className="text-muted">DOB:</span> {app.personal?.dob || '—'}</div>
              <div><span className="text-muted">Gender:</span> {app.personal?.gender || '—'}</div>
              <div><span className="text-muted">Mobile:</span> {app.personal?.mobile || '—'}</div>
              <div><span className="text-muted">Email:</span> {app.personal?.email || '—'}</div>
            </div>
          </div>
          <div className="card">
            <h3>Address</h3>
            <div className="text-sm">
              {app.address?.line1 || '—'}, {app.address?.line2}
              <br />
              {app.address?.city}, {app.address?.state} - {app.address?.pincode}
            </div>
          </div>
          <div className="card">
            <h3>Employment & loan</h3>
            <div className="form-grid text-sm">
              <div><span className="text-muted">Type:</span> {app.employment?.type || '—'}</div>
              <div><span className="text-muted">Employer:</span> {app.employment?.employerName || '—'}</div>
              <div><span className="text-muted">Income:</span> {formatINR(app.employment?.monthlyIncome || 0)}</div>
              <div><span className="text-muted">Requested:</span> {formatINR(app.loan?.requestedAmount || 0)}</div>
              <div><span className="text-muted">Plan:</span> {app.planCode}</div>
              <div><span className="text-muted">Purpose:</span> {app.loan?.purpose || '—'}</div>
            </div>
          </div>
          <div className="card">
            <h3>Document uploads</h3>
            <div className="row">
              {['pan', 'aadhaar', 'photo'].map((k) => (
                <div key={k} className="card" style={{ padding: '0.8rem', flex: 1, minWidth: 160 }}>
                  <div className="text-sm" style={{ fontWeight: 700 }}>{k.toUpperCase()} (sample)</div>
                  {docs[k]?.uploaded ? (
                    <>
                      <div className="text-sm text-muted">{docs[k].fileName}</div>
                      <div className="text-sm text-muted">{formatDateTime(docs[k].uploadedAt)}</div>
                      <span className="badge badge-done mt-1">Uploaded</span>
                    </>
                  ) : (
                    <span className="badge badge-draft mt-1">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {payments.length > 0 && (
            <div className="card">
              <h3>Payments</h3>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{p.planCode}</td>
                        <td>{formatINR(p.amount)}</td>
                        <td><span className="badge badge-done">Paid</span></td>
                        <td>{formatDateTime(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '1.2rem' }}>
          <div className="card">
            <h3>Change status</h3>
            <form onSubmit={changeStatus} style={{ display: 'grid', gap: '0.8rem' }}>
              <div className="field">
                <label htmlFor="st">New status</label>
                <select id="st" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {APP_FLOW.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="note">Note (optional, added to internal notes)</label>
                <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <label className="row text-sm" style={{ gap: '0.5rem' }}>
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                Send notification to customer
              </label>
              <button className="btn btn-teal" disabled={busy}>
                <Save size={15} /> {busy ? 'Saving…' : 'Update status'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3>Status timeline</h3>
            <StatusTimeline status={app.status} history={app.history || []} />
          </div>

          <div className="card">
            <h3>Internal notes (admin only)</h3>
            {(app.internalNotes || []).length === 0 && <div className="empty">No notes yet.</div>}
            {(app.internalNotes || []).map((n, i) => (
              <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--line)' }}>
                <div className="text-sm"><strong>{n.by}</strong> · {formatDateTime(n.at)}</div>
                <div className="text-sm text-muted">{n.text}</div>
              </div>
            ))}
            <form onSubmit={addNote} className="mt-1" style={{ display: 'grid', gap: '0.6rem' }}>
              <textarea rows={2} placeholder="Add an internal note…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              <button className="btn btn-ghost btn-sm" disabled={!newNote.trim()}>
                Add note
              </button>
            </form>
          </div>

          <div className="card">
            <h3>
              <Bell size={16} style={{ color: 'var(--teal-600)' }} /> Send notification
            </h3>
            <form onSubmit={sendNotif} style={{ display: 'grid', gap: '0.7rem' }}>
              <input
                placeholder="Title"
                value={notifForm.title}
                onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                required
              />
              <textarea
                rows={2}
                placeholder="Message"
                value={notifForm.body}
                onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })}
                required
              />
              <button className="btn btn-ghost btn-sm">Send to customer</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
