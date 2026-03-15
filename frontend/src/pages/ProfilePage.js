import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    address: { street: user?.address?.street || '', city: user?.address?.city || '', state: user?.address?.state || '' }
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleProfileChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('addr_')) {
      setProfileForm(p => ({ ...p, address: { ...p.address, [name.replace('addr_', '')]: value } }));
    } else {
      setProfileForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      updateUser(data.data);
      toast.success('Profile updated successfully');
    } catch (err) { toast.error(err.message); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) { toast.error('Passwords do not match'); return; }
    if (passForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSavingPass(true);
    try {
      await api.put('/auth/password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password updated successfully');
    } catch (err) { toast.error(err.message); }
    finally { setSavingPass(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth:680 }}>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information and security settings</p>
      </div>

      {/* User card */}
      <div className="card" style={{ marginBottom:20, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#1a56db,#0e9f6e)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Syne', fontWeight:800, fontSize:28 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily:'Syne', fontSize:20, fontWeight:800, color:'#111827' }}>{user?.name}</div>
          <div style={{ color:'#6b7280', fontSize:14 }}>{user?.email}</div>
          <div style={{ marginTop:6 }}>
            <span style={{ padding:'3px 12px', background: user?.role === 'admin' ? '#fef3c7' : user?.role === 'staff' ? '#ede9fe' : '#eff6ff', color: user?.role === 'admin' ? '#92400e' : user?.role === 'staff' ? '#5b21b6' : '#1d4ed8', borderRadius:20, fontSize:12, fontWeight:700, textTransform:'capitalize' }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:20 }}>Personal Information</h3>
        <form onSubmit={handleProfileSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" className="form-control" value={profileForm.name} onChange={handleProfileChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input name="phone" className="form-control" value={profileForm.phone} onChange={handleProfileChange} placeholder="+1 555 0000" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input name="addr_street" className="form-control" value={profileForm.address.street} onChange={handleProfileChange} placeholder="123 Main St" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">City</label>
              <input name="addr_city" className="form-control" value={profileForm.address.city} onChange={handleProfileChange} />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input name="addr_state" className="form-control" value={profileForm.address.state} onChange={handleProfileChange} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : '💾 Save Profile'}
          </button>
        </form>
      </div>

      {/* Password Form */}
      <div className="card">
        <h3 style={{ fontFamily:'Syne', fontWeight:700, marginBottom:20 }}>🔒 Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-control" value={passForm.currentPassword} onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" value={passForm.newPassword} onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 8 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" value={passForm.confirm} onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingPass}>
            {savingPass ? 'Updating...' : '🔑 Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
