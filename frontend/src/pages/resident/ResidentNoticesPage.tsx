// ============================================================
// Resident Notices Page - View announcements, vote on polls
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { noticesAPI } from '../../services/api';
import { Calendar } from 'lucide-react';
import type { Notice } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const typeEmoji: Record<string, string> = { notice:'📢', event:'📅', poll:'📊', emergency:'🚨', maintenance_alert:'🔧' };
const typeColor: Record<string, string> = { notice:'badge-info', event:'badge-success', poll:'badge-purple', emergency:'badge-danger', maintenance_alert:'badge-warning' };

const ResidentNoticesPage: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchNotices = async () => {
    setLoading(true);
    try { const res = await noticesAPI.getAll({ type: typeFilter || undefined, limit: 50 }); setNotices(res.data.notices); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, [typeFilter]);

  const handleVote = async (noticeId: string, optionIndex: number) => {
    try {
      await noticesAPI.castVote(noticeId, optionIndex);
      toast.success('Vote cast!');
      fetchNotices();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to vote'); }
  };

  const hasVoted = (notice: Notice) => {
    return notice.pollOptions?.some(opt => opt.votes?.some(v => {
      const vId = typeof v === 'string' ? v : (v as any)._id;
      return vId === user?._id;
    }));
  };

  const totalVotes = (notice: Notice) => notice.pollOptions?.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0;

  return (
    <Layout title="Notices & Events" subtitle="Stay updated with society announcements">
      <div className="page-header">
        <div><h1 className="page-title">Notices & Events</h1><p className="page-subtitle">{notices.length} posts</p></div>
      </div>

      <div className="filters-row">
        {['', 'notice', 'event', 'poll', 'maintenance_alert'].map(t => (
          <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter(t)}>
            {t ? `${typeEmoji[t]} ${t.replace('_', ' ')}` : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ width: 36, height: 36, borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notices.length === 0 ? (
            <div className="empty-state card"><div className="empty-icon">📢</div><div className="empty-title">No notices</div></div>
          ) : notices.map(n => (
            <div key={n._id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.3rem' }}>{typeEmoji[n.type]}</span>
                <span className={`badge ${typeColor[n.type]}`}>{n.type.replace('_', ' ')}</span>
                {n.priority !== 'normal' && (
                  <span className={`badge ${n.priority === 'urgent' ? 'badge-danger' : n.priority === 'high' ? 'badge-warning' : 'badge-secondary'}`}>{n.priority}</span>
                )}
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{n.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{n.content}</p>

              {n.type === 'event' && n.eventDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--accent-1)', marginBottom: 12 }}>
                  <Calendar size={13} /> {new Date(n.eventDate).toLocaleString()} {n.eventVenue && `· 📍 ${n.eventVenue}`}
                </div>
              )}

              {n.type === 'poll' && n.pollOptions && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {hasVoted(n) ? '✅ You have voted' : '👉 Cast your vote:'} · {totalVotes(n)} total votes
                  </div>
                  {n.pollOptions.map((opt, i) => {
                    const vCount = opt.votes?.length || 0;
                    const pct = totalVotes(n) > 0 ? Math.round((vCount / totalVotes(n)) * 100) : 0;
                    return (
                      <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', cursor: hasVoted(n) ? 'default' : 'pointer' }}
                        onClick={() => !hasVoted(n) && handleVote(n._id, i)}>
                        {hasVoted(n) && (
                          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: 'rgba(99,102,241,0.15)', borderRadius: 8 }} />
                        )}
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{opt.option}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-1)', fontWeight: 600 }}>{hasVoted(n) ? `${pct}%` : vCount > 0 ? `${vCount} votes` : 'Vote'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12 }}>
                Posted {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default ResidentNoticesPage;
