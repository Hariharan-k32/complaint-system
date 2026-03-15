import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_OPTIONS = ['All','Submitted','Under Review','In Progress','Resolved','Closed','Rejected'];
const statusColors = {
  'Submitted':'badge-submitted','Under Review':'badge-under-review',
  'In Progress':'badge-in-progress','Resolved':'badge-resolved',
  'Closed':'badge-closed','Rejected':'badge-rejected'
};
const priorityColors = { 'Low':'badge-low','Medium':'badge-medium','High':'badge-high','Urgent':'badge-urgent' };

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filter !== 'All') params.append('status', filter);
      const { data } = await api.get(`/complaints/my?${params}`);
      setComplaints(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [filter, page]);
  useEffect(() => {
    const handler = () => fetchComplaints();
    window.addEventListener('complaint_update', handler);
    return () => window.removeEventListener('complaint_update', handler);
  }, [filter, page]);

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>My Complaints</h1>
          <p>Track and manage all your submitted requests</p>
        </div>
        <Link to="/citizen/submit" className="btn btn-primary">➕ New Complaint</Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            style={{
              padding: '7px 16px', border: 'none', borderRadius: 20, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              background: filter === s ? '#1a56db' : '#f3f4f6',
              color: filter === s ? 'white' : '#6b7280',
            }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : complaints.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No complaints found</h3>
            <p>{filter === 'All' ? 'You haven\'t submitted any complaints yet.' : `No complaints with status "${filter}".`}</p>
            {filter === 'All' && <Link to="/citizen/submit" className="btn btn-primary" style={{ marginTop: 16 }}>Submit Your First Complaint</Link>}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c._id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#1a56db' }}>{c.ticketId}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.location?.address?.slice(0, 40)}...</div>
                    </td>
                    <td><span style={{ fontSize: 13, color: '#374151' }}>{c.category}</span></td>
                    <td><span className={`badge ${priorityColors[c.priority]}`}>{c.priority}</span></td>
                    <td><span className={`badge ${statusColors[c.status]}`}>{c.status}</span></td>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/citizen/complaints/${c._id}`} className="btn btn-outline btn-sm">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={page === p ? 'active' : ''}>{p}</button>
              ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
