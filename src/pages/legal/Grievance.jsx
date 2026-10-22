import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DocLayout from '../../components/DocLayout.jsx';
import { api } from '../../lib/api.js';

export default function Grievance() {
  const [company, setCompany] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get('/settings/company')
      .then((d) => (d.company ? setCompany(d.company) : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);

  return (
    <DocLayout
      title="Grievance Redressal"
      updated="21 October 2026"
      intro="How to raise — and escalate — a complaint."
    >
      <h2>1. Lodge a complaint</h2>
      <p>Choose whichever is easiest:</p>
      <ul>
        <li>
          <strong>Contact form:</strong> send a message via the{' '}
          <Link to="/#contact">Contact section</Link> on the home page, or use the Customer
          Support section on the <Link to="/#support">home page</Link>.
        </li>
        <li>
          <strong>Assistant:</strong> the floating chat answers common questions instantly.
        </li>
      </ul>

      <h2>2. Contact details</h2>
      {company ? (
        <ul>
          <li><strong>Email:</strong> {company.email}</li>
          {company.phone && <li><strong>Phone:</strong> {company.phone}</li>}
          <li><strong>Hours:</strong> {company.supportHours}</li>
          <li><strong>Address:</strong> {company.address}</li>
        </ul>
      ) : failed ? (
        <p className="text-muted">
          Contact details are unavailable right now — please use the contact form or the floating
          assistant instead.
        </p>
      ) : (
        <p className="text-muted">Loading contact details…</p>
      )}
      <p className="text-sm text-muted">
        These details are maintained by our administrators, so always refer to the values shown
        here rather than any printed material.
      </p>

      <h2>3. Response timelines</h2>
      <ul>
        <li><strong>Acknowledgement:</strong> within 1 working day of your message being received.</li>
        <li><strong>Resolution attempt:</strong> within 3 working days.</li>
      </ul>

      <h2>4. Escalation</h2>
      <p>
        If your complaint is not addressed within the timelines above, contact the grievance
        details listed in section 2 with your application reference number (for example
        LN-2026-00001).
      </p>

      <h2>5. Scope note</h2>
      <p>
        This grievance process covers your experience on this platform (website behaviour, records,
        access issues). See our <Link to="/disclaimer">Disclaimer</Link> for the current sandbox
        scope of the service.
      </p>
    </DocLayout>
  );
}
