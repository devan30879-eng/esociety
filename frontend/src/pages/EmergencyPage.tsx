// ============================================================
// Emergency Page - Raise alerts, view active emergencies, contacts
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { emergencyAPI } from '../services/api';
import { AlertTriangle, CheckCircle, Phone, X } from 'lucide-react';
import type { Emergency } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const severityBadge = (s: string) => ({ low:'badge-success', medium:'badge-info', high:'badge-warning', critical:'badge-danger' }[s] || 'badge-secondary');
const typeEmoji: Record<string, string> = { fire:'🔥', medical:'🚑', security_breach:'🔐', flood:'🌊', gas_leak:'💨', theft:'🚨', other:'⚠️' };

const EmergencyPage: React.FC = () => {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRaise, setShowRaise] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'other', severity: 'high', location: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([
        emergencyAPI.getAll({ status: statusFilter || undefined }),
        emergencyAPI.getContacts(),
      ]);
      setEmergencies(eRes.data.emergencies);
      setContacts(cRes.data.contacts);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) { toast.error('Title and description required'); return; }
    setFormLoading(true);
    try {
      await emergencyAPI.raise(form);
      toast.success('🚨 Emergency alert raised! All users notified.');
      setShowRaise(false);
      setForm({ title: '', description: '', type: 'other', severity: 'high', location: '' });
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setFormLoading(false); }
  };

  const handleResolve = async (id: string) => {
    const note = window.prompt('Resolution note:');
    if (note === null) return;
    try {
      await emergencyAPI.resolve(id, note);
      toast.success('Emergency resolved');
      fetchAll();
    } catch { toast.error('Failed to resolve'); }
  };

  return (
    <Layout title="Emergency" subtitle="Raise alerts and monitor emergency situations">
      <div className="page-header">
        <div><h1 className="page-title">Emergency Management</h1><p className="page-subtitle">{emergencies.length} alerts found</p></div>
        <button className="btn btn-danger" onClick={() => setShowRaise(true)}><AlertTriangle size={16} /> Raise Emergency</button>
      </div>

      {/* Emergency contacts */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title"><Phone size={16} /> Emergency Contacts</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {contacts.map((c, i) => (
            <a key={i} href={`tel:${c.number}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-input)', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit', transition: 'var(--transition)' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent-1)')} onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-1)', fontWeight: 600 }}>{c.number}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div className="filters-row">
        {['active', 'responding', 'resolved', ''].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ width: 36, height: 36, borderTopColor: '#ef4444', borderColor: 'var(--border)' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {emergencies.length === 0 ? (
            <div className="empty-state card"><div className="empty-icon">✅</div><div className="empty-title">No emergencies found</div><div className="empty-desc">All clear!</div></div>
          ) : emergencies.map(em => {
            const raisedBy = em.raisedBy as any;
            return (
              <div key={em._id} className="card" style={{ padding: '20px 24px', borderColor: em.status === 'active' ? 'rgba(239,68,68,0.4)' : 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.5rem' }}>{typeEmoji[em.type] || '⚠️'}</span>
                      <span className={`badge ${em.status === 'active' ? 'badge-danger' : em.status === 'responding' ? 'badge-warning' : 'badge-success'}`}>{em.status}</span>
                      <span className={`badge ${severityBadge(em.severity)}`}>{em.severity}</span>
                      <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{em.type.replace('_', ' ')}</span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: 6, color: em.status === 'active' ? '#ef4444' : 'var(--text-primary)' }}>{em.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>{em.description}</p>
                    {em.location && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>📍 {em.location}</div>}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                      Raised by <strong>{raisedBy?.name}</strong> ({raisedBy?.flatNumber || raisedBy?.role}) · {new Date(em.createdAt).toLocaleString()}
                    </div>
                    {em.resolutionNote && (
                      <div style={{ marginTop: 10, background: 'rgba(34,197,94,0.1)', borderRadius: 6, padding: '8px 12px', fontSize: '0.82rem', color: '#22c55e' }}>
                        ✅ Resolution: {em.resolutionNote}
                      </div>
                    )}
                  </div>
                  {em.status !== 'resolved' && (user?.role === 'admin' || user?.role === 'security') && (
                    <button className="btn btn-success btn-sm" onClick={() => handleResolve(em._id)}>
                      <CheckCircle size={14} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Raise Emergency Modal */}
      {showRaise && (
        <div className="modal-overlay" onClick={() => setShowRaise(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>🚨 Raise Emergency Alert</h3>
              <button className="modal-close" onClick={() => setShowRaise(false)}><X size={16} /></button>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: '0.83rem', color: '#ef4444' }}>
              ⚠️ This will send an immediate notification to ALL residents and security staff.
            </div>
            <form onSubmit={handleRaise}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Emergency Type</label>
                  <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="fire">🔥 Fire</option>
                    <option value="medical">🚑 Medical</option>
                    <option value="security_breach">🔐 Security Breach</option>
                    <option value="flood">🌊 Flood</option>
                    <option value="gas_leak">💨 Gas Leak</option>
                    <option value="theft">🚨 Theft</option>
                    <option value="other">⚠️ Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select className="form-control" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief emergency title" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What happened? Provide details..." />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-control" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Block A, Floor 3..." />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRaise(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={formLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {formLoading ? <span className="spinner" /> : <AlertTriangle size={16} />} Raise Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EmergencyPage;
