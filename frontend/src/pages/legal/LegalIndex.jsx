import { Link } from 'react-router-dom';
import { FileText, Lock, Scale, AlertTriangle, HeartHandshake, LifeBuoy, ChevronRight } from 'lucide-react';
import DocLayout from '../../components/DocLayout.jsx';

const DOCS = [
  { to: '/privacy', icon: <Lock size={20} />, title: 'Privacy Policy', d: 'What data we store, where it lives, and your choices.' },
  { to: '/terms', icon: <Scale size={20} />, title: 'Terms & Conditions', d: 'The rules for using this website.' },
  { to: '/disclaimer', icon: <AlertTriangle size={20} />, title: 'Disclaimer', d: 'What to expect from the service — and what to verify independently.' },
  { to: '/fair-practice', icon: <HeartHandshake size={20} />, title: 'Fair Practice & Responsible Lending', d: 'The principles that guide how we treat borrowers.' },
  { to: '/grievance', icon: <LifeBuoy size={20} />, title: 'Grievance Redressal', d: 'How to raise and escalate complaints.' },
];

export default function LegalIndex() {
  return (
    <DocLayout
      title="Legal & Compliance"
      updated="21 October 2026"
      intro="All legal documents for LoanLedger in one place."
    >
      <p>
        We keep our legal documentation transparent so you always understand how the platform
        works, how your data is handled, and how to reach us.
      </p>
      <div style={{ display: 'grid', gap: '0.8rem', marginTop: '1.2rem' }}>
        {DOCS.map((doc) => (
          <Link
            key={doc.to}
            to={doc.to}
            className="card card-hover"
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', textDecoration: 'none' }}
          >
            <div className="feature-icon" style={{ marginBottom: 0, flex: 'none' }}>{doc.icon}</div>
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--navy-900)' }}>{doc.title}</strong>
              <div className="text-sm text-muted">{doc.d}</div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--muted)' }} />
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted" style={{ marginTop: '1.4rem' }}>
        <FileText size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
        These documents describe the current sandbox deployment and should be reviewed for your
        jurisdiction before production use.
      </p>
    </DocLayout>
  );
}
