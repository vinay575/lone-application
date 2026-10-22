import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/#plans', label: 'Loan Plans' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#about', label: 'About Us' },
  { to: '/#support', label: 'Customer Support' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/#contact', label: 'Contact Us' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  // On the home page, scroll smoothly to the section (and re-scroll even if
  // the hash is already active). On other pages, let the Link navigate.
  const onAnchor = (e, to) => {
    close();
    if (pathname === '/') {
      e.preventDefault();
      const hash = to.replace(/^\/?#/, '#');
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', hash);
      }
    }
  };

  // Brand: on home, smooth-scroll back to the very top.
  const onBrand = () => {
    close();
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState(null, '', pathname);
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={onBrand}>
          <span className="brand-mark">LL</span>
          <span>
            LoanLedger
            <small>Smart Lending</small>
          </span>
        </Link>

        <button
          className="nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={(e) => onAnchor(e, l.to)}>
              {l.label}
            </Link>
          ))}
          <div className="nav-cta-mobile">
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="btn btn-primary btn-sm"
                  onClick={close}
                >
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" onClick={close}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-teal btn-sm" onClick={close}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="nav-cta">
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn btn-ghost btn-sm">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button className="btn btn-primary btn-sm" onClick={handleLogout}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-teal btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
