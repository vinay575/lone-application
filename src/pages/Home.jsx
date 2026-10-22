import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  IndianRupee,
  Zap,
  Users,
  BadgeCheck,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Send,
  LifeBuoy,
  Target,
} from 'lucide-react';
import PlanCard from '../components/PlanCard.jsx';
import Accordion from '../components/Accordion.jsx';
import Field from '../components/Field.jsx';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { EMPLOYMENT_TYPES, STATIC_FAQS } from '../lib/constants.js';
import { formatINR } from '../lib/format.js';

export default function Home() {
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [company, setCompany] = useState(null);
  const [elig, setElig] = useState({ income: '', employment: EMPLOYMENT_TYPES[0], age: '' });
  const [eligResult, setEligResult] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/plans').then((d) => setPlans(d.plans)).catch(() => setPlans([]));
    api.get('/settings/company').then((d) => setCompany(d.company)).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [location]);

  const checkEligibility = (e) => {
    e.preventDefault();
    const income = Number(elig.income);
    const age = Number(elig.age);
    if (!income || !age) {
      setEligResult({ ok: false, text: 'Please enter your monthly income and age to check eligibility.' });
      return;
    }
    if (age < 21 || age > 65) {
      setEligResult({
        ok: false,
        text: 'Our lending guidelines support applicants aged 21–65. Adjust the values and try again.',
      });
      return;
    }
    // Income → suggested plan (a suggestion only; any plan can still be chosen)
    // Suggest the smallest plan whose cap covers the income:
    // C caps at ₹10,000 · A at ₹30,000 · B at ₹1,00,000.
    let code = 'B';
    if (income <= 10000) code = 'C';
    else if (income <= 30000) code = 'A';
    const match = plans.find((p) => p.code === code) || null;
    setEligResult({
      ok: true,
      plan: match,
      text: `Great news — for a monthly income of ${formatINR(income)}, we suggest ${match ? match.name : 'our loan plans'}. This is just a suggestion: you can also apply for any other plan that suits you. Complete your application for a final assessment.`,
    });
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Logged-in customers go straight to the application for that plan;
  // visitors are sent to register first (which then continues to /apply?plan=…).
  const applyLinkFor = (code) =>
    user && user.role !== 'admin' ? `/apply?plan=${code}` : `/register?plan=${code}`;

  const onSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s+/g, ''))) nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.';
    if (!form.message.trim()) nextErrors.message = 'Message is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSuccess('Thanks! Your message has been sent. Our team will get back to you within one working day.');
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    toast.success('Message sent.');
  };

  return (
    <>
      {/* ------------------------------ HERO ------------------------------ */}
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div className="fade-up">
            <span className="eyebrow">Instant personal loans · Fully digital</span>
            <h1>
              Find the Right <span>Loan</span> for You
            </h1>
            <p className="hero-sub">
              Choose from flexible loan plans, complete a paperless application in minutes, and
              track every update in real time. Transparent pricing with zero hidden charges.
            </p>
            <div className="hero-cta">
              <Link to={user && user.role !== 'admin' ? '/apply' : '/register'} className="btn btn-teal btn-lg">
                Apply Now <ArrowRight size={18} />
              </Link>
              <a href="#eligibility" className="btn btn-ghost btn-lg">
                Check Eligibility
              </a>
            </div>
            <div className="hero-badges">
              <span className="hero-badge">
                <ShieldCheck size={17} /> 100% digital process
              </span>
              <span className="hero-badge">
                <Zap size={17} /> Quick decisions
              </span>
              <span className="hero-badge">
                <BadgeCheck size={17} /> Zero hidden charges
              </span>
            </div>
          </div>
          <div className="hero-visual fade-up">
            <div className="float-chip one">
              <Sparkles size={15} /> From ₹499
            </div>
            <div className="float-chip two">
              <ShieldCheck size={15} /> Bank-grade security
            </div>
            <div className="hero-card">
              <div className="row between">
                <strong style={{ color: 'var(--navy-900)' }}>Your loan journey</strong>
                <span className="badge badge-submitted">100% Online</span>
              </div>
              <div className="hero-card-row">
                <span>1. Choose your loan plan</span>
                <span className="text-muted text-sm">3 options</span>
              </div>
              <div className="hero-card-row">
                <span>2. Fill the application</span>
                <span className="text-muted text-sm">Save & continue</span>
              </div>
              <div className="hero-card-row">
                <span>3. Upload KYC documents</span>
                <span className="text-muted text-sm">Secure upload</span>
              </div>
              <div className="hero-card-row">
                <span>4. Complete payment</span>
                <span className="text-muted text-sm">UPI · Card · Netbanking</span>
              </div>
              <div className="hero-card-row">
                <span>5. Track your status</span>
                <span className="text-muted text-sm">Live updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ PLANS ------------------------------ */}
      <section className="section" id="plans">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Loan plans</span>
            <h2>Pick the plan that fits your needs</h2>
            <p>
              Clear amounts, clear pricing. What you see is what you pay — no processing surprises
              at the end.
            </p>
          </div>
          <div className="plan-grid stagger">
            {plans.map((p, i) => (
              <PlanCard key={p.id} plan={p} featured={i === 1} applyLink={applyLinkFor(p.code)} />
            ))}
            {plans.length === 0 && <div className="empty">Loading plans…</div>}
          </div>
        </div>
      </section>

      {/* --------------------------- ELIGIBILITY --------------------------- */}
      <section className="section section-soft" id="eligibility">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Eligibility</span>
            <h2>Check if you qualify in seconds</h2>
            <p>
              A quick check that suggests a plan based on your monthly income. The result is only
              a suggestion — you are free to apply for any other plan. Final approval is subject
              to assessment.
            </p>
          </div>
          <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
            <form onSubmit={checkEligibility} className="form-grid">
              <div className="field">
                <label htmlFor="income">Monthly income (₹)</label>
                <input
                  id="income"
                  type="number"
                  min="0"
                  placeholder="e.g. 45000"
                  value={elig.income}
                  onChange={(e) => setElig({ ...elig, income: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  min="18"
                  max="90"
                  placeholder="e.g. 32"
                  value={elig.age}
                  onChange={(e) => setElig({ ...elig, age: e.target.value })}
                />
              </div>
              <div className="field full">
                <label htmlFor="emp">Employment type</label>
                <select
                  id="emp"
                  value={elig.employment}
                  onChange={(e) => setElig({ ...elig, employment: e.target.value })}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <button className="btn btn-teal btn-block" type="submit">
                  Check Eligibility
                </button>
              </div>
            </form>
            {eligResult && (
              <div className={`elig-result ${eligResult.ok ? 'elig-yes' : 'elig-no'}`}>
                <div>{eligResult.text}</div>
                {eligResult.ok && eligResult.plan && (
                  <div className="row mt-1">
                    <Link to={applyLinkFor(eligResult.plan.code)} className="btn btn-teal btn-sm">
                      Apply for {eligResult.plan.name} <ArrowRight size={14} />
                    </Link>
                    <a href="#plans" className="btn btn-ghost btn-sm">
                      View all plans
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------- HOW IT WORKS --------------------------- */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>From application to disbursement in four simple steps</h2>
          </div>
          <div className="steps-grid stagger">
            {[
              { t: 'Create your account', d: 'Register with your name, mobile number and email — it takes less than a minute.' },
              { t: 'Fill the application', d: 'Personal, address, employment and loan details — save and continue at any time.' },
              { t: 'Upload your documents', d: 'Securely attach your KYC documents. Your files are encrypted and never shared.' },
              { t: 'Complete payment & track', d: 'Pay securely, then watch your application move through each stage on your dashboard.' },
            ].map((s, i) => (
              <div className="card step-card" key={s.t}>
                <div className="step-num">{i + 1}</div>
                <h3>{s.t}</h3>
                <p className="text-sm text-muted mb-0">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ FEATURES ------------------------------ */}
      <section className="section section-alt">
        <div className="container">
          <div className="features-grid stagger">
            {[
              { icon: <ShieldCheck size={22} />, t: 'Secure by design', d: 'Encrypted sessions, hashed credentials and strict access controls protect your account at every step.' },
              { icon: <FileText size={22} />, t: 'Paperless application', d: 'A guided multi-step form with instant validation — save your progress and finish anytime.' },
              { icon: <IndianRupee size={22} />, t: 'Transparent pricing', d: 'Every charge is disclosed upfront. We never ask for card numbers or PINs over calls or chat.' },
              { icon: <Clock size={22} />, t: 'Real-time tracking', d: 'Follow your application from submission to completion with a live status timeline.' },
              { icon: <Users size={22} />, t: 'Dedicated support', d: 'Reach out any time through the contact form — our team responds within one working day.' },
              { icon: <BadgeCheck size={22} />, t: 'Built for trust', d: 'Clear communication, no hidden terms, and responsible lending practices at the core.' },
            ].map((f) => (
              <div className="card card-hover" key={f.t}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.t}</h3>
                <p className="text-sm text-muted mb-0">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- ABOUT -------------------------------- */}
      <section className="section" id="about">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="section-head">
            <span className="eyebrow">About us</span>
            <h2>Lending built on transparency and trust</h2>
          </div>
          <div className="features-grid mt-3">
            <div className="card">
              <div className="feature-icon"><Target size={22} /></div>
              <h3>Our purpose</h3>
              <p className="text-sm text-muted mb-0">
                Make credit simple, digital and fair — so you can focus on what the money is for,
                not the paperwork.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon"><ShieldCheck size={22} /></div>
              <h3>Our principles</h3>
              <p className="text-sm text-muted mb-0">
                Full fee disclosure, responsible eligibility checks, and the strongest possible
                protection for your personal data.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon"><LifeBuoy size={22} /></div>
              <h3>Our promise</h3>
              <p className="text-sm text-muted mb-0">
                No hidden charges, no pressure tactics, and no upfront fee to release your loan.
                Ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- STATS -------------------------------- */}
      <section className="section section-soft">
        <div className="container">
          <div className="stats-strip">
            <div className="card stat"><strong>3</strong><span>Flexible loan plans</span></div>
            <div className="card stat"><strong>5 min</strong><span>Quick application</span></div>
            <div className="card stat"><strong>100%</strong><span>Digital process</span></div>
            <div className="card stat"><strong>24×7</strong><span>Support assistant</span></div>
          </div>
        </div>
      </section>

      {/* ---------------------------------- FAQ ---------------------------------- */}
      <section className="section" id="faq">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2>Questions, answered</h2>
          </div>
          <Accordion items={STATIC_FAQS} />
        </div>
      </section>

      {/* ------------------------------- SUPPORT -------------------------------- */}
      <section className="section section-soft" id="support">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Customer support</span>
            <h2>We're here to help</h2>
          </div>
          <div className="features-grid">
            <div className="card">
              <div className="feature-icon"><LifeBuoy size={22} /></div>
              <h3>Raise a support ticket</h3>
              <p className="text-sm text-muted">
                Send us a message using the contact form below — our team responds within one
                working day.
              </p>
              <a href="#contact" className="btn btn-ghost btn-sm">Use contact form</a>
            </div>
            <div className="card">
              <div className="feature-icon"><Zap size={22} /></div>
              <h3>Chat with our assistant</h3>
              <p className="text-sm text-muted">
                Use the assistant in the corner for instant answers about plans, documents,
                application status and payments.
              </p>
            </div>
            <div className="card">
              <div className="feature-icon"><Mail size={22} /></div>
              <h3>Contact the team</h3>
              <div className="text-sm text-muted">
                {company?.email && <div>Email: {company.email}</div>}
                {company?.phone && <div>Phone: {company.phone}</div>}
                {company?.supportHours && <div>Hours: {company.supportHours}</div>}
              </div>
              <a href="#contact" className="btn btn-ghost btn-sm">Use contact form</a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- CTA -------------------------------- */}
      <section className="section">
        <div className="container">
          <div
            className="card center"
            style={{
              background: 'linear-gradient(135deg, var(--navy-900), var(--navy-700))',
              color: '#fff',
              padding: '2.8rem 1.5rem',
              border: 'none',
            }}
          >
            <h2 style={{ color: '#fff' }}>Ready to get started?</h2>
            <p style={{ color: 'rgba(255,255,255,0.82)', maxWidth: 520, margin: '0 auto 1.4rem' }}>
              Create your account, apply on a plan that suits you, and track your journey — all in
              one place.
            </p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-teal btn-lg">
                Create your account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                I already have one
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- CONTACT -------------------------------- */}
      <section className="section section-alt" id="contact">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Contact us</span>
            <h2>Send us a message</h2>
            <p>Fill in the form and our team will get back to you within one working day.</p>
          </div>
          <div className="dash-grid" style={{ maxWidth: 980, margin: '0 auto' }}>
            <div className="card">
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={onSubmit} className="form-grid">
                <Field label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} required />
                <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} required />
                <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={onChange} error={errors.phone} hint="10-digit Indian mobile number" required />
                <Field label="Subject" name="subject" value={form.subject} onChange={onChange} error={errors.subject} required />
                <Field label="Message" name="message" type="textarea" value={form.message} onChange={onChange} error={errors.message} required full />
                <div className="field full">
                  <button className="btn btn-teal" type="submit">
                    <Send size={16} /> Submit
                  </button>
                </div>
              </form>
            </div>
            <div className="card">
              <h3>Reach us</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                <li className="row" style={{ alignItems: 'flex-start' }}>
                  <Mail size={18} style={{ color: 'var(--teal-600)', marginTop: 3 }} />
                  <div><strong>Email</strong><div className="text-sm text-muted">{company?.email || '—'}</div></div>
                </li>
                {company?.phone && (
                  <li className="row" style={{ alignItems: 'flex-start' }}>
                    <Phone size={18} style={{ color: 'var(--teal-600)', marginTop: 3 }} />
                    <div><strong>Phone</strong><div className="text-sm text-muted">{company.phone}</div></div>
                  </li>
                )}
                <li className="row" style={{ alignItems: 'flex-start' }}>
                  <Clock size={18} style={{ color: 'var(--teal-600)', marginTop: 3 }} />
                  <div><strong>Support hours</strong><div className="text-sm text-muted">{company?.supportHours || '—'}</div></div>
                </li>
                <li className="row" style={{ alignItems: 'flex-start' }}>
                  <MapPin size={18} style={{ color: 'var(--teal-600)', marginTop: 3 }} />
                  <div><strong>Address</strong><div className="text-sm text-muted">{company?.address || '—'}</div></div>
                </li>
              </ul>
              <div className="divider" />
              <p className="text-sm text-muted mb-0">
                Write to us anytime — we typically respond within one working day during support
                hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
