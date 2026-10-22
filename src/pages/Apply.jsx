import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Upload,
  FileText,
  Camera,
  CreditCard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Stepper from '../components/Stepper.jsx';
import Field from '../components/Field.jsx';
import Loader from '../components/Loader.jsx';
import { api, ApiError } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { EMPLOYMENT_TYPES } from '../lib/constants.js';
import { formatINR } from '../lib/format.js';

const STEPS = ['Personal', 'Address', 'Employment', 'Loan', 'Documents', 'Review'];

const EMPTY = {
  personal: { fullName: '', dob: '', gender: '', mobile: '', email: '' },
  address: { line1: '', line2: '', city: '', state: '', pincode: '' },
  employment: { type: '', employerName: '', monthlyIncome: '' },
  loan: { requestedAmount: '', purpose: '', tenureMonths: '' },
};

function clientValidate(step, data) {
  const e = {};
  if (step === 0) {
    if (!data.personal.fullName.trim()) e.fullName = 'Full name is required.';
    if (!data.personal.dob) e.dob = 'Date of birth is required.';
    else {
      const age = (Date.now() - Date.parse(data.personal.dob)) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) e.dob = 'Applicant must be at least 18 years old.';
    }
    if (!data.personal.gender) e.gender = 'Please select a gender.';
    if (!/^[6-9]\d{9}$/.test(data.personal.mobile.replace(/\s+/g, ''))) e.mobile = 'Enter a valid 10-digit mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal.email)) e.email = 'Enter a valid email address.';
  }
  if (step === 1) {
    if (!data.address.line1.trim()) e.line1 = 'Address line is required.';
    if (!data.address.city.trim()) e.city = 'City is required.';
    if (!data.address.state.trim()) e.state = 'State is required.';
    if (!/^\d{6}$/.test(data.address.pincode)) e.pincode = 'Enter a valid 6-digit PIN code.';
  }
  if (step === 2) {
    if (!data.employment.type) e.type = 'Employment type is required.';
    if (data.employment.monthlyIncome === '' || Number(data.employment.monthlyIncome) < 0) {
      e.monthlyIncome = 'Monthly income is required.';
    }
  }
  if (step === 3) {
    const amt = Number(data.loan.requestedAmount);
    if (!amt || amt < 1000) e.requestedAmount = 'Enter an amount of at least ₹1,000.';
    if (!data.loan.purpose.trim()) e.purpose = 'Loan purpose is required.';
  }
  return e;
}

