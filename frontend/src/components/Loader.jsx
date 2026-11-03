export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="spinner" />
      <p className="text-muted text-sm" style={{ marginTop: '0.8rem' }}>
        {label}
      </p>
    </div>
  );
}
