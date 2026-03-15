import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['','Roads & Infrastructure','Water Supply','Electricity','Sanitation','Public Safety','Healthcare','Education','Transportation','Environment','Other'];
const STATUSES = ['','Submitted','Under Review','In Progress','Resolved','Closed','Rejected'];
const PRIORITIES = ['','Low','Medium','High','Urgent'];

const statusColors = {
  'Submitted':'badge-submitted','Under Review':'badge-under-review',
  'In Progress':'badge-in-progress','Resolved':'badge-resolved',
  'Closed':'badge-closed','Rejected':'badge-rejected'
};
const priorityColors = { 'Low':'badge-low','Medium':'badge-medium','High':'badge-high','Urgent':'badge-urgent' };

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status:'', category:'', priority:'', search:'', page:1 });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      params.set('limit', '15');
      const { data } = await api.get(`/complaints?${params}`);
      setComplaints(data.data);
      setPagination(data.pagination);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);
  useEffect(() => {
    const handler = () => fetchComplaints();
    window.addEventListener('admin_complaint_update', handler);
    return () => window.removeEventListener('admin_complaint_update', handler);
  }, [fetchComplaints]);

  const handleFilter = (key, val) => setFilters(p => ({ ...p, [key]: val, page: 1 }));
  const handleSearch = e => { e.preventDefault(); fetchComplaints(); };

  const handleQuickStatus = async (id, status) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchComplaints();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>All Complaints</h1>
        <p>Manage and track all citizen complaints and service requests</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:20, padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <form onSubmit={handleSearch} style={{ flex:1, minWidth:200 }}>
            <input className="form-control" placeholder="🔍 Search by title, ticket ID..." value={filters.search}
              onChange={e => handleFilter('search', e.target.value)} />
          </form>
          <select className="form-control" style={{ width:160 }} value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width:180 }} value={filters.category} onChange={e => handleFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-control" style={{ width:140 }} value={filters.priority} onChange={e => handleFilter('priority', e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filters.status || filters.category || filters.priority || filters.search) && (
            <button onClick={() => setFilters({ status:'', category:'', priority:'', search:'', page:1 })} className="btn btn-secondary btn-sm">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {['Submitted','Under Review','In Progress','Resolved'].map(s => (
          <button key={s} onClick={() => handleFilter('status', filters.status === s ? '' : s)}
            className={`badge ${statusColors[s]}`}
            style={{ border:'none', cursor:'pointer', padding:'6px 14px', fontSize:13, fontWeight:600 }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
      ) : complaints.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">📭</div><h3>No complaints found</h3><p>Try adjusting your filters.</p></div></div>
      ) : (
        <div className="card" style={{ padding:0 }}>
          <div className="table-wrap" style={{ border:'none', borderRadius:0 }}>
            <table>
              <thead>
                <tr>
                  <th>Ticket</th><th>Title</th><th>Citizen</th><th>Category</th>
                  <th>Priority</th><th>Status</th><th>Assigned</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c._id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#1a56db' }}>{c.ticketId}</span></td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13, color:'#111827', maxWidth:200 }}>{c.title}</div>
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{c.location?.address?.slice(0,30)}{c.location?.address?.length > 30 ? '…' : ''}</div>
                    </td>
                    <td>
                      <div style={{ fontSize:13, fontWeight:500 }}>{c.citizen?.name}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{c.citizen?.email}</div>
                    </td>
                    <td style={{ fontSize:12 }}>{c.category}</td>
                    <td><span className={`badge ${priorityColors[c.priority]}`}>{c.priority}</span></td>
                    <td>
                      <select
                        value={c.status}
                        onChange={e => handleQuickStatus(c._id, e.target.value)}
                        className={`badge ${statusColors[c.status]}`}
                        style={{ border:'none', cursor:'pointer', fontWeight:600, fontSize:12 }}
                      >
                        {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize:12, color: c.assignedTo ? '#111827' : '#9ca3af' }}>
                      {c.assignedTo?.name || '—'}
                    </td>
                    <td style={{ fontSize:12, color:'#9ca3af', whiteSpace:'nowrap' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/admin/complaints/${c._id}`} className="btn btn-outline btn-sm">Manage</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination" style={{ padding:'16px 0' }}>
              <button onClick={() => handleFilter('page', filters.page - 1)} disabled={filters.page === 1}>← Prev</button>
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => handleFilter('page', p)} className={filters.page === p ? 'active' : ''}>{p}</button>
              ))}
              <button onClick={() => handleFilter('page', filters.page + 1)} disabled={filters.page === pagination.pages}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
