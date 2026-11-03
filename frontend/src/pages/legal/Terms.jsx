import { Link } from 'react-router-dom';
import DocLayout from '../../components/DocLayout.jsx';

export default function Terms() {
  return (
    <DocLayout
      title="Terms & Conditions"
      updated="21 October 2026"
      intro="The terms that apply when you use LoanLedger."
    >
      <h2>1. Nature of this service</h2>
      <p>
        LoanLedger is a digital loan-application platform. This deployment currently runs in{' '}
        <strong>sandbox mode</strong>: the full product workflow — plans, applications, statuses,
        payments and support — is available for evaluation, but no live funds are transferred and
        nothing on this site is an offer of credit. See our{' '}
        <Link to="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>2. Eligibility to use the service</h2>
      <ul>
        <li>You must be at least 18 years old to create an account.</li>
        <li>You agree to provide accurate information and to keep your login credentials confidential.</li>
        <li>While the site is in sandbox mode, please avoid entering sensitive real-world financial data.</li>
      </ul>

      <h2>3. Accounts</h2>
      <ul>
        <li>One account per person.</li>
        <li>You are responsible for activity under your password.</li>
        <li>Administrators may suspend accounts or reset data to maintain the environment.</li>
      </ul>

      <h2>4. Plans and payments</h2>
      <ul>
        <li>Loan amounts, processing fees, rates and tenures shown are illustrative configurations of the platform.</li>
        <li>Checkout is processed by a sandbox gateway. No money is charged, and no card, bank or UPI credentials are requested or processed on this site.</li>
        <li>A successful payment or a "Completed" status <strong>is not</strong> a loan sanction or disbursement.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Present activity on this site as evidence of a real loan or approval.</li>
        <li>Upload another person's data or attempt to misuse the service.</li>
        <li>Probe, breach or overload the service, or access other users' accounts.</li>
        <li>Use the platform to mislead consumers about real financial services.</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        The LoanLedger name, interface, copy and code remain the property of their respective
        owners.
      </p>

      <h2>7. Disclaimers and liability</h2>
      <p>
        The service is provided "as is" without warranties of any kind. To the maximum extent
        permitted by law, we are not liable for losses arising from reliance on data shown in
        sandbox mode. See our <Link to="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may modify these terms or the platform at any time. Continued use after changes means
        you accept the updated terms.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of India, with courts in the user's jurisdiction
        having exclusive venue, except where applicable consumer law provides otherwise.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms: use the <Link to="/#contact">Contact section</Link> on the
        home page or see <Link to="/grievance">Grievance Redressal</Link>.
      </p>
    </DocLayout>
  );
}
