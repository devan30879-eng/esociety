// ============================================================
// Resident Complaints Page - Raise and track complaints
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { complaintsAPI } from '../../services/api';
import { Plus, X } from 'lucide-react';
import type { Complaint } from '../../types';
import toast from 'react-hot-toast';

const priorityBadge = (p: string) => ({ urgent:'badge-danger', high:'badge-warning', medium:'badge-info', low:'badge-success' }[p] || 'badge-secondary');
const statusBadge = (s: string) => ({ open:'badge-danger', 'in-progress':'badge-warning', resolved:'badge-success', closed:'badge-secondary', rejected:'badge-secondary' }[s] || 'badge-secondary');

const ResidentComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [, setSelected] = useState<Complaint | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'plumbing', priority: 'medium' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try { const res = await complaintsAPI.getAll(); setComplaints(res.data.complaints); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) { toast.error('Title and description required'); return; }
    setFormLoading(true);
    try {
      await complaintsAPI.create(form);
      toast.success('Complaint submitted!');
      setShowForm(false);
      setForm({ title: '', description: '', category: 'plumbing', priority: 'medium' });
      fetchComplaints();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setFormLoading(false); }
  };

  const handleRate = async (id: string, rating: number) => {
    try { await complaintsAPI.rate(id, rating); toast.success('Rating submitted!'); fetchComplaints(); }
    catch { toast.error('Failed'); }
  };

  const categoryEmoji: Record<string, string> = { plumbing:'🔧', electrical:'⚡', cleaning:'🧹', security:'🔐', parking:'🚗', noise:'🔊', internet:'📶', lift:'🛗', other:'📌' };

  return (
    <Layout title="My Complaints" subtitle="Raise and track maintenance issues">
      <div className="page-header">
        <div><h1 className="page-title">My Complaints</h1><p className="page-subtitle">{complaints.length} total complaints</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Raise Complaint</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
        ) : complaints.length === 0 ? (
          <div className="empty-state card"><div className="empty-icon">📋</div><div className="empty-title">No complaints raised</div><div className="empty-desc">Raise a complaint if you face any issue</div></div>
        ) : complaints.map(c => (
          <div key={c._id} className="card" style={{ padding: '18px 22px', cursor: 'pointer' }} onClick={() => setSelected(c)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span>{categoryEmoji[c.category] || '📌'}</span>
                  <span className={`badge ${priorityBadge(c.priority)}`}>{c.priority}</span>
                  <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
                  <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{c.category}</span>
                </div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{c.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.description.slice(0, 120)}{c.description.length > 120 ? '...' : ''}</p>
                {c.resolutionNote && (
                  <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#22c55e', background: 'rgba(34,197,94,0.1)', borderRadius: 6, padding: '6px 10px' }}>
                    ✅ Resolution: {c.resolutionNote}
                  </div>
                )}
                {c.status === 'resolved' && !c.rating && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Rate resolution:</span>
                    {[1,2,3,4,5].map(r => (
                      <button key={r} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', fontSize: '1.2rem' }}
                        onClick={() => handleRate(c._id, r)}>⭐</button>
                    ))}
                  </div>
                )}
                {c.rating && (
                  <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#f59e0b' }}>Your rating: {'⭐'.repeat(c.rating)}</div>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(c.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Raise Complaint Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Raise a Complaint</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief description of the issue" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="plumbing">🔧 Plumbing</option>
                    <option value="electrical">⚡ Electrical</option>
                    <option value="cleaning">🧹 Cleaning</option>
                    <option value="security">🔐 Security</option>
                    <option value="parking">🚗 Parking</option>
                    <option value="noise">🔊 Noise</option>
                    <option value="internet">📶 Internet</option>
                    <option value="lift">🛗 Lift</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Describe the issue in detail..." />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {formLoading ? <span className="spinner" /> : <Plus size={16} />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ResidentComplaintsPage;
