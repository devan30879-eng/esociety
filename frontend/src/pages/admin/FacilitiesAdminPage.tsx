// ============================================================
// Facilities Page (Admin) - Manage facilities, view all bookings
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { facilitiesAPI } from '../../services/api';
import { Plus, Edit2, X, Building2, Clock, Users, DollarSign } from 'lucide-react';
import type { Facility, Booking } from '../../types';
import toast from 'react-hot-toast';

const typeEmoji: Record<string, string> = { gymnasium: '🏋️', swimming_pool: '🏊', clubhouse: '🏛️', sports_court: '🎾', party_hall: '🎉', terrace: '🌿', other: '🏢' };

interface FacilityFormProps { facility?: Facility | null; onClose: () => void; onSaved: () => void; }

const FacilityForm: React.FC<FacilityFormProps> = ({ facility, onClose, onSaved }) => {
  const isEdit = !!facility;
  const [form, setForm] = useState({
    name: facility?.name || '', description: facility?.description || '',
    type: facility?.type || 'gymnasium', pricePerHour: facility?.pricePerHour ?? 0,
    capacity: facility?.capacity || 10, openTime: facility?.openTime || '06:00',
    closeTime: facility?.closeTime || '22:00',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && facility) { await facilitiesAPI.update(facility._id, form); toast.success('Facility updated'); }
      else { await facilitiesAPI.create(form); toast.success('Facility created'); }
      onSaved(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Facility' : 'Add Facility'}</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Facility name" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="gymnasium">Gymnasium</option>
                <option value="swimming_pool">Swimming Pool</option>
                <option value="clubhouse">Clubhouse</option>
                <option value="sports_court">Sports Court</option>
                <option value="party_hall">Party Hall</option>
                <option value="terrace">Terrace</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Price/Hour (₹)</label>
              <input type="number" className="form-control" value={form.pricePerHour} onChange={e => setForm(p => ({ ...p, pricePerHour: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <input type="number" className="form-control" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Open Time</label>
              <input type="time" className="form-control" value={form.openTime} onChange={e => setForm(p => ({ ...p, openTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Close Time</label>
              <input type="time" className="form-control" value={form.closeTime} onChange={e => setForm(p => ({ ...p, closeTime: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : null} {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FacilitiesAdminPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editFacility, setEditFacility] = useState<Facility | null>(null);
  const [activeTab, setActiveTab] = useState<'facilities' | 'bookings'>('facilities');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, bRes] = await Promise.all([facilitiesAPI.getAll(), facilitiesAPI.getAllBookings()]);
      setFacilities(fRes.data.facilities);
      setBookings(bRes.data.bookings);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this facility?')) return;
    try { await facilitiesAPI.delete(id); toast.success('Facility deactivated'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  return (
    <Layout title="Facilities" subtitle="Manage society amenities and bookings">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facilities & Bookings</h1>
          <p className="page-subtitle">{facilities.length} facilities · {bookings.length} bookings</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditFacility(null); setShowForm(true); }}>
          <Plus size={16} /> Add Facility
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['facilities', 'bookings'] as const).map(tab => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
            {tab === 'facilities' ? <Building2 size={14} /> : <Clock size={14} />} {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner" style={{ width: 36, height: 36, borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
      ) : activeTab === 'facilities' ? (
        <div className="grid-3">
          {facilities.map(f => (
            <div className="card" key={f._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: '2rem' }}>{typeEmoji[f.type] || '🏢'}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setEditFacility(f); setShowForm(true); }}><Edit2 size={13} /></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(f._id)}><X size={13} /></button>
                </div>
              </div>
              <h3 style={{ marginBottom: 6, fontSize: '1rem' }}>{f.name}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>{f.description || 'No description'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span className="badge badge-info"><Users size={11} /> {f.capacity} people</span>
                <span className="badge badge-secondary"><Clock size={11} /> {f.openTime}–{f.closeTime}</span>
                <span className="badge badge-success"><DollarSign size={11} /> {f.pricePerHour > 0 ? `₹${f.pricePerHour}/hr` : 'Free'}</span>
              </div>
            </div>
          ))}
          {facilities.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-icon">🏊</div>
              <div className="empty-title">No facilities added yet</div>
              <div className="empty-desc">Add your first facility to get started</div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Facility</th><th>Resident</th><th>Date</th><th>Time</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">No bookings yet</div></div></td></tr>
                ) : bookings.map(b => {
                  const fac = b.facility as Facility;
                  const user = b.bookedBy as any;
                  return (
                    <tr key={b._id}>
                      <td><span>{typeEmoji[fac?.type] || '🏢'}</span> <span style={{ marginLeft: 6, fontWeight: 600, fontSize: '0.88rem' }}>{fac?.name}</span></td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.flatNumber}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(b.date).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.startTime} – {b.endTime}</td>
                      <td style={{ fontWeight: 600 }}>{b.totalAmount > 0 ? `₹${b.totalAmount}` : 'Free'}</td>
                      <td><span className={`badge ${b.status === 'cancelled' ? 'badge-danger' : b.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>{b.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showForm && <FacilityForm facility={editFacility} onClose={() => setShowForm(false)} onSaved={fetchAll} />}
    </Layout>
  );
};

export default FacilitiesAdminPage;
