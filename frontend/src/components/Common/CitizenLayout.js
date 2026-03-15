import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NAV_CITIZEN = [
  { to: '/citizen/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/citizen/submit', icon: '➕', label: 'New Complaint' },
  { to: '/citizen/complaints', icon: '📋', label: 'My Complaints' },
  { to: '/citizen/profile', icon: '👤', label: 'Profile' },
];

const NAV_ADMIN = [
  { to: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/admin/complaints', icon: '📋', label: 'All Complaints' },
  { to: '/admin/analytics', icon: '📊', label: 'Analytics' },
  { to: '/admin/users', icon: '👥', label: 'Users', adminOnly: true },
  { to: '/admin/profile', icon: '👤', label: 'Profile' },
];

function Sidebar({ nav, user, unread, onLogout }) {
  return (
    <aside style={sidebarStyles.sidebar}>
      <div style={sidebarStyles.brand}>
        <span style={{ fontSize: 28 }}>🏛️</span>
        <div>
          <div style={sidebarStyles.brandName}>CitizenConnect</div>
          <div style={sidebarStyles.brandRole}>{user?.role?.toUpperCase()}</div>
        </div>
      </div>

      <nav style={sidebarStyles.nav}>
        {nav.filter(n => !n.adminOnly || user?.role === 'admin').map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({ ...sidebarStyles.navItem, ...(isActive ? sidebarStyles.navItemActive : {}) })}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={sidebarStyles.footer}>
        <div style={sidebarStyles.userInfo}>
          <div style={sidebarStyles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={sidebarStyles.userName}>{user?.name}</div>
            <div style={sidebarStyles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button onClick={onLogout} style={sidebarStyles.logoutBtn}>🚪 Logout</button>
      </div>
    </aside>
  );
}

function TopBar({ title, unread, navigate, basePath }) {
  return (
    <header style={topBarStyles.bar}>
      <div style={topBarStyles.title}></div>
      <div style={topBarStyles.actions}>
        <Link to={`${basePath}/notifications`} style={{ position: 'relative', textDecoration: 'none' }}>
          <button style={topBarStyles.notifBtn}>
            🔔
            {unread > 0 && <span style={topBarStyles.badge}>{unread > 9 ? '9+' : unread}</span>}
          </button>
        </Link>
      </div>
    </header>
  );
}

export function CitizenLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    const handler = () => api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    window.addEventListener('complaint_update', handler);
    return () => window.removeEventListener('complaint_update', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={layoutStyles.root}>
      <Sidebar nav={NAV_CITIZEN} user={user} unread={unread} onLogout={handleLogout} />
      <div style={layoutStyles.main}>
        <div style={layoutStyles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    const handler = () => api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    window.addEventListener('admin_complaint_update', handler);
    return () => window.removeEventListener('admin_complaint_update', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={layoutStyles.root}>
      <Sidebar nav={NAV_ADMIN} user={user} unread={unread} onLogout={handleLogout} />
      <div style={layoutStyles.main}>
        <div style={layoutStyles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default CitizenLayout;

const layoutStyles = {
  root: { display: 'flex', minHeight: '100vh', background: '#f9fafb' },
  main: { flex: 1, marginLeft: '260px', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  content: { flex: 1, padding: '32px', maxWidth: 1200 },
};

const sidebarStyles = {
  sidebar: {
    position: 'fixed', left: 0, top: 0, width: 260, height: '100vh',
    background: '#111827', display: 'flex', flexDirection: 'column',
    zIndex: 100, overflowY: 'auto',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px', borderBottom: '1px solid #1f2937' },
  brandName: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: 'white' },
  brandRole: { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, marginTop: 1 },
  nav: { flex: 1, padding: '16px 12px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
    borderRadius: 8, color: '#9ca3af', textDecoration: 'none', fontSize: 14,
    fontWeight: 500, marginBottom: 4, transition: 'all 0.15s',
  },
  navItemActive: { background: '#1a56db', color: 'white' },
  footer: { padding: '16px', borderTop: '1px solid #1f2937' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', background: '#1a56db',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  userName: { color: 'white', fontSize: 13, fontWeight: 600 },
  userEmail: { color: '#6b7280', fontSize: 11, marginTop: 1 },
  logoutBtn: {
    width: '100%', padding: '9px', background: '#1f2937', border: 'none',
    borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontSize: 13, textAlign: 'left',
    transition: 'all 0.15s',
  },
};

const topBarStyles = {
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 60, background: 'white', borderBottom: '1px solid #e5e7eb' },
  title: { fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: '#111827' },
  actions: { display: 'flex', gap: 8 },
  notifBtn: { position: 'relative', padding: '8px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 18 },
  badge: { position: 'absolute', top: 2, right: 2, background: '#ef4444', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
};
