export default function Stepper({ steps, current }) {
  return (
    <div className="stepper" aria-label="Application progress">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`step-item ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}
        >
          <div className="step-bar" />
          <span>
            {i + 1}. {s}
          </span>
        </div>
      ))}
    </div>
  );
}
