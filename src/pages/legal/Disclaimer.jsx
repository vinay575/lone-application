import { Link } from 'react-router-dom';
import DocLayout from '../../components/DocLayout.jsx';

export default function Disclaimer() {
  return (
    <DocLayout
      title="Disclaimer"
      updated="21 October 2026"
      intro="What you can expect from this website — and what you should always verify independently."
    >
      <h2>1. Sandbox mode</h2>
      <p>
        This deployment currently runs in <strong>sandbox mode</strong>. Applications, statuses and
        payments move through the complete product workflow, but the payment gateway is simulated
        and <strong>no live funds are transferred</strong>. The sandbox exists so the platform can
        be evaluated end to end.
      </p>

      <h2>2. No loan is offered or sanctioned here</h2>
      <ul>
        <li>The loan plans shown (amounts, processing fees, rates and tenures) are illustrative platform configurations, not offers of credit.</li>
        <li>Submitting an application does not create a sanctioned loan, and a "Completed" status is a workflow state — not a loan agreement.</li>
        <li>Approval and disbursement, where offered, are separate regulated processes and are never implied by activity on this site.</li>
      </ul>

      <h2>3. Payments</h2>
      <ul>
        <li>The checkout on this site is processed by a sandbox gateway. Completing it charges nothing and purchases nothing.</li>
        <li>We <strong>never</strong> ask for your card number, CVV, UPI PIN, net-banking password or OTP on this website. Anyone asking for these to "release" a loan is committing fraud.</li>
        <li>A successful payment on this site is not a loan sanction or commitment to lend.</li>
      </ul>

      <h2>4. Amounts, rates and eligibility</h2>
      <p>
        Amounts, indicative rates, tenures and eligibility results shown are illustrative. Any
        eligibility check on this site is preliminary and final assessment is always required.
        Nothing here is a quote, sanction or guaranteed loan amount.
      </p>

      <h2>5. Sample data and documents</h2>
      <p>
        This environment may contain sample accounts and records used for evaluation. Documents you
        upload in sandbox mode are stored securely and are not verified as KYC. Do not treat a
        sandbox upload as a completed KYC step.
      </p>

      <h2>6. Regulatory status</h2>
      <p>
        Nothing on this website claims government endorsement, certification or regulatory
        approval. Before dealing with any lender, verify its registration on the Reserve Bank of
        India's publicly available lists of banks and NBFCs, and never share OTPs, PINs or upfront
        "processing fees" with unknown parties.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about this disclaimer: use the <Link to="/#contact">Contact section</Link> on the
        home page. See also our <Link to="/terms">Terms & Conditions</Link> and{' '}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </DocLayout>
  );
}
