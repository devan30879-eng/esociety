// ============================================================
// Resident Visitors Page - Pre-approve visitors, view my visitors
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { visitorsAPI } from '../../services/api';
import { UserPlus, CheckCircle, XCircle, X } from 'lucide-react';
import type { Visitor } from '../../types';
import toast from 'react-hot-toast';

const statusBadge = (s: string) => ({ pending:'badge-warning', approved:'badge-info', denied:'badge-danger', inside:'badge-success', exited:'badge-secondary' }[s] || 'badge-secondary');

const ResidentVisitorsPage: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreApprove, setShowPreApprove] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', purpose: 'guest', vehicleNumber: '', expectedArrival: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await visitorsAPI.getAll();
      setVisitors(res.data.visitors);
    } catch { toast.error('Failed to load visitors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisitors(); }, []);

  const handleApprove = async (id: string, action: 'approve' | 'deny') => {
    try {
      await visitorsAPI.approve(id, action);
      toast.success(`Visitor ${action === 'approve' ? 'approved' : 'denied'}`);
      fetchVisitors();
    } catch { toast.error('Failed'); }
  };

  const handlePreApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    setFormLoading(true);
    try {
      const res = await visitorsAPI.preApprove(form);
      setResult(res.data);
      toast.success('Visitor pre-approved!');
      fetchVisitors();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setFormLoading(false); }
  };

  return (
    <Layout title="My Visitors" subtitle="Manage visitor approvals and pre-approvals">
      <div className="page-header">
        <div><h1 className="page-title">My Visitors</h1><p className="page-subtitle">{visitors.length} total visitors</p></div>
        <button className="btn btn-primary" onClick={() => setShowPreApprove(true)}><UserPlus size={16} /> Pre-Approve Visitor</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Visitor</th><th>Purpose</th><th>Status</th><th>Entry</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🚪</div><div className="empty-title">No visitors yet</div></div></td></tr>
                ) : visitors.map(v => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.phone}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{v.purpose}</td>
                    <td><span className={`badge ${statusBadge(v.status)}`}>{v.status}</span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{v.entryTime ? new Date(v.entryTime).toLocaleTimeString() : '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td>
                      {v.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(v._id, 'approve')}><CheckCircle size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleApprove(v._id, 'deny')}><XCircle size={13} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPreApprove && (
        <div className="modal-overlay" onClick={() => { setShowPreApprove(false); setResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Pre-Approve Visitor</h3>
              <button className="modal-close" onClick={() => { setShowPreApprove(false); setResult(null); }}><X size={16} /></button>
            </div>
            {result ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#22c55e', marginBottom: 16 }}>✅ Visitor Pre-Approved!</div>
                <img src={result.qrCode} alt="QR" style={{ width: 160, height: 160, borderRadius: 12, marginBottom: 16 }} />
                <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Share OTP with visitor</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent-1)' }}>{result.otp}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valid 24 hours</div>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowPreApprove(false); setResult(null); }} style={{ width: '100%', justifyContent: 'center' }}>Done</button>
              </div>
            ) : (
              <form onSubmit={handlePreApprove}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Visitor name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Purpose</label>
                    <select className="form-control" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}>
                      <option value="guest">Guest</option><option value="delivery">Delivery</option>
                      <option value="maintenance">Maintenance</option><option value="cab">Cab</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Arrival</label>
                    <input type="datetime-local" className="form-control" value={form.expectedArrival} onChange={e => setForm(p => ({ ...p, expectedArrival: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPreApprove(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ flex: 1, justifyContent: 'center' }}>
                    {formLoading ? <span className="spinner" /> : <UserPlus size={16} />} Pre-Approve
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ResidentVisitorsPage;
