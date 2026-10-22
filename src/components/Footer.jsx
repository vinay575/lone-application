import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function Footer() {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    api
      .get('/settings/company')
      .then((d) => setCompany(d.company))
      .catch(() => setCompany(null));
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand" style={{ marginBottom: '0.6rem' }}>
            <span className="brand-mark">LL</span>
            <span>LoanLedger</span>
          </div>
          <p style={{ fontSize: '0.9rem' }}>
            {company?.tagline || 'Fast, transparent personal loans with a fully digital journey.'}
          </p>
          <p className="demo-note">
            Loans are subject to eligibility and approval. Lending is a privilege, not a promise —
            we never ask for your OTP, PIN or upfront fee to release a loan.
          </p>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/#plans">Loan Plans</Link>
          <Link to="/#how-it-works">How It Works</Link>
          <Link to="/#about">About Us</Link>
          <Link to="/#faq">FAQ</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/dashboard">Customer Dashboard</Link>
          <Link to="/admin/login">Admin Login</Link>
        </div>
        <div className="footer-col footer-support">
          <h4>Support</h4>
          {company?.email && <a href={`mailto:${company.email}`}>{company.email}</a>}
          {company?.phone && <a href={`tel:${company.phone}`}>{company.phone}</a>}
          {company?.supportHours && <p style={{ fontSize: '0.85rem' }}>{company.supportHours}</p>}
          <Link to="/#contact">Contact Us</Link>
          <Link to="/#support">Customer Support</Link>
        </div>
        <div className="footer-col footer-legal">
          <h4>Legal</h4>
          <Link to="/legal">Legal & Compliance</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/disclaimer">Disclaimer</Link>
          <Link to="/fair-practice">Fair Practice</Link>
          <Link to="/grievance">Grievance Redressal</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} LoanLedger. All rights reserved.</span>
        <span className="row" style={{ gap: '1rem' }}>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/disclaimer">Disclaimer</Link>
          <Link to="/grievance">Grievance</Link>
        </span>
        <span>Responsible lending · Secure by design</span>
      </div>
    </footer>
  );
}
