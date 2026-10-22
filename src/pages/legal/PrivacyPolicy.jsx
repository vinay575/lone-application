import { Link } from 'react-router-dom';
import DocLayout from '../../components/DocLayout.jsx';

export default function PrivacyPolicy() {
  return (
    <DocLayout
      title="Privacy Policy"
      updated="21 October 2026"
      intro="How LoanLedger collects, stores and protects your data."
    >
      <h2>1. Who we are</h2>
      <p>
        LoanLedger is a digital loan-application platform. References to "we", "us" and "our"
        in this policy mean the operators of this platform. This deployment currently runs in
        sandbox mode.
      </p>

      <h2>2. What we collect</h2>
      <p>When you create an account or use the application flow, the following may be stored:</p>
      <ul>
        <li><strong>Account details:</strong> full name, mobile number, email address.</li>
        <li><strong>Password:</strong> stored only as a salted cryptographic hash (bcrypt). Your plain-text password is never stored or logged.</li>
        <li><strong>Application answers:</strong> date of birth, address, employment type, monthly income, requested amount and loan purpose.</li>
        <li><strong>Documents:</strong> files you upload in the PAN, Aadhaar and photograph slots.</li>
        <li><strong>Support content:</strong> assistant questions.</li>
        <li><strong>Payment records:</strong> sandbox payment entries (no real payment data).</li>
      </ul>

      <h2>3. What we never collect</h2>
      <ul>
        <li>No bank account numbers, card numbers, CVV, UPI IDs or UPI PINs — no page on this site asks for them.</li>
        <li>No OTPs are requested or processed.</li>
        <li>No credit bureau data.</li>
      </ul>

      <h2>4. Where data is stored</h2>
      <ul>
        <li>Account and application records are stored in the platform's database (currently TiDB Cloud MySQL).</li>
        <li>Uploaded documents are stored as files on the application server, encrypted in transit.</li>
        <li>Nothing you enter is transmitted to advertising, analytics, KYC or credit-scoring services.</li>
      </ul>

      <h2>5. Session handling</h2>
      <p>
        After login, a signed session token is kept in your browser so the platform recognises
        you. It expires automatically (12 hours). The site sets no advertising or tracking
        cookies. Logging out or clearing browser storage ends your session.
      </p>

      <h2>6. Why data is used</h2>
      <ul>
        <li>To run your journey: registration → application → payment → status tracking.</li>
        <li>To operate support workflows and respond to your queries.</li>
        <li>To answer common questions through the assistant.</li>
      </ul>
      <p>We do not use your data for marketing, profiling or automated decision-making.</p>

      <h2>7. Retention and deletion</h2>
      <p>
        Records are retained while your account is active. To have your account and records
        removed, contact us (see <Link to="/grievance">Grievance Redressal</Link>) and we will
        process the request within a reasonable period.
      </p>

      <h2>8. Sharing</h2>
      <p>
        No personal data is sold, rented or shared with third parties. The database is accessible
        only to platform administrators.
      </p>

      <h2>9. Your choices</h2>
      <ul>
        <li>Logout or clear local storage to end your session.</li>
        <li>Request a copy of, or deletion of, your records at any time via the contact details below.</li>
      </ul>

      <h2>10. Contact</h2>
      <p>
        Privacy questions: use the Contact section on the{' '}
        <Link to="/#contact">home page</Link> or the details listed in{' '}
        <Link to="/grievance">Grievance Redressal</Link>.
      </p>
    </DocLayout>
  );
}
