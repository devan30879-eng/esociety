// ============================================================
// Resident Dashboard - My stats, pending items, quick actions
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { dashboardAPI } from '../../services/api';
import { MessageSquare, CreditCard, UserCheck, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ResidentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getResident()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="My Dashboard">
      <div className="loading-screen" style={{ height: '60vh' }}>
        <div className="spinner" /><p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    </Layout>
  );

  const statusColor = (status: string) => ({ open: '#ef4444', 'in-progress': '#f59e0b', resolved: '#22c55e' }[status] || '#94a3b8');
  const paymentColor = (status: string) => ({ paid: '#22c55e', pending: '#f59e0b', overdue: '#ef4444' }[status] || '#94a3b8');

  return (
    <Layout title="My Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}! · Flat ${user?.flatNumber}, Block ${user?.block}`}>
      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><MessageSquare size={22} color="#ef4444" /></div>
          <div className="stat-info">
            <div className="stat-value">{data?.myComplaints?.length || 0}</div>
            <div className="stat-label">My Complaints</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><CreditCard size={22} color="#f59e0b" /></div>
          <div className="stat-info">
            <div className="stat-value">{data?.pendingPaymentsCount || 0}</div>
            <div className="stat-label">Pending Bills</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><UserCheck size={22} color="#6366f1" /></div>
          <div className="stat-info">
            <div className="stat-value">{data?.recentVisitors?.length || 0}</div>
            <div className="stat-label">Recent Visitors</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><CreditCard size={22} color="#ef4444" /></div>
          <div className="stat-info">
            <div className="stat-value">₹{(data?.totalDue || 0).toLocaleString()}</div>
            <div className="stat-label">Amount Due</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Recent Complaints */}
        <div className="card">
          <div className="card-title"><MessageSquare size={16} /> My Recent Complaints</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data?.myComplaints || []).slice(0, 4).map((c: any) => (
              <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(c.status), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{c.category} · {c.status}</div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
            {(!data?.myComplaints || data.myComplaints.length === 0) && (
              <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-icon">📋</div><div className="empty-title">No complaints</div></div>
            )}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="card">
          <div className="card-title"><CreditCard size={16} /> Pending Payments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data?.pendingPayments || []).slice(0, 4).map((p: any) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>₹{p.totalAmount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.type.replace('_', ' ')} · {p.billingPeriod}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: paymentColor(p.status), fontWeight: 600, textTransform: 'capitalize' }}>{p.status}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Due: {new Date(p.dueDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {(!data?.pendingPayments || data.pendingPayments.length === 0) && (
              <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-icon">✅</div><div className="empty-title">All paid up!</div></div>
            )}
          </div>
        </div>
      </div>

      {/* Notices + Quick Actions */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title"><Bell size={16} /> Recent Notices</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data?.notices || []).slice(0, 4).map((n: any) => (
              <div key={n._id} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.2rem' }}>{n.type === 'event' ? '📅' : n.type === 'poll' ? '📊' : '📢'}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {(!data?.notices || data.notices.length === 0) && (
              <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-icon">📢</div><div className="empty-title">No notices</div></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">⚡ Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Pre-approve Visitor', emoji: '🚪', path: '/resident/visitors' },
              { label: 'Raise Complaint', emoji: '📋', path: '/resident/complaints' },
              { label: 'Book Facility', emoji: '🏊', path: '/resident/facilities' },
              { label: 'View Payments', emoji: '💳', path: '/resident/payments' },
              { label: 'View Notices', emoji: '📢', path: '/resident/notices' },
              { label: 'Emergency', emoji: '🚨', path: '/resident/emergency' },
            ].map(a => (
              <a key={a.label} href={a.path} className="quick-action">
                <div className="quick-action-icon">{a.emoji}</div>
                <div className="quick-action-label">{a.label}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResidentDashboard;
