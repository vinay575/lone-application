import { Link } from 'react-router-dom';
import DocLayout from '../../components/DocLayout.jsx';

export default function FairPractice() {
  return (
    <DocLayout
      title="Fair Practice & Responsible Lending"
      updated="21 October 2026"
      intro="The principles that guide how we communicate with borrowers."
    >
      <h2>1. Transparency of terms</h2>
      <p>
        Key facts about any product — amount, charges, tenure and total payable — are shown
        clearly before you commit, in plain language.
      </p>

      <h2>2. No hidden charges</h2>
      <p>
        Every fee is disclosed before processing. The processing fee shown on each plan is the
        amount you see at checkout — there are no surprises afterwards.
      </p>

      <h2>3. Responsible eligibility checks</h2>
      <p>
        Eligibility checks on this site are preliminary. Final assessment is always required
        before any loan decision, and we never promise or guarantee approval.
      </p>

      <h2>4. Fair treatment and no mis-selling</h2>
      <ul>
        <li>No pressure tactics, no false urgency, no claims of "guaranteed approval".</li>
        <li>We never ask for your card number, CVV, UPI PIN, banking password or OTP on this website.</li>
        <li>You receive a clear summary of your application and payment at every step.</li>
      </ul>

      <h2>5. Grievance-driven improvement</h2>
      <p>
        Complaints are logged, acknowledged and resolved within stated timelines, and used to
        improve the service. See <Link to="/grievance">Grievance Redressal</Link>.
      </p>

      <h2>6. Data dignity</h2>
      <p>
        Your data is collected only for legitimate purposes, protected, and never sold — as
        described in our <Link to="/privacy">Privacy Policy</Link>.
      </p>

      <h2>7. Responsible lending</h2>
      <p>
        Borrowing is a financial commitment. We encourage you to borrow only what you can repay
        comfortably and to read all terms before proceeding.
      </p>
    </DocLayout>
  );
}
