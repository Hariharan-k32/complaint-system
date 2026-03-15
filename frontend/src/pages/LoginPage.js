import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'citizen' ? '/citizen/dashboard' : '/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@system.com', password: 'Password123!' },
      staff: { email: 'staff@system.com', password: 'Password123!' },
      citizen: { email: 'citizen@system.com', password: 'Password123!' },
    };
    setForm(creds[role]);
  };

  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <div style={styles.brand}>
          <div style={styles.logo}>🏛️</div>
          <h1 style={styles.brandName}>CitizenConnect</h1>
          <p style={styles.brandTagline}>Smart Complaint Management System</p>
        </div>
        <div style={styles.features}>
          {['🔍 Real-time complaint tracking', '📊 Analytics dashboard', '⚡ Instant notifications', '🔒 Secure & transparent'].map((f, i) => (
            <div key={i} style={styles.feature}>{f}</div>
          ))}
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <h2 style={styles.title}>Welcome back</h2>
          <p style={styles.subtitle}>Sign in to your account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input name="password" type="password" className="form-control" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={styles.divider}><span>Demo Accounts</span></div>
          <div style={styles.demoButtons}>
            {['admin', 'staff', 'citizen'].map(role => (
              <button key={role} onClick={() => fillDemo(role)} style={styles.demoBtn} className="btn btn-outline btn-sm">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          <p style={styles.switchLink}>
            Don't have an account? <Link to="/register" style={styles.link}>Create one</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 8 }}>
            <Link to="/track" style={styles.link}>Track complaint without login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh' },
  leftPanel: {
    flex: 1, background: 'linear-gradient(135deg, #1a56db 0%, #0e9f6e 100%)',
    padding: '60px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    color: 'white',
  },
  brand: { marginBottom: 60 },
  logo: { fontSize: 56, marginBottom: 16 },
  brandName: { fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 8 },
  brandTagline: { fontSize: 16, opacity: 0.85 },
  features: { display: 'flex', flexDirection: 'column', gap: 16 },
  feature: { fontSize: 16, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 8 },
  rightPanel: {
    width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px', background: '#f9fafb'
  },
  formCard: { background: 'white', padding: '40px', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 6 },
  subtitle: { color: '#6b7280', marginBottom: 28, fontSize: 15 },
  divider: { textAlign: 'center', margin: '24px 0', position: 'relative', color: '#9ca3af', fontSize: 13 },
  demoButtons: { display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'center' },
  demoBtn: { flex: 1, textTransform: 'capitalize' },
  switchLink: { textAlign: 'center', color: '#6b7280', fontSize: 14, marginTop: 16 },
  link: { color: '#1a56db', fontWeight: 600, textDecoration: 'none' },
};
