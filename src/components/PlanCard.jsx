import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { formatINR } from '../lib/format.js';

export default function PlanCard({ plan, featured = false, applyLink }) {
  return (
    <div className={`card card-hover plan-card ${featured ? 'featured' : ''}`}>
      {featured && <span className="plan-badge">Most Popular</span>}
      <span className="plan-code">Plan {plan.code}</span>
      <h3>{plan.name}</h3>
      <p className="text-sm text-muted mb-0">{plan.summary}</p>
      <div className="plan-amount">
        {formatINR(plan.maxAmount)}
        <span className="text-sm text-muted" style={{ fontWeight: 600 }}>
          {' '}up to
        </span>
      </div>
      <div className="plan-unlock">
        <span>Processing fee</span>
        <strong>{formatINR(plan.demoUnlockAmount)}</strong>
        <span>Charged only when you activate the plan</span>
      </div>
      <ul className="plan-features">
        {(plan.features || []).map((f) => (
          <li key={f}>
            <Check size={15} /> {f}
          </li>
        ))}
        <li>
          <Check size={15} /> {plan.tenureMonths}-month tenure
        </li>
        <li>
          <Check size={15} /> {plan.demoRateLabel}
        </li>
      </ul>
      <div className="row" style={{ gap: '0.5rem' }}>
        <Link to={applyLink || `/register?plan=${plan.code}`} className="btn btn-teal btn-block">
          <Sparkles size={16} /> Apply Now
        </Link>
      </div>
    </div>
  );
}
