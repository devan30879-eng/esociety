// ============================================================
// Shared Layout Components: Sidebar + Header
// ============================================================
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  LayoutDashboard, Users, UserCheck, MessageSquare, Building2,
  CreditCard, Bell, AlertTriangle, LogOut, Wifi, WifiOff,
  Shield,
} from 'lucide-react';

// ─── Sidebar Navigation Config ───────────────────────────────
const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Residents & Staff', icon: Users, path: '/admin/users' },
  { label: 'Visitors', icon: UserCheck, path: '/admin/visitors' },
  { label: 'Complaints', icon: MessageSquare, path: '/admin/complaints' },
  { label: 'Facilities', icon: Building2, path: '/admin/facilities' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { label: 'Notices & Events', icon: Bell, path: '/admin/notices' },
  { label: 'Emergency', icon: AlertTriangle, path: '/admin/emergency' },
];

const residentNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/resident/dashboard' },
  { label: 'My Visitors', icon: UserCheck, path: '/resident/visitors' },
  { label: 'My Complaints', icon: MessageSquare, path: '/resident/complaints' },
  { label: 'Book Facilities', icon: Building2, path: '/resident/facilities' },
  { label: 'My Payments', icon: CreditCard, path: '/resident/payments' },
  { label: 'Notices', icon: Bell, path: '/resident/notices' },
  { label: 'Emergency', icon: AlertTriangle, path: '/resident/emergency' },
];

const securityNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/security/dashboard' },
  { label: 'Visitor Entry', icon: UserCheck, path: '/security/visitors' },
  { label: 'Emergency', icon: AlertTriangle, path: '/security/emergency' },
];

// ─── Sidebar Component ────────────────────────────────────────
export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { connected } = useSocket();

  // Select nav items based on user role
  const navItems = user?.role === 'admin' ? adminNav
    : user?.role === 'resident' ? residentNav
    : securityNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🏘️</div>
        <div>
          <div className="logo-text">eSociety</div>
          <div className="logo-sub">Management System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Role badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '0 8px' }}>
          <Shield size={14} color="var(--accent-1)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-1)', fontWeight: 600, textTransform: 'capitalize' }}>
            {user?.role} Panel
          </span>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: User info + Logout */}
      <div className="sidebar-footer">
        {/* Connection indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', marginBottom: 8, fontSize: '0.75rem', color: connected ? '#22c55e' : 'var(--text-muted)' }}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'Live updates active' : 'Connecting...'}
        </div>

        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div className="user-role">{user?.role}{user?.flatNumber ? ` · ${user.flatNumber}` : ''}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

// ─── Top Header Component ─────────────────────────────────────
interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div>
        <div className="header-title">{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtitle}</div>
        )}
      </div>

      <div className="header-actions">
        {/* Welcome message */}
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</strong>
        </span>

        <div className="header-btn" title="Notifications">
          <Bell size={16} />
          <span className="notification-dot" />
        </div>
      </div>
    </header>
  );
};

// ─── Full Layout Wrapper ──────────────────────────────────────
interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={title} subtitle={subtitle} />
        <main className="page-content animate-fade">
          {children}
        </main>
      </div>
    </div>
  );
};
