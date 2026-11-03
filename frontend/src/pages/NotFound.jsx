import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container center" style={{ maxWidth: 520 }}>
        <h1>404 - Page not found</h1>
        <p className="text-muted">The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-teal">
          Back to home
        </Link>
      </div>
    </section>
  );
}
