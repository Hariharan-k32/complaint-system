import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  'Submitted':'badge-submitted','Under Review':'badge-under-review',
  'In Progress':'badge-in-progress','Resolved':'badge-resolved',
  'Closed':'badge-closed','Rejected':'badge-rejected'
};
const priorityColors = { 'Low':'badge-low','Medium':'badge-medium','High':'badge-high','Urgent':'badge-urgent' };
const STATUS_OPTIONS = ['Submitted','Under Review','In Progress','Resolved','Closed','Rejected'];

export default function ComplaintDetail({ isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '', wouldRecommend: true });
  const [assignForm, setAssignForm] = useState({ staffId: '', departmentId: '' });
  const [statusForm, setStatusForm] = useState({ status: '', comment: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cr] = await Promise.all([
          api.get(`/complaints/${id}`),
        ]);
        setComplaint(cr.data.data);
        setStatusForm({ status: cr.data.data.status, comment: '' });
        setAssignForm({
          staffId: cr.data.data.assignedTo?._id || '',
          departmentId: cr.data.data.department?._id || ''
        });

        // Fetch feedback if resolved/closed
        if (['Resolved','Closed'].includes(cr.data.data.status)) {
          try {
            const fr = await api.get(`/feedback/complaint/${id}`);
            setFeedback(fr.data.data);
          } catch {}
        }

        if (isAdmin) {
          const [sr, dr] = await Promise.all([
            api.get('/users/staff'),
            api.get('/departments')
          ]);
          setStaff(sr.data.data);
          setDepartments(dr.data.data);
        }
      } catch (err) {
        toast.error(err.message);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAdmin, navigate]);

  const handleStatusUpdate = async e => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { data } = await api.patch(`/complaints/${id}/status`, statusForm);
      setComplaint(data.data);
      toast.success('Status updated successfully');
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  const handleAssign = async e => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { data } = await api.patch(`/complaints/${id}/assign`, assignForm);
      setComplaint(data.data);
      toast.success('Complaint assigned successfully');
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  const handleFeedbackSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/feedback', { complaintId: id, ...feedbackForm });
      toast.success('Thank you for your feedback!');
      setShowFeedback(false);
      const { data } = await api.get(`/complaints/${id}`);
      setComplaint(data.data);
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>;
  if (!complaint) return null;

  const canFeedback = !isAdmin && ['Resolved','Closed'].includes(complaint.status) && !feedback;

  return (
    <div className="fade-in">
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm">← Back</button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, color:'#111827' }}>{complaint.title}</h1>
          <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:6 }}>
            <span style={{ fontFamily:'monospace', fontWeight:700, color:'#1a56db', fontSize:13 }}>#{complaint.ticketId}</span>
            <span className={`badge ${statusColors[complaint.status]}`}>{complaint.status}</span>
            <span className={`badge ${priorityColors[complaint.priority]}`}>{complaint.priority}</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="card">
            <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:16 }}>📋 Complaint Details</h3>
            <div style={{ marginBottom:16 }}>
              <div style={labelStyle}>Description</div>
              <p style={{ color:'#374151', lineHeight:1.7, fontSize:14 }}>{complaint.description}</p>
            </div>
            <div className="grid-2" style={{ gap:12 }}>
              <div><div style={labelStyle}>Category</div><div style={valueStyle}>{complaint.category}</div></div>
              <div><div style={labelStyle}>Location</div><div style={valueStyle}>{complaint.location?.address}</div></div>
              <div><div style={labelStyle}>Submitted</div><div style={valueStyle}>{new Date(complaint.createdAt).toLocaleString()}</div></div>
              {complaint.resolvedAt && <div><div style={labelStyle}>Resolved</div><div style={valueStyle}>{new Date(complaint.resolvedAt).toLocaleString()}</div></div>}
              {complaint.citizen && <div><div style={labelStyle}>Citizen</div><div style={valueStyle}>{complaint.citizen.name}</div></div>}
              {complaint.assignedTo && <div><div style={labelStyle}>Assigned To</div><div style={valueStyle}>{complaint.assignedTo.name}</div></div>}
              {complaint.department && <div><div style={labelStyle}>Department</div><div style={valueStyle}>{complaint.department.name}</div></div>}
            </div>
            {complaint.resolutionNote && (
              <div style={{ marginTop:16, padding:12, background:'#f0fdf4', borderRadius:8, borderLeft:'3px solid #10b981' }}>
                <div style={{ fontWeight:600, fontSize:13, color:'#065f46', marginBottom:4 }}>Resolution Note</div>
                <p style={{ fontSize:14, color:'#374151' }}>{complaint.resolutionNote}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {complaint.attachments?.length > 0 && (
            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:16 }}>📎 Attachments</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {complaint.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f9fafb', borderRadius:8, textDecoration:'none', border:'1px solid #e5e7eb' }}>
                    <span>📄</span>
                    <span style={{ flex:1, fontSize:13, color:'#374151' }}>{a.originalname}</span>
                    <span style={{ fontSize:12, color:'#9ca3af' }}>{(a.size/1024).toFixed(0)} KB</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="card">
            <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:16 }}>📅 Status Timeline</h3>
            <div style={{ position:'relative', paddingLeft:24 }}>
              {complaint.statusHistory?.map((h, i) => (
                <div key={i} style={{ position:'relative', paddingBottom: i < complaint.statusHistory.length-1 ? 20 : 0 }}>
                  {i < complaint.statusHistory.length-1 && (
                    <div style={{ position:'absolute', left:-17, top:20, bottom:0, width:2, background:'#e5e7eb' }} />
                  )}
                  <div style={{ position:'absolute', left:-20, top:6, width:8, height:8, borderRadius:'50%', background: i === complaint.statusHistory.length-1 ? '#1a56db' : '#d1d5db' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <span className={`badge ${statusColors[h.status]}`} style={{ marginBottom:4, display:'inline-flex' }}>{h.status}</span>
                      {h.comment && <p style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>{h.comment}</p>}
                      {h.updatedBy && <p style={{ fontSize:12, color:'#9ca3af' }}>by {h.updatedBy.name}</p>}
                    </div>
                    <span style={{ fontSize:12, color:'#9ca3af', whiteSpace:'nowrap' }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Section (Citizen) */}
          {canFeedback && !showFeedback && (
            <div className="card" style={{ background:'#eff6ff', border:'1px solid #bfdbfe' }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:8 }}>⭐ Rate Your Experience</h3>
              <p style={{ color:'#374151', fontSize:14, marginBottom:16 }}>Your complaint has been resolved. Please share your feedback.</p>
              <button onClick={() => setShowFeedback(true)} className="btn btn-primary">Provide Feedback</button>
            </div>
          )}

          {showFeedback && (
            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:16 }}>⭐ Submit Feedback</h3>
              <form onSubmit={handleFeedbackSubmit}>
                <div className="form-group">
                  <label className="form-label">Overall Rating</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setFeedbackForm(p => ({ ...p, rating: n }))}
                        style={{ fontSize:28, background:'none', border:'none', cursor:'pointer', opacity: n <= feedbackForm.rating ? 1 : 0.3 }}>⭐</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Comments</label>
                  <textarea className="form-control" placeholder="Tell us about your experience..." rows={3}
                    value={feedbackForm.comment} onChange={e => setFeedbackForm(p => ({ ...p, comment: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label style={{ display:'flex', gap:10, alignItems:'center', cursor:'pointer' }}>
                    <input type="checkbox" checked={feedbackForm.wouldRecommend} onChange={e => setFeedbackForm(p => ({ ...p, wouldRecommend: e.target.checked }))} />
                    <span style={{ fontSize:14 }}>I would recommend this service to others</span>
                  </label>
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <button type="button" onClick={() => setShowFeedback(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Feedback</button>
                </div>
              </form>
            </div>
          )}

          {feedback && (
            <div className="card" style={{ background:'#f0fdf4', border:'1px solid #6ee7b7' }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:8 }}>⭐ Your Feedback</h3>
              <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize:20, opacity: n <= feedback.rating ? 1 : 0.2 }}>⭐</span>)}
              </div>
              {feedback.comment && <p style={{ fontSize:14, color:'#374151' }}>{feedback.comment}</p>}
            </div>
          )}
        </div>

        {/* Right column - Admin controls */}
        {isAdmin && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:16 }}>🔄 Update Status</h3>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label className="form-label">New Status</label>
                  <select className="form-control" value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Comment / Note</label>
                  <textarea className="form-control" rows={3} placeholder="Add a note about this status change..."
                    value={statusForm.comment} onChange={e => setStatusForm(p => ({ ...p, comment: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width:'100%' }} disabled={updating}>
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:16 }}>👤 Assign Complaint</h3>
              <form onSubmit={handleAssign}>
                <div className="form-group">
                  <label className="form-label">Assign to Staff</label>
                  <select className="form-control" value={assignForm.staffId} onChange={e => setAssignForm(p => ({ ...p, staffId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control" value={assignForm.departmentId} onChange={e => setAssignForm(p => ({ ...p, departmentId: e.target.value }))}>
                    <option value="">No Department</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-success" style={{ width:'100%' }} disabled={updating}>
                  {updating ? 'Assigning...' : 'Assign'}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:12 }}>📊 Complaint Stats</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <InfoRow label="Views" value={complaint.viewCount} />
                <InfoRow label="Category" value={complaint.category} />
                <InfoRow label="Priority" value={complaint.priority} />
                {complaint.resolutionTime && <InfoRow label="Resolution Time" value={`${complaint.resolutionTime}h`} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const InfoRow = ({ label, value }) => (
  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f3f4f6' }}>
    <span style={{ fontSize:13, color:'#6b7280' }}>{label}</span>
    <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{value}</span>
  </div>
);

const labelStyle = { fontSize:12, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 };
const valueStyle = { fontSize:14, color:'#111827' };
