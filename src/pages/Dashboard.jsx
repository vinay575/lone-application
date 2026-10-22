import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  FileText,
  CreditCard,
  FolderOpen,
  Sparkles,
  User,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import Field from '../components/Field.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';
import Loader from '../components/Loader.jsx';
import { api, ApiError } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatINR, formatDateTime, statusClass } from '../lib/format.js';

function DocStatus({ documents = {} }) {
  const rows = [
    ['PAN (sample)', documents.pan],
    ['Aadhaar (sample)', documents.aadhaar],
    ['Photograph (sample)', documents.photo],
  ];
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.45rem' }}>
      {rows.map(([label, doc]) => (
        <li key={label} className="row between text-sm">
          <span>{label}</span>
          {doc?.uploaded ? (
            <span className="badge badge-done">Uploaded</span>
          ) : (
            <span className="badge badge-draft">Pending</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { user, logout, refresh, setUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activeApp, setActiveApp] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
  });
  const [profileBusy, setProfileBusy] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [apps, pays, notifs, planRes] = await Promise.all([
        api.get('/customer/applications'),
        api.get('/customer/payments'),
        api.get('/customer/notifications'),
        api.get('/plans'),
      ]);
      setApplications(apps.applications);
      setPayments(pays.payments);
      setNotifications(notifs.notifications);
      setPlans(planRes.plans);
      const editable = apps.applications.find(
        (a) => a.status === 'Draft' || a.status === 'Additional Information Required'
      );
      setActiveApp(editable || apps.applications[0] || null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Could not load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileBusy(true);
    try {
      const d = await api.put('/auth/me', profileForm);
      setUser(d.user);
      toast.success('Profile updated.');
      setProfileOpen(false);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Profile update failed.');
      }
    } finally {
      setProfileBusy(false);
    }
  };

  const markRead = async () => {
    try {
      await api.post('/customer/notifications/read-all', {});
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch {
      /* ignore */
    }
  };

  if (loading) return <Loader label="Loading your dashboard…" />;

  const unlockedPlans = plans.filter((p) => (user?.plansUnlocked || []).includes(p.code));
  const latestApp = activeApp || applications[0] || null;

  return (
    <section className="section" style={{ paddingTop: '2rem' }}>
      <div className="container">
        <div className="welcome-card fade-up">
          <div className="row between" style={{ position: 'relative', zIndex: 1 }}>
            <div>
              <h2>Welcome back, {user?.fullName?.split(' ')[0]} 👋</h2>
              <p>
                Follow your application from submission to completion, manage your documents and
                reach support — all in one place.
              </p>
            </div>
            <div className="row">
              <Link to="/apply" className="btn btn-teal btn-sm">
                <Sparkles size={15} /> New Application
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={() => setProfileOpen((o) => !o)}>
                <User size={15} /> Profile
              </button>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>
        </div>

        {profileOpen && (
          <div className="card fade-up" style={{ marginBottom: '1.4rem' }}>
            <h3>My profile</h3>
            <form onSubmit={saveProfile} className="form-grid">
              <Field label="Full name" name="fullName" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} required />
              <Field label="Mobile" name="mobile" value={profileForm.mobile} onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })} required />
              <Field label="Email" name="email" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
              <div className="field" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" disabled={profileBusy}>
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="dash-stats dash-stats-3 stagger">
          <div className="dash-stat">
            <span>Applications</span>
            <strong>{applications.length}</strong>
          </div>
          <div className="dash-stat">
            <span>Payments</span>
            <strong>{payments.length}</strong>
          </div>
          <div className="dash-stat">
            <span>Active plans</span>
            <strong>{unlockedPlans.length}</strong>
          </div>
        </div>

        <div className="dash-grid">
          <div style={{ display: 'grid', gap: '1.4rem' }}>
            <div className="card">
              <div className="row between">
                <h3 style={{ margin: 0 }}>
                  <FileText size={17} style={{ marginRight: 6, color: 'var(--teal-600)' }} />
                  Application status
                </h3>
                {latestApp && <span className={statusClass(latestApp.status)}>{latestApp.status}</span>}
              </div>
              {latestApp ? (
                <>
                  <div className="divider" />
                  <div className="row between text-sm">
                    <div>
                      <div className="text-muted">Reference number</div>
                      <strong>{latestApp.refNumber}</strong>
                    </div>
                    <div>
                      <div className="text-muted">Plan</div>
                      <strong>Plan {latestApp.planCode}</strong>
                    </div>
                    <div>
                      <div className="text-muted">Requested amount</div>
                      <strong>{formatINR(latestApp.loan?.requestedAmount || 0)}</strong>
                    </div>
                    <div>
                      {latestApp.status === 'Draft' || latestApp.status === 'Additional Information Required' ? (
                        <Link to={`/apply?app=${latestApp.id}`} className="btn btn-teal btn-sm">
                          Continue application <ArrowRight size={14} />
                        </Link>
                      ) : (
                        <Link to={`/payment/${latestApp.id}`} className="btn btn-ghost btn-sm">
                          Pay now
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="divider" />
                  <StatusTimeline status={latestApp.status} history={latestApp.history || []} />
                </>
              ) : (
                <div className="empty">
                  No applications yet.{' '}
                  <Link to="/apply">Start an application</Link> to see the status timeline.
                </div>
              )}
            </div>

            <div className="card">
              <h3>
                <FolderOpen size={17} style={{ marginRight: 6, color: 'var(--teal-600)' }} />
                Document uploads
              </h3>
              {latestApp ? <DocStatus documents={latestApp.documents} /> : <div className="empty">No application yet.</div>}
              <p className="text-sm text-muted" style={{ marginTop: '0.8rem', marginBottom: 0 }}>
                Your documents are encrypted and stored securely — they are never shared without
                your consent.
              </p>
            </div>

            <div className="card">
              <h3>
                <CreditCard size={17} style={{ marginRight: 6, color: 'var(--teal-600)' }} />
                Payment history
              </h3>
              {payments.length === 0 ? (
                <div className="empty">No payments yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td>Plan {p.planCode}</td>
                          <td>{formatINR(p.amount)}</td>
                          <td>{p.method}</td>
                          <td>
                            <span className="badge badge-done">Paid</span>
                          </td>
                          <td>{formatDateTime(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1.4rem' }}>
            <div className="card">
              <h3>
                <Sparkles size={17} style={{ marginRight: 6, color: 'var(--teal-600)' }} />
                Active plans
              </h3>
              {unlockedPlans.length === 0 ? (
                <div className="empty">
                  No active plans yet.{' '}
                  <Link to="/#plans">Explore plans</Link> and activate one.
                </div>
              ) : (
                unlockedPlans.map((p) => (
                  <div key={p.id} className="row between" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <strong>{p.name}</strong>
                      <div className="text-sm text-muted">Up to {formatINR(p.maxAmount)}</div>
                    </div>
                    <span className="badge badge-done">Active</span>
                  </div>
                ))
              )}
              <p className="text-sm text-muted" style={{ marginTop: '0.7rem', marginBottom: 0 }}>
                Your plan is active after payment — it does not by itself mean a loan has been
                sanctioned. Approval is subject to assessment.
              </p>
            </div>

            <div className="card">
              <h3>
                <Bell size={17} style={{ marginRight: 6, color: 'var(--teal-600)' }} />
                Notifications
                {notifications.some((n) => !n.read) && (
                  <button className="btn btn-soft btn-sm" style={{ marginLeft: 'auto' }} onClick={markRead}>
                    Mark all read
                  </button>
                )}
              </h3>
              {notifications.length === 0 ? (
                <div className="empty">No notifications.</div>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <div key={n.id} style={{ padding: '0.55rem 0', borderBottom: '1px solid var(--line)' }}>
                    <div className="row between">
                      <strong className="text-sm" style={{ opacity: n.read ? 0.65 : 1 }}>
                        {n.title}
                      </strong>
                      {!n.read && <span className="badge badge-submitted">New</span>}
                    </div>
                    <div className="text-sm text-muted">{n.body}</div>
                    <div className="text-sm text-muted" style={{ fontSize: '0.75rem' }}>
                      {formatDateTime(n.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
