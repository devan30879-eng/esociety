// ============================================================
// Admin Dashboard - Overview stats, charts, recent activity
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { dashboardAPI } from '../../services/api';
import {
  Users, UserCheck, MessageSquare, CreditCard, AlertTriangle,
  TrendingUp, Clock, Home,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

// Colors for pie chart segments

// Recharts custom tooltip style
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardAPI.getAdmin();
        setData(res.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="loading-screen" style={{ height: '60vh' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  const stats = data?.stats || {};

  // Format stat cards data
  const statCards = [
    { label: 'Total Residents', value: stats.totalResidents, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    { label: 'Visitors Today', value: stats.visitorsToday, icon: UserCheck, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    { label: 'Visitors Inside', value: stats.visitorsInside, icon: Home, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    { label: 'Open Complaints', value: stats.openComplaints, icon: MessageSquare, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: CreditCard, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    { label: 'Collected (Month)', value: `₹${(stats.collectedThisMonth || 0).toLocaleString()}`, icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    { label: 'Active Alerts', value: stats.activeEmergencies, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    { label: 'Staff Members', value: stats.totalStaff, icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  ];

  // Complaint trend data for chart
  const complaintTrend = data?.complaintTrend || [];

  return (
    <Layout title="Admin Dashboard" subtitle="Overview of society operations">
      {/* Emergency Banner */}
      {stats.activeEmergencies > 0 && (
        <div className="emergency-banner">
          <AlertTriangle size={20} color="#ef4444" />
          <span style={{ fontWeight: 600, color: '#ef4444' }}>
            🚨 {stats.activeEmergencies} active emergency alert{stats.activeEmergencies > 1 ? 's' : ''}!
          </span>
          <a href="/admin/emergency" style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#ef4444' }}>
            View →
          </a>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{s.value ?? 0}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Complaint Trend */}
        <div className="chart-card">
          <div className="chart-title">
            <MessageSquare size={16} color="var(--accent-1)" />
            Complaint Trend (Last 7 Days)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={complaintTrend}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#grad1)" strokeWidth={2} name="Complaints" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Notices */}
        <div className="card" style={{ padding: 24 }}>
          <div className="card-title">
            <Clock size={16} />
            Recent Notices
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data?.recentNotices || []).map((n: any) => (
              <div key={n._id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {n.type === 'event' ? '📅' : n.type === 'poll' ? '📊' : n.type === 'emergency' ? '🚨' : '📢'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {n.type} · {n.priority}
                  </div>
                </div>
              </div>
            ))}
            {(!data?.recentNotices || data.recentNotices.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                No recent notices
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Links */}
      <div className="card">
        <div className="card-title">⚡ Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {[
            { label: 'Add Resident', emoji: '👤', path: '/admin/users' },
            { label: 'Log Visitor', emoji: '🚪', path: '/admin/visitors' },
            { label: 'Post Notice', emoji: '📢', path: '/admin/notices' },
            { label: 'Generate Bills', emoji: '💳', path: '/admin/payments' },
            { label: 'View Complaints', emoji: '📋', path: '/admin/complaints' },
            { label: 'Add Facility', emoji: '🏊', path: '/admin/facilities' },
          ].map((a) => (
            <a key={a.label} href={a.path} className="quick-action">
              <div className="quick-action-icon">{a.emoji}</div>
              <div className="quick-action-label">{a.label}</div>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
