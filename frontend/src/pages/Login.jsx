import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ApiError } from '../lib/api.js';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
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
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : location.state?.from || '/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError('Login failed. Please try again.');
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
          Customer Login
        </h2>
        <p className="center text-sm text-muted">Access your dashboard and application journey.</p>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.9rem' }}>
          <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} required />
          <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} required />
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            <LogIn size={16} /> {busy ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p className="auth-alt">
          New to LoanLedger? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
