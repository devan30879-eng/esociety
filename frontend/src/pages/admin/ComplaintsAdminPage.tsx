// ============================================================
// Complaints Page (Admin) - Manage, assign, and resolve complaints
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { complaintsAPI, usersAPI } from '../../services/api';
import { Search, Eye, X } from 'lucide-react';
import type { Complaint, User } from '../../types';
import toast from 'react-hot-toast';

const priorityBadge = (p: string) => ({ urgent:'badge-danger', high:'badge-warning', medium:'badge-info', low:'badge-success' }[p] || 'badge-secondary');
const statusBadge = (s: string) => ({ open:'badge-danger', 'in-progress':'badge-warning', resolved:'badge-success', closed:'badge-secondary', rejected:'badge-secondary' }[s] || 'badge-secondary');
const categoryEmoji: Record<string, string> = { plumbing:'🔧', electrical:'⚡', cleaning:'🧹', security:'🔐', parking:'🚗', noise:'🔊', internet:'📶', lift:'🛗', other:'📌' };

interface UpdateModalProps { complaint: Complaint; staff: User[]; onClose: () => void; onSaved: () => void; }

const UpdateModal: React.FC<UpdateModalProps> = ({ complaint, staff, onClose, onSaved }) => {
  const [form, setForm] = useState({ status: complaint.status, note: '', assignedTo: '', resolutionNote: complaint.resolutionNote || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await complaintsAPI.updateStatus(complaint._id, form);
      toast.success('Complaint updated');
      onSaved(); onClose();
    } catch { toast.error('Failed to update'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Update Complaint</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{complaint.title}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{complaint.description}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Update Status</label>
            <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select className="form-control" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
              <option value="">-- Select Staff --</option>
              {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea className="form-control" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Add a note for the resident..." rows={2} />
          </div>
          {form.status === 'resolved' && (
            <div className="form-group">
              <label className="form-label">Resolution Note</label>
              <textarea className="form-control" value={form.resolutionNote} onChange={e => setForm(p => ({ ...p, resolutionNote: e.target.value }))} placeholder="How was it resolved?" rows={2} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : null} Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ComplaintsAdminPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([
        complaintsAPI.getAll({ search: search || undefined, status: statusFilter || undefined, priority: priorityFilter || undefined }),
        usersAPI.getAll({ role: 'admin' }),
      ]);
      setComplaints(cRes.data.complaints);
      setStaff(uRes.data.users);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [search, statusFilter, priorityFilter]);

  return (
    <Layout title="Complaints" subtitle="Track and resolve resident complaints">
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints Tracker</h1>
          <p className="page-subtitle">{complaints.length} complaints found</p>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={16} /><input placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select className="form-control" style={{ width: 140 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Complaint</th><th>Category</th><th>Raised By</th><th>Priority</th><th>Status</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No complaints found</div></div></td></tr>
                ) : complaints.map(c => {
                  const raisedBy = c.raisedBy as User;
                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
                      </td>
                      <td><span>{categoryEmoji[c.category] || '📌'}</span> <span style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{c.category}</span></td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{raisedBy?.name || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{raisedBy?.flatNumber}</div>
                      </td>
                      <td><span className={`badge ${priorityBadge(c.priority)}`}>{c.priority}</span></td>
                      <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(c)}>
                          <Eye size={13} /> Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && <UpdateModal complaint={selected} staff={staff} onClose={() => setSelected(null)} onSaved={fetchAll} />}
    </Layout>
  );
};

export default ComplaintsAdminPage;
