// ============================================================
// Security Dashboard - Today's visitors, pending approvals
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { dashboardAPI } from '../../services/api';
import { UserCheck, Home, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const SecurityDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getSecurity()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Security Dashboard">
      <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>
    </Layout>
  );

  const purposeEmoji: Record<string, string> = { guest:'👤', delivery:'📦', maintenance:'🔧', cab:'🚕', other:'❓' };
  const statusColor: Record<string, string> = { pending:'#f59e0b', approved:'#3b82f6', inside:'#22c55e', exited:'#64748b', denied:'#ef4444' };

  return (
    <Layout title="Security Dashboard" subtitle="Monitor gate access and visitor entries">
      {/* Active emergencies */}
      {data?.activeEmergencies?.length > 0 && (
        <div className="emergency-banner" style={{ marginBottom: 20 }}>
          <AlertTriangle size={20} color="#ef4444" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#ef4444' }}>🚨 ACTIVE EMERGENCY: </strong>
            <span style={{ color: 'var(--text-primary)' }}>{data.activeEmergencies[0].title}</span>
          </div>
          <a href="/security/emergency" style={{ color: '#ef4444', fontSize: '0.85rem' }}>Respond →</a>
        </div>
      )}

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><UserCheck size={22} color="#6366f1" /></div>
          <div className="stat-info">
            <div className="stat-value">{data?.todayVisitors?.length || 0}</div>
            <div className="stat-label">Total Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><Home size={22} color="#22c55e" /></div>
          <div className="stat-info">
            <div className="stat-value">{data?.insideVisitors || 0}</div>
            <div className="stat-label">Currently Inside</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Clock size={22} color="#f59e0b" /></div>
          <div className="stat-info">
            <div className="stat-value">{data?.pendingApprovals || 0}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>
      </div>

      {/* Today's Visitors */}
      <div className="card">
        <div className="card-title"><UserCheck size={16} /> Today's Visitors</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(data?.todayVisitors || []).length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-icon">🚪</div><div className="empty-title">No visitors today</div></div>
          ) : (data?.todayVisitors || []).map((v: any) => (
            <div key={v._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor[v.status] || '#64748b', flexShrink: 0 }} />
              <span style={{ fontSize: '1.3rem' }}>{purposeEmoji[v.purpose] || '❓'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Visiting: {v.resident?.name} ({v.resident?.flatNumber}) · {v.phone}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColor[v.status], textTransform: 'capitalize' }}>{v.status}</span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {v.entryTime ? `In: ${new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick link to full visitors page */}
        <a href="/security/visitors" className="btn btn-secondary" style={{ marginTop: 16, justifyContent: 'center', width: '100%' }}>
          View All Visitors →
        </a>
      </div>
    </Layout>
  );
};

export default SecurityDashboard;
