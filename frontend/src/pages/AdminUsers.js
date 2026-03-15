import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ROLES = ['citizen','staff','admin'];
const roleColors = { citizen:'badge-submitted', staff:'badge-in-progress', admin:'badge-urgent' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [editUser, setEditUser] = useState(null);
  const [departments, setDepartments] = useState([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);
  useEffect(() => { api.get('/departments').then(r => setDepartments(r.data.data)).catch(() => {}); }, []);

  const handleSearch = e => { e.preventDefault(); setPage(1); fetchUsers(); };

  const handleUpdateUser = async e => {
    e.preventDefault();
    try {
      await api.put(`/users/${editUser._id}`, {
        name: editUser.name, role: editUser.role,
        department: editUser.department, isActive: editUser.isActive
      });
      toast.success('User updated');
      setEditUser(null);
      fetchUsers();
    } catch (err) { toast.error(err.message); }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage citizens, staff, and administrators</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:20, padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <form onSubmit={handleSearch} style={{ flex:1, minWidth:200 }}>
            <input className="form-control" placeholder="🔍 Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </form>
          {ROLES.map(r => (
            <button key={r} onClick={() => { setRoleFilter(roleFilter === r ? '' : r); setPage(1); }}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform:'capitalize' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding:0 }}>
          <div className="table-wrap" style={{ border:'none' }}>
            <table>
              <thead>
                <tr>
                  <th>User</th><th>Role</th><th>Department</th><th>Phone</th><th>Last Login</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'#1a56db', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:13, flexShrink:0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13, color:'#111827' }}>{u.name}</div>
                          <div style={{ fontSize:11, color:'#9ca3af' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${roleColors[u.role]}`} style={{ textTransform:'capitalize' }}>{u.role}</span></td>
                    <td style={{ fontSize:13, color: u.department ? '#374151' : '#9ca3af' }}>{u.department?.name || '—'}</td>
                    <td style={{ fontSize:13, color:'#6b7280' }}>{u.phone || '—'}</td>
                    <td style={{ fontSize:12, color:'#9ca3af' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <span style={{ fontSize:12, fontWeight:600, color: u.isActive ? '#059669' : '#dc2626' }}>
                        {u.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => setEditUser({ ...u, department: u.department?._id || '' })} className="btn btn-outline btn-sm">Edit</button>
                        <button onClick={() => handleToggleActive(u)} className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="pagination" style={{ padding:'16px 0' }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={page === p ? 'active' : ''}>{p}</button>
              ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={modalOverlay} onClick={() => setEditUser(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:18 }}>Edit User</h3>
              <button onClick={() => setEditUser(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={editUser.name} onChange={e => setEditUser(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={editUser.role} onChange={e => setEditUser(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r} style={{ textTransform:'capitalize' }}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={editUser.department} onChange={e => setEditUser(p => ({ ...p, department: e.target.value }))}>
                  <option value="">None</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display:'flex', gap:10, alignItems:'center', cursor:'pointer' }}>
                  <input type="checkbox" checked={editUser.isActive} onChange={e => setEditUser(p => ({ ...p, isActive: e.target.checked }))} />
                  <span style={{ fontSize:14 }}>Account Active</span>
                </label>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button type="button" onClick={() => setEditUser(null)} className="btn btn-secondary" style={{ flex:1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 };
const modalBox = { background:'white', borderRadius:16, padding:28, width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' };
