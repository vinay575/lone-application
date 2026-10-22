import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function DocLayout({ title, updated, intro, children }) {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}>
            <ArrowLeft size={14} /> Back to home
          </Link>
          <h1>{title}</h1>
          {updated && (
            <p style={{ fontSize: '0.85rem', opacity: 0.75 }}>Last updated: {updated}</p>
          )}
          {intro && <p>{intro}</p>}
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ maxWidth: 840 }}>
          <div className="alert alert-info" style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
            <ShieldCheck size={20} style={{ flex: 'none', marginTop: 2 }} />
            <div>
              <strong>About this environment.</strong> LoanLedger currently runs in sandbox mode:
              applications, statuses and payments move through a simulated workflow and no live
              funds are transferred. These documents describe how the platform handles data and
              what you can expect as a borrower.
            </div>
          </div>
          <div className="card doc-body">
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
