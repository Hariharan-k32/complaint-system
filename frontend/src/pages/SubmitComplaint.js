import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Roads & Infrastructure','Water Supply','Electricity','Sanitation','Public Safety','Healthcare','Education','Transportation','Environment','Other'];
const PRIORITIES = ['Low','Medium','High','Urgent'];

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'Medium',
    location: { address: '', city: '', state: '' }
  });

  const onDrop = useCallback(accepted => {
    setFiles(prev => [...prev, ...accepted].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [], 'application/pdf': [] },
    maxSize: 10000000, maxFiles: 5
  });

  const handleChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('loc_')) {
      setForm(p => ({ ...p, location: { ...p.location, [name.replace('loc_', '')]: value } }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.location.address) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'location') fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      files.forEach(f => fd.append('attachments', f));

      const { data } = await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Complaint submitted! Ticket: ${data.data.ticketId}`);
      navigate('/citizen/complaints');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Submit a Complaint</h1>
        <p>Describe your issue and we'll work to resolve it promptly</p>
      </div>

      <div style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 20, color: '#111827' }}>📝 Complaint Details</h3>

            <div className="form-group">
              <label className="form-label">Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input name="title" className="form-control" placeholder="Brief summary of your complaint" value={form.title} onChange={handleChange} required maxLength={200} />
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{form.title.length}/200</div>
            </div>

            <div className="form-group">
              <label className="form-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea name="description" className="form-control" placeholder="Provide detailed information about the issue, including when it started and how it affects you..." value={form.description} onChange={handleChange} required maxLength={2000} rows={5} />
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{form.description.length}/2000</div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="category" className="form-control" value={form.category} onChange={handleChange} required>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select name="priority" className="form-control" value={form.priority} onChange={handleChange}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 20, color: '#111827' }}>📍 Location</h3>
            <div className="form-group">
              <label className="form-label">Street Address <span style={{ color: '#ef4444' }}>*</span></label>
              <input name="loc_address" className="form-control" placeholder="123 Main Street" value={form.location.address} onChange={handleChange} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">City</label>
                <input name="loc_city" className="form-control" placeholder="City" value={form.location.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input name="loc_state" className="form-control" placeholder="State" value={form.location.state} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 20, color: '#111827' }}>📎 Attachments</h3>
            <div {...getRootProps()} style={{ ...dropzoneStyle, ...(isDragActive ? { borderColor: '#1a56db', background: '#eff6ff' } : {}) }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
              <p style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>or click to browse • Images & PDFs • Max 10MB each • Up to 5 files</p>
            </div>
            {files.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <span>📄</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{f.name}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary btn-lg">Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
              {loading ? '⏳ Submitting...' : '🚀 Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const dropzoneStyle = {
  border: '2px dashed #d1d5db', borderRadius: 12, padding: '40px 20px',
  textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
};
