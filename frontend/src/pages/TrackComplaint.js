import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const statusColors = {
  'Submitted':'badge-submitted','Under Review':'badge-under-review',
  'In Progress':'badge-in-progress','Resolved':'badge-resolved',
  'Closed':'badge-closed','Rejected':'badge-rejected'
};

export default function TrackComplaint() {
  const [ticketId, setTicketId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async e => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setLoading(true); setError(''); setComplaint(null);
    try {
      const { data } = await api.get(`/complaints/track/${ticketId.trim().toUpperCase()}`);
      setComplaint(data.data);
    } catch (err) {
      setError('No complaint found with this Ticket ID. Please check and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a56db 0%,#0e9f6e 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:40, width:'100%', maxWidth:600, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <h1 style={{ fontFamily:'Syne', fontSize:26, fontWeight:800, color:'#111827', marginBottom:8 }}>Track Your Complaint</h1>
          <p style={{ color:'#6b7280', fontSize:14 }}>Enter your Ticket ID to get real-time status updates</p>
        </div>

        <form onSubmit={handleSearch}>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <input
              className="form-control"
              placeholder="e.g. TKT-M5XY2R-A1B2"
              value={ticketId}
              onChange={e => setTicketId(e.target.value)}
              style={{ flex:1, fontFamily:'monospace', fontSize:15, letterSpacing:1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace:'nowrap' }}>
              {loading ? '...' : 'Track →'}
            </button>
          </div>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {complaint && (
          <div className="fade-in">
            <div style={{ background:'#f9fafb', borderRadius:12, padding:20, border:'1px solid #e5e7eb' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:'monospace', color:'#1a56db', fontWeight:700, fontSize:13, marginBottom:4 }}>#{complaint.ticketId}</div>
                  <h3 style={{ fontWeight:700, color:'#111827', fontSize:16 }}>{complaint.title}</h3>
                </div>
                <span className={`badge ${statusColors[complaint.status]}`}>{complaint.status}</span>
              </div>

              <div style={{ display:'flex', gap:20, marginBottom:16 }}>
                <div><span style={{ fontSize:12, color:'#9ca3af' }}>Category</span><div style={{ fontSize:13, fontWeight:600 }}>{complaint.category}</div></div>
                <div><span style={{ fontSize:12, color:'#9ca3af' }}>Location</span><div style={{ fontSize:13, fontWeight:600 }}>{complaint.location?.address}</div></div>
                <div><span style={{ fontSize:12, color:'#9ca3af' }}>Submitted</span><div style={{ fontSize:13, fontWeight:600 }}>{new Date(complaint.createdAt).toLocaleDateString()}</div></div>
              </div>

              <h4 style={{ fontWeight:700, color:'#374151', marginBottom:12, fontSize:13, textTransform:'uppercase', letterSpacing:0.5 }}>Status Timeline</h4>
              <div style={{ position:'relative', paddingLeft:20 }}>
                {complaint.statusHistory?.map((h, i) => (
                  <div key={i} style={{ position:'relative', paddingBottom: i < complaint.statusHistory.length-1 ? 16 : 0 }}>
                    {i < complaint.statusHistory.length-1 && (
                      <div style={{ position:'absolute', left:-13, top:18, bottom:0, width:2, background:'#e5e7eb' }} />
                    )}
                    <div style={{ position:'absolute', left:-16, top:5, width:8, height:8, borderRadius:'50%', background: i === complaint.statusHistory.length-1 ? '#1a56db' : '#d1d5db' }} />
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <div>
                        <span className={`badge ${statusColors[h.status]}`} style={{ marginBottom:2, display:'inline-flex' }}>{h.status}</span>
                        {h.comment && <p style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{h.comment}</p>}
                      </div>
                      <span style={{ fontSize:12, color:'#9ca3af' }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:24, color:'#9ca3af', fontSize:13 }}>
          <Link to="/login" style={{ color:'#1a56db', fontWeight:600, textDecoration:'none' }}>Sign in</Link> for full complaint management
        </div>
      </div>
    </div>
  );
}
