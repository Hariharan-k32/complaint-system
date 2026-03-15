import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const statusColors = {
  'Submitted':'badge-submitted','Under Review':'badge-under-review',
  'In Progress':'badge-in-progress','Resolved':'badge-resolved',
  'Closed':'badge-closed','Rejected':'badge-rejected'
};
const priorityColors = { 'Low':'badge-low','Medium':'badge-medium','High':'badge-high','Urgent':'badge-urgent' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [s, t] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/trends?period=30d')
      ]);
      setStats(s.data.data);
      setTrends(t.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    const handler = () => fetchStats();
    window.addEventListener('admin_complaint_update', handler);
    return () => window.removeEventListener('admin_complaint_update', handler);
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner" /></div>;
  if (!stats) return null;

  const { overview, statusBreakdown, categoryBreakdown, priorityBreakdown, monthlyTrend, recentComplaints } = stats;

  const statusChartData = {
    labels: Object.keys(statusBreakdown),
    datasets: [{
      data: Object.values(statusBreakdown),
      backgroundColor: ['#3b82f6','#f59e0b','#8b5cf6','#10b981','#6b7280','#ef4444'],
      borderWidth: 0,
    }]
  };

  const categoryChartData = {
    labels: categoryBreakdown.slice(0, 6).map(c => c._id.length > 15 ? c._id.slice(0,15)+'…' : c._id),
    datasets: [{
      label: 'Complaints',
      data: categoryBreakdown.slice(0, 6).map(c => c.count),
      backgroundColor: '#1a56db',
      borderRadius: 6,
    }]
  };

  const trendChartData = {
    labels: trends.map(t => t._id),
    datasets: [
      {
        label: 'Submitted',
        data: trends.map(t => t.count),
        borderColor: '#1a56db',
        backgroundColor: 'rgba(26,86,219,0.1)',
        fill: true, tension: 0.4,
      },
      {
        label: 'Resolved',
        data: trends.map(t => t.resolved),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true, tension: 0.4,
      }
    ]
  };

  const statCards = [
    { label: 'Total Complaints', value: overview.total, icon: '📋', color: '#eff6ff', delta: `+${overview.thisMonth} this month` },
    { label: 'Resolution Rate', value: `${overview.resolutionRate}%`, icon: '✅', color: '#f0fdf4', delta: `Avg ${overview.avgResolutionHours}h resolution` },
    { label: 'Avg Satisfaction', value: `${overview.avgRating}/5`, icon: '⭐', color: '#fefce8', delta: `${overview.totalFeedback} reviews` },
    { label: 'Total Citizens', value: overview.totalUsers, icon: '👥', color: '#fdf4ff', delta: 'Registered users' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Real-time overview of all complaints and service requests</p>
        </div>
        <Link to="/admin/complaints" className="btn btn-primary">View All Complaints →</Link>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ background:s.color, border:'none' }}>
            <div className="stat-icon" style={{ background:'white', fontSize:22 }}>{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-delta positive">{s.delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Status Distribution</h2>
          </div>
          <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Doughnut data={statusChartData} options={{ plugins:{ legend:{ position:'right', labels:{ boxWidth:12, font:{ size:12 } } } }, maintainAspectRatio:false }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Complaints by Category</h2>
          </div>
          <div style={{ height:220 }}>
            <Bar data={categoryChartData} options={{ indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } } }, maintainAspectRatio:false }} />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card" style={{ marginBottom:24 }}>
        <div className="card-header">
          <h2 className="card-title">30-Day Trend</h2>
        </div>
        <div style={{ height:220 }}>
          <Line data={trendChartData} options={{ plugins:{ legend:{ position:'top' } }, scales:{ y:{ beginAtZero:true, grid:{ color:'#f3f4f6' } }, x:{ grid:{ display:false } } }, maintainAspectRatio:false }} />
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="card" style={{ padding:0 }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 className="card-title">Recent Complaints</h2>
          <Link to="/admin/complaints" className="btn btn-outline btn-sm">View All</Link>
        </div>
        <div className="table-wrap" style={{ border:'none', borderRadius:0 }}>
          <table>
            <thead>
              <tr>
                <th>Ticket</th><th>Title</th><th>Citizen</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints?.map(c => (
                <tr key={c._id}>
                  <td><span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#1a56db' }}>{c.ticketId}</span></td>
                  <td style={{ fontWeight:500 }}>{c.title}</td>
                  <td style={{ color:'#6b7280', fontSize:13 }}>{c.citizen?.name}</td>
                  <td style={{ fontSize:13 }}>{c.category}</td>
                  <td><span className={`badge ${priorityColors[c.priority]}`}>{c.priority}</span></td>
                  <td><span className={`badge ${statusColors[c.status]}`}>{c.status}</span></td>
                  <td style={{ fontSize:13, color:'#9ca3af' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td><Link to={`/admin/complaints/${c._id}`} className="btn btn-outline btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
