import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const statusColors = {
  'Submitted': 'badge-submitted', 'Under Review': 'badge-under-review',
  'In Progress': 'badge-in-progress', 'Resolved': 'badge-resolved',
  'Closed': 'badge-closed', 'Rejected': 'badge-rejected'
};
const priorityColors = {
  'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high', 'Urgent': 'badge-urgent'
};

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/complaints/my?limit=5'),
      api.get('/notifications?limit=5')
    ]).then(([c, n]) => {
      setComplaints(c.data.data);
      setNotifications(n.data.data);
    }).catch(() => {}).finally(() => setLoading(false));

    const handler = () => api.get('/complaints/my?limit=5').then(r => setComplaints(r.data.data)).catch(() => {});
    window.addEventListener('complaint_update', handler);
    return () => window.removeEventListener('complaint_update', handler);
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  const stats = complaints.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const statCards = [
    { label: 'Total Submitted', value: complaints.length, icon: '📋', color: '#eff6ff', iconBg: '#dbeafe' },
    { label: 'In Progress', value: (stats['In Progress'] || 0) + (stats['Under Review'] || 0), icon: '⚙️', color: '#fdf4ff', iconBg: '#ede9fe' },
    { label: 'Resolved', value: (stats['Resolved'] || 0) + (stats['Closed'] || 0), icon: '✅', color: '#f0fdf4', iconBg: '#dcfce7' },
    { label: 'Pending Review', value: stats['Submitted'] || 0, icon: '⏳', color: '#fefce8', iconBg: '#fef9c3' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Track and manage your service requests in one place</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ background: s.color, border: 'none' }}>
            <div className="stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Complaints</h2>
            <Link to="/citizen/complaints" className="btn btn-outline btn-sm">View All</Link>
          </div>
          {complaints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No complaints yet</h3>
              <p>Submit your first complaint to get started</p>
              <Link to="/citizen/submit" className="btn btn-primary" style={{ marginTop: 16 }}>Submit Complaint</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {complaints.map(c => (
                <Link key={c._id} to={`/citizen/complaints/${c._id}`} style={cardItemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{c.title}</span>
                    <span className={`badge ${statusColors[c.status]}`}>{c.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>#{c.ticketId}</span>
                    <span className={`badge ${priorityColors[c.priority]}`} style={{ padding: '2px 8px', fontSize: 11 }}>{c.priority}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/citizen/submit" className="btn btn-primary" style={{ justifyContent: 'flex-start', padding: '14px 20px' }}>
                ➕ Submit New Complaint
              </Link>
              <Link to="/citizen/complaints" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 20px' }}>
                📋 View All My Complaints
              </Link>
              <Link to="/track" className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '14px 20px' }}>
                🔍 Track by Ticket ID
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🔔 Notifications</h2>
            </div>
            {notifications.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 14 }}>No notifications yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {notifications.map(n => (
                  <div key={n._id} style={{ padding: '12px', background: n.isRead ? '#f9fafb' : '#eff6ff', borderRadius: 8, borderLeft: `3px solid ${n.isRead ? '#e5e7eb' : '#1a56db'}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const cardItemStyle = {
  display: 'block', padding: '14px', background: '#f9fafb', borderRadius: 8,
  textDecoration: 'none', border: '1px solid #e5e7eb', transition: 'all 0.15s',
  cursor: 'pointer',
};
