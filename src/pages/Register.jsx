import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ApiError } from '../lib/api.js';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const plan = params.get('plan');
  const [form, setForm] = useState({ fullName: '', mobile: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setBusy(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate(plan ? `/apply?plan=${plan}` : '/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError('Registration failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card fade-up">
        <div className="brand">
          <span className="brand-mark">LL</span>
          <span>LoanLedger</span>
        </div>
        <h2 className="center" style={{ fontSize: '1.4rem' }}>
          Create your account
        </h2>
        <p className="center text-sm text-muted">
          It takes less than a minute.
          {plan ? ` You are applying for Plan ${plan}.` : ''}
        </p>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.9rem' }}>
          <Field label="Full name" name="fullName" value={form.fullName} onChange={onChange} error={errors.fullName} required />
          <Field
            label="Mobile number"
            name="mobile"
            type="tel"
            value={form.mobile}
            onChange={onChange}
            error={errors.mobile}
            hint="10-digit Indian mobile number"
            required
          />
          <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} required />
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            hint="At least 8 characters. Stored only as a salted hash."
            required
          />
          <button className="btn btn-teal btn-block" type="submit" disabled={busy}>
            <UserPlus size={16} /> {busy ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="auth-alt">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
