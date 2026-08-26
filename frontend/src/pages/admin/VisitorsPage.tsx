// ============================================================
// Visitors Page (Admin/Security) - Log, approve, track visitors
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { visitorsAPI, usersAPI } from '../../services/api';
import { UserPlus, LogIn, LogOut, X } from 'lucide-react';
import type { Visitor, User } from '../../types';
import toast from 'react-hot-toast';

const statusBadge = (status: string) => {
  const map: Record<string, string> = { pending: 'badge-warning', approved: 'badge-info', denied: 'badge-danger', inside: 'badge-success', exited: 'badge-secondary' };
  return map[status] || 'badge-secondary';
};
const purposeEmoji = (p: string) => ({ guest: '👤', delivery: '📦', maintenance: '🔧', cab: '🚕', other: '❓' }[p] || '❓');

interface AddVisitorModalProps { residents: User[]; onClose: () => void; onSaved: () => void; }

const AddVisitorModal: React.FC<AddVisitorModalProps> = ({ residents, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: '', phone: '', purpose: 'guest', vehicleNumber: '', residentId: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.residentId) { toast.error('Name, phone and resident required'); return; }
    setLoading(true);
    try {
      const res = await visitorsAPI.create(form);
      setResult(res.data);
      toast.success('Visitor logged! OTP & QR generated.');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Log Visitor Entry</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#22c55e', marginBottom: 16 }}>✅ Visitor Logged!</div>
            <img src={result.qrCode} alt="QR" style={{ width: 160, height: 160, borderRadius: 12, marginBottom: 16 }} />
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>OTP for Resident</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent-1)' }}>{result.otp}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valid 30 mins</div>
            </div>
            <button className="btn btn-primary" onClick={onClose} style={{ justifyContent: 'center', width: '100%' }}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
                  <option value="guest">Guest</option>
                  <option value="delivery">Delivery</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cab">Cab</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle No.</label>
                <input className="form-control" value={form.vehicleNumber} onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value }))} placeholder="MH-01-AB-1234" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Visiting Resident *</label>
              <select className="form-control" value={form.residentId} onChange={e => setForm(p => ({ ...p, residentId: e.target.value }))}>
                <option value="">-- Select Resident --</option>
                {residents.map(r => <option key={r._id} value={r._id}>{r.name} — {r.flatNumber} Block {r.block}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? <span className="spinner" /> : <UserPlus size={16} />} Log Visitor
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const VisitorsPage: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [residents, setResidents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([
        visitorsAPI.getAll({ status: statusFilter || undefined, date: dateFilter }),
        usersAPI.getResidents(),
      ]);
      setVisitors(vRes.data.visitors);
      setResidents(rRes.data.residents);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [statusFilter, dateFilter]);

  const handleEntry = async (id: string) => { try { await visitorsAPI.markEntry(id); toast.success('Entry marked'); fetchAll(); } catch { toast.error('Failed'); } };
  const handleExit = async (id: string) => { try { await visitorsAPI.markExit(id); toast.success('Exit marked'); fetchAll(); } catch { toast.error('Failed'); } };

  return (
    <Layout title="Visitor Management" subtitle="Track all visitor entries and exits">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitor Management</h1>
          <p className="page-subtitle">{visitors.length} visitors found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus size={16} /> Log Visitor
        </button>
      </div>

      <div className="filters-row">
        <input type="date" className="form-control" style={{ width: 180 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        <select className="form-control" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="inside">Inside</option>
          <option value="exited">Exited</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Visitor</th><th>Purpose</th><th>Resident</th><th>Status</th><th>Entry/Exit</th><th>Time</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🚶</div><div className="empty-title">No visitors found</div></div></td></tr>
                ) : visitors.map(v => {
                  const resident = v.resident as User;
                  return (
                    <tr key={v._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.phone}</div>
                      </td>
                      <td><span>{purposeEmoji(v.purpose)}</span> <span style={{ marginLeft: 6, fontSize: '0.82rem', textTransform: 'capitalize' }}>{v.purpose}</span></td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{resident?.name || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{resident?.flatNumber}</div>
                      </td>
                      <td><span className={`badge ${statusBadge(v.status)}`}>{v.status}</span></td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {v.entryTime && <div>In: {new Date(v.entryTime).toLocaleTimeString()}</div>}
                        {v.exitTime && <div>Out: {new Date(v.exitTime).toLocaleTimeString()}</div>}
                        {!v.entryTime && '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{new Date(v.createdAt).toLocaleTimeString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {v.status === 'approved' && (
                            <button className="btn btn-success btn-sm" onClick={() => handleEntry(v._id)}><LogIn size={13} /> Entry</button>
                          )}
                          {v.status === 'inside' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleExit(v._id)}><LogOut size={13} /> Exit</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAdd && <AddVisitorModal residents={residents} onClose={() => setShowAdd(false)} onSaved={fetchAll} />}
    </Layout>
  );
};

export default VisitorsPage;