export default function Apply() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [app, setApp] = useState(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState(EMPTY);
  const [planCode, setPlanCode] = useState(params.get('plan') || 'A');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [docs, setDocs] = useState({ pan: null, aadhaar: null, photo: null });
  const [docBusy, setDocBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const planRes = await api.get('/plans');
        setPlans(planRes.plans);
        const appsRes = await api.get('/customer/applications');
        const appParam = params.get('app');
        const planParam = params.get('plan');
        const isEditable = (a) => a.status === 'Draft' || a.status === 'Additional Information Required';

        let target = null;
        if (appParam) {
          // Continue a specific application (e.g. from the dashboard)
          target = appsRes.applications.find((a) => String(a.id) === appParam) || null;
        }
        if (!target && planParam) {
          // Applying for a specific plan: reuse an editable draft for THIS plan,
          // otherwise start a fresh application for it. Never fall back to a
          // draft that belongs to a different plan.
          target =
            appsRes.applications.find((a) => a.planCode === planParam && isEditable(a)) || null;
          if (!target) {
            const created = await api.post('/customer/applications', { planCode: planParam });
            target = created.application;
          }
        }
        if (!target) {
          // No plan specified — resume any editable draft, else show the chooser
          target = appsRes.applications.find(isEditable) || null;
        }

        if (target) {
          setApp(target);
          setPlanCode(target.planCode || planCode);
          setData({
            personal: { ...EMPTY.personal, ...target.personal, fullName: target.personal?.fullName || user?.fullName || '', mobile: target.personal?.mobile || user?.mobile || '', email: target.personal?.email || user?.email || '' },
            address: { ...EMPTY.address, ...target.address },
            employment: { ...EMPTY.employment, ...target.employment, monthlyIncome: target.employment?.monthlyIncome ?? '' },
            loan: { ...EMPTY.loan, ...target.loan, requestedAmount: target.loan?.requestedAmount ?? '' },
          });
          if (target.status === 'Additional Information Required') setStep(4);
        }
      } catch (err) {
        toast.error('Could not load the application form.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPlan = useMemo(() => plans.find((p) => p.code === planCode), [plans, planCode]);

  const setField = (group, field, value) => {
    setData((d) => ({ ...d, [group]: { ...d[group], [field]: value } }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSaveMsg('');
  };

  const saveStep = async (silent = false, manageBusy = true) => {
    if (!app) return false;
    const stepErrors = clientValidate(step, data);
    if (Object.keys(stepErrors).length && step < 4) {
      setErrors(stepErrors);
      toast.error('Please fix the highlighted fields.');
      return false;
    }
    const payload = { planCode };
    if (step === 0) payload.personal = data.personal;
    if (step === 1) payload.address = data.address;
    if (step === 2) {
      payload.employment = { ...data.employment, monthlyIncome: Number(data.employment.monthlyIncome) || 0 };
    }
    if (step === 3) {
      payload.loan = { ...data.loan, requestedAmount: Number(data.loan.requestedAmount) || 0 };
    }
    if (manageBusy) setBusy(true);
    try {
      const d = await api.put(`/customer/applications/${app.id}`, payload);
      setApp(d.application);
      if (!silent) {
        setSaveMsg('Progress saved.');
        toast.success('Progress saved.');
      }
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        toast.error(err.message);
      } else {
        toast.error('Could not save progress.');
      }
      return false;
    } finally {
      if (manageBusy) setBusy(false);
    }
  };

  const next = async () => {
    const ok = await saveStep(true);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const uploadDocs = async () => {
    if (!app) return;
    const fd = new FormData();
    let any = false;
    for (const key of ['pan', 'aadhaar', 'photo']) {
      if (docs[key]) {
        fd.append(key, docs[key]);
        any = true;
      }
    }
    if (!any) {
      setErrors((e) => ({ ...e, documents: 'Add at least one document before continuing.' }));
      return;
    }
    setDocBusy(true);
    try {
      const d = await api.upload(`/customer/applications/${app.id}/documents`, fd);
      setApp(d.application);
      toast.success('Documents uploaded.');
      setErrors((e) => ({ ...e, documents: undefined }));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setDocBusy(false);
    }
  };

  const submitAll = async () => {
    const missing = ['pan', 'aadhaar', 'photo'].filter((k) => !app.documents?.[k]?.uploaded);
    if (missing.length) {
      const msg = `Please upload the required documents: ${missing.join(', ')}.`;
      setErrors((e) => ({ ...e, documents: msg }));
      toast.error(msg);
      return;
    }
    setBusy(true);
    try {
      const saved = await saveStep(true, false);
      if (!saved) return;
      const d = await api.post(`/customer/applications/${app.id}/submit`, {});
      setApp(d.application);
      toast.success('Application submitted!');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        toast.error(err.message);
      } else {
        toast.error('Could not submit the application.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading application form…" />;
  if (!app) {
    return (
      <section className="section">
        <div className="container center" style={{ maxWidth: 520 }}>
          <h2>Choose a plan to begin</h2>
          <p className="text-muted">Select a loan plan to start your application.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            {plans.map((p) => (
              <button
                key={p.id}
                className="btn btn-teal"
                onClick={async () => {
                  try {
                    const d = await api.post('/customer/applications', { planCode: p.code });
                    setApp(d.application);
                    setPlanCode(p.code);
                  } catch {
                    toast.error('Could not start the application. Please try again.');
                  }
                }}
              >
                Plan {p.code} · {formatINR(p.maxAmount)}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const locked = !['Draft', 'Additional Information Required'].includes(app.status);

  return (
    <section className="section" style={{ paddingTop: '2rem' }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="row between">
          <div>
            <h1 style={{ fontSize: '1.7rem', marginBottom: '0.2rem' }}>
              <Sparkles size={20} style={{ color: 'var(--teal-600)' }} /> Loan Application
            </h1>
            <p className="text-sm text-muted mb-0">
              Reference: <strong>{app.refNumber}</strong> · Status: <strong>{app.status}</strong>
            </p>
          </div>
          {saveMsg && <span className="badge badge-done">{saveMsg}</span>}
        </div>

        <div className="card mt-2">
          <Stepper steps={STEPS} current={step} />
          <div className="progress-track" style={{ marginBottom: '1.4rem' }}>
            <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>

          {locked && step < 4 && (
            <div className="alert alert-info">
              This application is submitted ({app.status}). Documents and review are still shown
              below, but edits are locked while your application is under review.
            </div>
          )}

          {step === 0 && (
            <div className="form-grid fade-up">
              <Field label="Full name" name="fullName" value={data.personal.fullName} onChange={(e) => setField('personal', 'fullName', e.target.value)} error={errors.fullName} required />
              <Field label="Date of birth" name="dob" type="date" value={data.personal.dob} onChange={(e) => setField('personal', 'dob', e.target.value)} error={errors.dob} required />
              <Field
                label="Gender"
                name="gender"
                type="select"
                options={[{ value: '', label: 'Select gender' }, 'Male', 'Female', 'Other', 'Prefer not to say']}
                value={data.personal.gender}
                onChange={(e) => setField('personal', 'gender', e.target.value)}
                error={errors.gender}
                required
              />
              <Field label="Mobile number" name="mobile" type="tel" value={data.personal.mobile} onChange={(e) => setField('personal', 'mobile', e.target.value)} error={errors.mobile} required />
              <Field label="Email" name="email" type="email" value={data.personal.email} onChange={(e) => setField('personal', 'email', e.target.value)} error={errors.email} required full />
            </div>
          )}

          {step === 1 && (
            <div className="form-grid fade-up">
              <Field label="Address line 1" name="line1" value={data.address.line1} onChange={(e) => setField('address', 'line1', e.target.value)} error={errors.line1} required />
              <Field label="Address line 2" name="line2" value={data.address.line2} onChange={(e) => setField('address', 'line2', e.target.value)} />
              <Field label="City" name="city" value={data.address.city} onChange={(e) => setField('address', 'city', e.target.value)} error={errors.city} required />
              <Field label="State" name="state" value={data.address.state} onChange={(e) => setField('address', 'state', e.target.value)} error={errors.state} required />
              <Field label="PIN code" name="pincode" inputMode="numeric" value={data.address.pincode} onChange={(e) => setField('address', 'pincode', e.target.value)} error={errors.pincode} required full />
            </div>
          )}

          {step === 2 && (
            <div className="form-grid fade-up">
              <Field
                label="Employment type"
                name="type"
                type="select"
                options={['', ...EMPLOYMENT_TYPES]}
                value={data.employment.type}
                onChange={(e) => setField('employment', 'type', e.target.value)}
                error={errors.type}
                required
              />
              <Field label="Employer / business name (optional)" name="employerName" value={data.employment.employerName} onChange={(e) => setField('employment', 'employerName', e.target.value)} />
              <Field label="Monthly income (₹)" name="monthlyIncome" type="number" min="0" value={data.employment.monthlyIncome} onChange={(e) => setField('employment', 'monthlyIncome', e.target.value)} error={errors.monthlyIncome} required full />
            </div>
          )}

          {step === 3 && (
            <div className="form-grid fade-up">
              <div className="field full">
                <label>
                  Selected plan <span className="req">*</span>
                </label>
                <div className="row">
                  {plans.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className={`btn btn-sm ${planCode === p.code ? 'btn-teal' : 'btn-ghost'}`}
                      onClick={() => setPlanCode(p.code)}
                    >
                      Plan {p.code} · up to {formatINR(p.maxAmount)}
                    </button>
                  ))}
                </div>
                {selectedPlan && (
                  <span className="hint">
                    Processing fee: {formatINR(selectedPlan.demoUnlockAmount)} — payable at checkout.
                  </span>
                )}
              </div>
              <Field
                label="Requested loan amount (₹)"
                name="requestedAmount"
                type="number"
                min="1000"
                value={data.loan.requestedAmount}
                onChange={(e) => setField('loan', 'requestedAmount', e.target.value)}
                error={errors.requestedAmount}
                hint={selectedPlan ? `This plan allows up to ${formatINR(selectedPlan.maxAmount)}` : ''}
                required
              />
              <Field
                label="Tenure (months)"
                name="tenureMonths"
                type="select"
                options={['', '3', '6', '9', '12', '18', '24']}
                value={data.loan.tenureMonths}
                onChange={(e) => setField('loan', 'tenureMonths', e.target.value)}
              />
              <Field label="Loan purpose" name="purpose" type="textarea" rows={3} value={data.loan.purpose} onChange={(e) => setField('loan', 'purpose', e.target.value)} error={errors.purpose} required full />
            </div>
          )}

          {step === 4 && (
            <div className="fade-up">
              <div className="alert alert-info">
                Please upload clear scans or photos of your real documents — PAN, Aadhaar and a
                recent photograph.
              </div>
              {errors.documents && <div className="alert alert-error">{errors.documents}</div>}
              <div className="form-grid">
                {[
                  { key: 'pan', label: 'PAN', icon: <FileText size={22} /> },
                  { key: 'aadhaar', label: 'Aadhaar', icon: <CreditCard size={22} /> },
                  { key: 'photo', label: 'Applicant photograph', icon: <Camera size={22} /> },
                ].map((doc) => {
                  const uploaded = app.documents?.[doc.key]?.uploaded;
                  const pending = docs[doc.key];
                  return (
                    <div className="field" key={doc.key}>
                      <label>{doc.label}</label>
                      <label className={`dropzone ${pending || uploaded ? 'filled' : ''}`} style={{ cursor: 'pointer' }}>
                        {doc.icon}
                        <strong>{pending ? pending.name : uploaded ? app.documents[doc.key].fileName : 'Click to choose a file'}</strong>
                        <span>PNG, JPG, WEBP, PDF or TXT · max 2 MB</span>
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          accept=".png,.jpg,.jpeg,.pdf,.txt,.webp"
                          onChange={(e) => setDocs((d) => ({ ...d, [doc.key]: e.target.files?.[0] || null }))}
                        />
                      </label>
                      {uploaded && (
                        <div className="row" style={{ marginTop: '0.4rem' }}>
                          <span className="badge badge-done">Uploaded</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-teal mt-2" onClick={uploadDocs} disabled={docBusy}>
                <Upload size={16} /> {docBusy ? 'Uploading…' : 'Upload documents'}
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="fade-up">
              <h3>Review your application</h3>
              <div className="form-grid" style={{ gap: '0.8rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <strong>Personal</strong>
                  <div className="text-sm text-muted">{data.personal.fullName}</div>
                  <div className="text-sm text-muted">DOB: {data.personal.dob || '—'}</div>
                  <div className="text-sm text-muted">{data.personal.mobile} · {data.personal.email}</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <strong>Address</strong>
                  <div className="text-sm text-muted">{data.address.line1}, {data.address.line2}</div>
                  <div className="text-sm text-muted">{data.address.city}, {data.address.state} - {data.address.pincode}</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <strong>Employment</strong>
                  <div className="text-sm text-muted">{data.employment.type || '—'}</div>
                  <div className="text-sm text-muted">Income: {formatINR(data.employment.monthlyIncome || 0)}/month</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <strong>Loan</strong>
                  <div className="text-sm text-muted">Plan {planCode} · {formatINR(data.loan.requestedAmount || 0)}</div>
                  <div className="text-sm text-muted">Purpose: {data.loan.purpose || '—'}</div>
                </div>
              </div>
              <div className="card mt-2" style={{ padding: '1rem' }}>
                <strong>Documents</strong>
                <div className="row mt-1">
                  {['pan', 'aadhaar', 'photo'].map((k) => (
                    <span key={k} className={app.documents?.[k]?.uploaded ? 'badge badge-done' : 'badge badge-draft'}>
                      {k}: {app.documents?.[k]?.uploaded ? 'Uploaded' : 'Pending'}
                    </span>
                  ))}
                </div>
                {errors.documents && <div className="alert alert-error mt-2">{errors.documents}</div>}
              </div>
              <div className="alert alert-info mt-2 mb-0">
                By submitting, you confirm the details above are accurate. Your application moves to{' '}
                <strong>Submitted</strong> and you can follow every update on your dashboard.
              </div>
            </div>
          )}

          <div className="divider" />
          <div className="row between">
            <button className="btn btn-ghost" onClick={back} disabled={step === 0 || busy}>
              <ArrowLeft size={16} /> Back
            </button>
            <div className="row">
              {step < 4 && (
                <button className="btn btn-soft" onClick={() => saveStep(false)} disabled={busy || locked}>
                  <Save size={16} /> Save & Continue
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button className="btn btn-teal" onClick={next} disabled={busy || (step === 4 && false)}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn btn-teal" onClick={submitAll} disabled={busy || locked}>
                  <CheckCircle2 size={16} /> {busy ? 'Submitting…' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="center text-sm text-muted mt-2">
          Need help? <Link to="/#support">Visit customer support</Link> or use the assistant.
        </p>
      </div>
    </section>
  );
}
