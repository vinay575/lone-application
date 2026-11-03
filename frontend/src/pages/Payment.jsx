import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ArrowLeft, Lock } from 'lucide-react';
import Loader from '../components/Loader.jsx';
import UpiScanner from '../components/UpiScanner.jsx';
import { api, ApiError } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatINR } from '../lib/format.js';

export default function Payment() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [plans, setPlans] = useState([]);
  const [planCode, setPlanCode] = useState('A');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [verify, setVerify] = useState(false);
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState(null);

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

  const startVerify = () => {
    if (!plan) return;
    setUtrError(null);
    setVerify(true);
  };

  const pay = async () => {
    const value = utr.replace(/\s+/g, '');
    if (!/^\d{9,16}$/.test(value)) {
      setUtrError('UTR is usually 9-16 digits, shown in your UPI app transaction details.');
      return;
    }
    setBusy(true);
    setUtrError(null);
    try {
      const d = await api.post('/customer/payments/simulate', {
        applicationId: Number(applicationId),
        planCode,
        method: 'upi',
        utr: value,
      });
      setResult(d);
      toast.success('Payment verified successfully.');
    } catch (err) {
      if (err instanceof ApiError) {
        setUtrError(err.fields?.utr || null);
        toast.error(err.message);
      } else {
        toast.error('Could not verify the payment.');
      }
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
              <div className="row between"><span className="text-sm text-muted">UTR</span><strong>{result.payment?.utr || '—'}</strong></div>
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
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setResult(null);
                  setVerify(false);
                  setUtr('');
                  setUtrError(null);
                }}
              >
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
          <h3 style={{ fontSize: '1rem' }}>{verify ? 'Verify your payment' : 'Pay with UPI'}</h3>

          {!verify ? (
            <>
              <p className="text-sm text-muted" style={{ marginTop: 0 }}>
                Scan the QR code with PhonePe, Google Pay or Paytm — the amount is filled in
                automatically. We never ask for your card number, CVV, UPI PIN or banking password
                on this site.
              </p>

              {plan && (
                <UpiScanner
                  amount={amount}
                  planName={plan.name}
                  txnRef={`LL-${applicationId}-${planCode}`}
                  reference={app.refNumber}
                />
              )}

              <button className="btn btn-teal btn-block btn-lg" onClick={startVerify} disabled={!plan}>
                <ShieldCheck size={18} />
                {`I've paid ${formatINR(amount)} — Confirm payment`}
              </button>
            </>
          ) : (
            <div className="fade-up">
              <div className="alert alert-info">
                Open your UPI app (PhonePe / GPay / Paytm) → <strong>History</strong> → select the
                payment of <strong>{formatINR(amount)}</strong> → copy the{' '}
                <strong>UTR / Transaction ID</strong> and paste it below. The reference is usually
                9-16 digits.
              </div>
              <div className="field full" style={{ marginTop: '0.8rem' }}>
                <label htmlFor="utr">
                  UTR / Transaction reference <span className="req">*</span>
                </label>
                <input
                  id="utr"
                  name="utr"
                  inputMode="numeric"
                  autoComplete="off"
                  value={utr}
                  placeholder="e.g. 415823697412"
                  className={utrError ? 'invalid' : ''}
                  onChange={(e) => {
                    setUtr(e.target.value);
                    setUtrError(null);
                  }}
                />
                {utrError ? (
                  <span className="err">{utrError}</span>
                ) : (
                  <span className="hint">Found under the transaction details in your UPI app.</span>
                )}
              </div>
              <div className="row" style={{ gap: '0.6rem', marginTop: '1rem' }}>
                <button className="btn btn-teal" onClick={pay} disabled={busy || !plan}>
                  <ShieldCheck size={16} />
                  {busy ? 'Verifying…' : 'Verify & complete payment'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setVerify(false);
                    setUtrError(null);
                  }}
                  disabled={busy}
                >
                  <ArrowLeft size={16} /> Back to QR
                </button>
              </div>
            </div>
          )}

          <p className="center text-sm text-muted" style={{ marginTop: '0.8rem', marginBottom: 0 }}>
            Secured with 256-bit encryption · Sandbox mode, no live funds are transferred.
          </p>
        </div>
      </div>
    </section>
  );
}
