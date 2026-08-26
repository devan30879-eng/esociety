// ============================================================
// Notices Page (Admin) - Post notices, events, polls
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { noticesAPI } from '../../services/api';
import { Plus, Trash2, Bell, X, Calendar } from 'lucide-react';
import type { Notice } from '../../types';
import toast from 'react-hot-toast';

const typeEmoji: Record<string, string> = { notice: '📢', event: '📅', poll: '📊', emergency: '🚨', maintenance_alert: '🔧' };
const typeColor: Record<string, string> = { notice: 'badge-info', event: 'badge-success', poll: 'badge-purple', emergency: 'badge-danger', maintenance_alert: 'badge-warning' };

const NoticesAdminPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ title: '', content: '', type: 'notice', priority: 'normal', targetRole: 'all', eventDate: '', eventVenue: '', pollOptions: ['', ''] });
  const [formLoading, setFormLoading] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await noticesAPI.getAll({ type: typeFilter || undefined, limit: 50 });
      setNotices(res.data.notices);
    } catch { toast.error('Failed to load notices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, [typeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error('Title and content required'); return; }
    setFormLoading(true);
    try {
      const payload: any = { ...form };
      if (form.type === 'poll') {
        payload.pollOptions = form.pollOptions.filter((o: string) => o.trim());
        if (payload.pollOptions.length < 2) { toast.error('Add at least 2 poll options'); setFormLoading(false); return; }
      }
      await noticesAPI.create(payload);
      toast.success('Notice posted!');
      setShowForm(false);
      setForm({ title: '', content: '', type: 'notice', priority: 'normal', targetRole: 'all', eventDate: '', eventVenue: '', pollOptions: ['', ''] });
      fetchNotices();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this notice?')) return;
    try { await noticesAPI.delete(id); toast.success('Removed'); fetchNotices(); }
    catch { toast.error('Failed'); }
  };

  return (
    <Layout title="Notices & Events" subtitle="Post announcements, events and polls">
      <div className="page-header">
        <div><h1 className="page-title">Notices & Events</h1><p className="page-subtitle">{notices.length} active posts</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Post Notice</button>
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
            <div className="empty-state card"><div className="empty-icon">📢</div><div className="empty-title">No notices yet</div></div>
          ) : notices.map(n => (
            <div key={n._id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.3rem' }}>{typeEmoji[n.type]}</span>
                    <span className={`badge ${typeColor[n.type]}`}>{n.type.replace('_', ' ')}</span>
                    <span className={`badge ${n.priority === 'urgent' ? 'badge-danger' : n.priority === 'high' ? 'badge-warning' : 'badge-secondary'}`}>{n.priority}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{n.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{n.content}</p>
                  {n.type === 'event' && n.eventDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.82rem', color: 'var(--accent-1)' }}>
                      <Calendar size={13} /> {new Date(n.eventDate).toLocaleString()} {n.eventVenue && `· ${n.eventVenue}`}
                    </div>
                  )}
                  {n.type === 'poll' && n.pollOptions && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {n.pollOptions.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', borderRadius: 6, padding: '6px 12px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--accent-1)', fontWeight: 600 }}>{i + 1}.</span>
                          <span>{opt.option}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{opt.votes?.length || 0} votes</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
                    Posted {new Date(n.createdAt).toLocaleString()} · {(n.readBy || []).length} read
                  </div>
                </div>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(n._id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Post New Notice</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="notice">Notice</option><option value="event">Event</option>
                    <option value="poll">Poll</option><option value="maintenance_alert">Maintenance Alert</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="normal">Normal</option><option value="high">High</option>
                    <option value="urgent">Urgent</option><option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Notice title" />
              </div>
              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea className="form-control" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} placeholder="Detailed message..." />
              </div>
              {form.type === 'event' && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Event Date</label>
                    <input type="datetime-local" className="form-control" value={form.eventDate} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Venue</label>
                    <input className="form-control" value={form.eventVenue} onChange={e => setForm(p => ({ ...p, eventVenue: e.target.value }))} placeholder="Clubhouse Hall" />
                  </div>
                </div>
              )}
              {form.type === 'poll' && (
                <div className="form-group">
                  <label className="form-label">Poll Options (min 2)</label>
                  {form.pollOptions.map((opt: string, i: number) => (
                    <input key={i} className="form-control" style={{ marginBottom: 8 }} value={opt} onChange={e => {
                      const opts = [...form.pollOptions]; opts[i] = e.target.value; setForm(p => ({ ...p, pollOptions: opts }));
                    }} placeholder={`Option ${i + 1}`} />
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm(p => ({ ...p, pollOptions: [...p.pollOptions, ''] }))}>+ Add Option</button>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-control" value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}>
                  <option value="all">All Users</option><option value="resident">Residents Only</option><option value="security">Security Only</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {formLoading ? <span className="spinner" /> : <Bell size={16} />} Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default NoticesAdminPage;
