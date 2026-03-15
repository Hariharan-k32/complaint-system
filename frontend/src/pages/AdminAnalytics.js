import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, RadialLinearScale } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, RadialLinearScale);

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [trends7, setTrends7] = useState([]);
  const [trends30, setTrends30] = useState([]);
  const [trends90, setTrends90] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/trends?period=7d'),
      api.get('/analytics/trends?period=30d'),
      api.get('/analytics/trends?period=90d'),
    ]).then(([s, t7, t30, t90]) => {
      setStats(s.data.data);
      setTrends7(t7.data.data);
      setTrends30(t30.data.data);
      setTrends90(t90.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner" /></div>;
  if (!stats) return null;

  const currentTrends = period === '7d' ? trends7 : period === '90d' ? trends90 : trends30;

  const trendData = {
    labels: currentTrends.map(t => t._id),
    datasets: [
      { label:'Submitted', data: currentTrends.map(t => t.count), borderColor:'#1a56db', backgroundColor:'rgba(26,86,219,0.1)', fill:true, tension:0.4 },
      { label:'Resolved', data: currentTrends.map(t => t.resolved), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.1)', fill:true, tension:0.4 },
    ]
  };

  const categoryData = {
    labels: stats.categoryBreakdown.map(c => c._id),
    datasets: [{
      label: 'Complaints',
      data: stats.categoryBreakdown.map(c => c.count),
      backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1'],
      borderWidth: 0, borderRadius: 6,
    }]
  };

  const statusData = {
    labels: Object.keys(stats.statusBreakdown),
    datasets: [{
      data: Object.values(stats.statusBreakdown),
      backgroundColor: ['#3b82f6','#f59e0b','#8b5cf6','#10b981','#6b7280','#ef4444'],
      borderWidth: 0,
    }]
  };

  const monthlyData = {
    labels: stats.monthlyTrend.map(m => `${m._id.year}-${String(m._id.month).padStart(2,'0')}`),
    datasets: [
      { label:'Submitted', data: stats.monthlyTrend.map(m => m.submitted), backgroundColor:'rgba(26,86,219,0.8)', borderRadius:4 },
      { label:'Resolved', data: stats.monthlyTrend.map(m => m.resolved), backgroundColor:'rgba(16,185,129,0.8)', borderRadius:4 },
    ]
  };

  const kpis = [
    { label:'Total Complaints', value: stats.overview.total, icon:'📋', sub:'All time' },
    { label:'Resolved', value: stats.statusBreakdown['Resolved'] || 0, icon:'✅', sub:`${stats.overview.resolutionRate}% rate` },
    { label:'Avg Resolution', value: `${stats.overview.avgResolutionHours}h`, icon:'⏱️', sub:'Average time' },
    { label:'Avg Rating', value: `${stats.overview.avgRating}★`, icon:'⭐', sub:`${stats.overview.totalFeedback} reviews` },
    { label:'Pending', value: stats.statusBreakdown['Submitted'] || 0, icon:'⏳', sub:'Needs attention' },
    { label:'In Progress', value: (stats.statusBreakdown['In Progress'] || 0) + (stats.statusBreakdown['Under Review'] || 0), icon:'⚙️', sub:'Being handled' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Analytics & Reports</h1>
        <p>Comprehensive insights into complaint management performance</p>
      </div>

      {/* KPI Row */}
      <div className="grid-3" style={{ marginBottom:28 }}>
        {kpis.map((k, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background:'#eff6ff', fontSize:24 }}>{k.icon}</div>
            <div>
              <div className="stat-label">{k.label}</div>
              <div className="stat-value" style={{ fontSize:24 }}>{k.value}</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart with Period Selector */}
      <div className="card" style={{ marginBottom:24 }}>
        <div className="card-header">
          <h2 className="card-title">Complaint Trends</h2>
          <div style={{ display:'flex', gap:6 }}>
            {['7d','30d','90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}>
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height:260 }}>
          <Line data={trendData} options={{ plugins:{ legend:{ position:'top' } }, scales:{ y:{ beginAtZero:true, grid:{ color:'#f3f4f6' } }, x:{ grid:{ display:false } } }, maintainAspectRatio:false }} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <div className="card-header"><h2 className="card-title">By Category</h2></div>
          <div style={{ height:260 }}>
            <Bar data={categoryData} options={{ indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } } }, maintainAspectRatio:false }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">By Status</h2></div>
          <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Doughnut data={statusData} options={{ plugins:{ legend:{ position:'right', labels:{ boxWidth:12, font:{ size:12 } } } }, maintainAspectRatio:false }} />
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">Monthly Comparison (Last 6 Months)</h2></div>
        <div style={{ height:260 }}>
          <Bar data={monthlyData} options={{ plugins:{ legend:{ position:'top' } }, scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true, grid:{ color:'#f3f4f6' } } }, maintainAspectRatio:false }} />
        </div>
      </div>
    </div>
  );
}
