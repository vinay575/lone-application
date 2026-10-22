import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Bot,
  Settings,
  Layers,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} />, end: true },
  { to: '/admin/users', label: 'Users', icon: <Users size={16} /> },
  { to: '/admin/applications', label: 'Applications', icon: <FileText size={16} /> },
  { to: '/admin/plans', label: 'Loan Plans', icon: <Layers size={16} /> },
  { to: '/admin/payments', label: 'Payments', icon: <CreditCard size={16} /> },
  { to: '/admin/chatbot', label: 'Chatbot KB', icon: <Bot size={16} /> },
  { to: '/admin/settings', label: 'Settings', icon: <Settings size={16} /> },
];

export default function AdminApp() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-shell">
      <div className={`admin-backdrop ${menuOpen ? 'show' : ''}`} onClick={closeMenu} />

      <aside className={`admin-side ${menuOpen ? 'open' : ''}`}>
        <div className="admin-side-head">
          <strong>Admin menu</strong>
          <button className="admin-side-close" onClick={closeMenu} aria-label="Close admin menu">
            <X size={18} />
          </button>
        </div>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} onClick={closeMenu}>
            {l.icon} {l.label}
          </NavLink>
        ))}
        <button
          className="btn btn-ghost btn-sm admin-logout"
          onClick={() => {
            closeMenu();
            logout();
            navigate('/admin/login');
          }}
        >
          <LogOut size={15} /> Logout ({user?.email?.split('@')[0]})
        </button>
      </aside>

      <div className="admin-content">
        <div className="admin-topbar">
          <button
            className="admin-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle admin menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="admin-topbar-title">LoanLedger Admin</span>
        </div>
        <main className="admin-main">
          <div className="alert alert-info" style={{ marginBottom: '1.2rem' }}>
            Sandbox environment · Payments run through a simulated gateway and no live funds move.
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
