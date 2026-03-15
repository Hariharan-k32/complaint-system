import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = user ? (user.role === 'citizen' ? '/citizen/dashboard' : '/admin/dashboard') : '/login';

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:20, textAlign:'center' }}>
      <div style={{ fontSize:80, marginBottom:16 }}>🏛️</div>
      <h1 style={{ fontFamily:'Syne', fontSize:48, fontWeight:800, color:'#111827', marginBottom:8 }}>404</h1>
      <h2 style={{ fontSize:22, fontWeight:600, color:'#374151', marginBottom:12 }}>Page Not Found</h2>
      <p style={{ color:'#6b7280', fontSize:16, marginBottom:32, maxWidth:400 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display:'flex', gap:12 }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-lg">← Go Back</button>
        <Link to={home} className="btn btn-primary btn-lg">🏠 Go Home</Link>
      </div>
    </div>
  );
}
