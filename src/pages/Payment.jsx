import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ArrowLeft, CreditCard, Smartphone, Landmark, Lock } from 'lucide-react';
import Loader from '../components/Loader.jsx';
import { api, ApiError } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatINR } from '../lib/format.js';

const METHODS = [
  { id: 'upi', label: 'UPI', hint: 'Pay with any UPI app', icon: Smartphone },
  { id: 'netbanking', label: 'Net Banking', hint: 'All major banks supported', icon: Landmark },
  { id: 'card', label: 'Credit / Debit Card', hint: 'Visa, Mastercard, RuPay', icon: CreditCard },
];

export default function Payment() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [plans, setPlans] = useState([]);
  const [planCode, setPlanCode] = useState('A');
  const [method, setMethod] = useState('upi');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, p] = await Promise.all([
          api.get(`/customer/applications/${applicationId}`),
          api.get('/plans'),
        ]);
        setApp(a.application);
        setPlans(p.plans);
        setPlanCode(a.application.planCode || p.plans[0]?.code || 'A');
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Could not load payment details.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId, navigate, toast]);

  const plan = plans.find((p) => p.code === planCode);
  const amount = plan?.demoUnlockAmount || 0;

  const pay = async () => {
    setBusy(true);
    try {
      const d = await api.post('/customer/payments/simulate', {
        applicationId: Number(applicationId),
        planCode,
        method,
      });
      setResult(d);
      toast.success('Payment successful.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading checkout…" />;
  if (!app) return null;

  if (result) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 620 }}>
          <div className="card center fade-up" style={{ padding: '2.4rem 1.6rem' }}>
            <CheckCircle2 size={54} style={{ color: 'var(--ok)' }} />
            <h1 style={{ fontSize: '1.7rem', marginTop: '0.8rem' }}>Payment successful</h1>
            <p className="text-muted">
              Your payment of <strong>{formatINR(amount)}</strong> for{' '}
              <strong>{result.plan.name}</strong> has been received. The plan is now active in your
              dashboard, and your application will move to the next stage of review.
            </p>
            <div className="receipt">
              <div className="row between"><span className="text-sm text-muted">Reference</span><strong>{result.receipt || result.reference || '—'}</strong></div>
              <div className="row between"><span className="text-sm text-muted">Amount paid</span><strong>{formatINR(amount)}</strong></div>
              <div className="row between"><span className="text-sm text-muted">Application</span><strong>{app.refNumber}</strong></div>
            </div>
            <p className="text-sm text-muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
              This environment runs in sandbox mode: no live payment gateway is connected and no
              funds are transferred.
            </p>
            <div className="row" style={{ justifyContent: 'center', marginTop: '1.4rem' }}>
              <Link to="/dashboard" className="btn btn-teal">
                Go to dashboard
              </Link>
              <button className="btn btn-ghost" onClick={() => setResult(null)}>
                Back to checkout
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" style={{ paddingTop: '2rem' }}>
      <div className="container" style={{ maxWidth: 680 }}>
        <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={15} /> Back to dashboard
        </Link>
        <h1 style={{ fontSize: '1.7rem' }}>
          <Lock size={20} style={{ color: 'var(--teal-600)' }} /> Secure Checkout
        </h1>
        <p className="text-muted">
          Complete the payment for application <strong>{app.refNumber}</strong>.
        </p>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="row between">
            <div>
              <div className="text-sm text-muted">Plan</div>
              <strong>{plan?.name || `Plan ${planCode}`}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-sm text-muted">Processing fee</div>
              <strong style={{ fontSize: '1.4rem', color: 'var(--teal-600)' }}>
                {formatINR(amount)}
              </strong>
            </div>
          </div>
          <div className="divider" />
          <div className="row" style={{ gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn btn-sm ${planCode === p.code ? 'btn-teal' : 'btn-ghost'}`}
                onClick={() => setPlanCode(p.code)}
              >
                Plan {p.code} · {formatINR(p.demoUnlockAmount)}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem' }}>Payment method</h3>
          <div className="pay-methods">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`pay-method ${active ? 'active' : ''}`}
                  onClick={() => setMethod(m.id)}
                  aria-pressed={active}
                >
                  <Icon size={20} />
                  <span>
                    <strong>{m.label}</strong>
                    <small className="text-muted">{m.hint}</small>
                  </span>
                  <span className="radio-dot" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted" style={{ marginTop: '0.6rem' }}>
            You'll review and confirm the payment on the next screen. We never ask for your card
            number, CVV, UPI PIN or banking password on this site.
          </p>

          <button className="btn btn-teal btn-block btn-lg" onClick={pay} disabled={busy || !plan}>
            <ShieldCheck size={18} />
            {busy ? 'Processing…' : `Pay ${formatINR(amount)}`}
          </button>
          <p className="center text-sm text-muted" style={{ marginTop: '0.8rem', marginBottom: 0 }}>
            Secured with 256-bit encryption · Sandbox mode, no live funds are transferred.
          </p>
        </div>
      </div>
    </section>
  );
}
