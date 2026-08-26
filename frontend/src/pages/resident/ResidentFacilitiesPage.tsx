// ============================================================
// Resident Facilities Page - Browse and book amenities
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { facilitiesAPI } from '../../services/api';
import { Calendar, Clock, Users, DollarSign, X, XCircle } from 'lucide-react';
import type { Facility, Booking } from '../../types';
import toast from 'react-hot-toast';

const typeEmoji: Record<string, string> = { gymnasium:'🏋️', swimming_pool:'🏊', clubhouse:'🏛️', sports_court:'🎾', party_hall:'🎉', terrace:'🌿', other:'🏢' };

interface BookModalProps { facility: Facility; onClose: () => void; onBooked: () => void; }

const BookModal: React.FC<BookModalProps> = ({ facility, onClose, onBooked }) => {
  const [form, setForm] = useState({ date: '', startTime: facility.openTime, endTime: '', attendees: 1, purpose: '' });
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState(0);

  // Recalculate cost whenever time changes
  const calcCost = (start: string, end: string) => {
    if (!start || !end) return;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const dur = (eh * 60 + em - (sh * 60 + sm)) / 60;
    if (dur > 0) setCost(dur * facility.pricePerHour);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.endTime) { toast.error('Date and end time required'); return; }
    setLoading(true);
    try {
      await facilitiesAPI.book(facility._id, form);
      toast.success('Facility booked successfully!');
      onBooked(); onClose();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to book'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Book {facility.name}</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span className="badge badge-info"><Clock size={11} /> {facility.openTime}–{facility.closeTime}</span>
          <span className="badge badge-secondary"><Users size={11} /> Max {facility.capacity}</span>
          <span className="badge badge-success"><DollarSign size={11} /> {facility.pricePerHour > 0 ? `₹${facility.pricePerHour}/hr` : 'Free'}</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-control" value={form.date} min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input type="time" className="form-control" value={form.startTime}
                onChange={e => { setForm(p => ({ ...p, startTime: e.target.value })); calcCost(e.target.value, form.endTime); }} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input type="time" className="form-control" value={form.endTime}
                onChange={e => { setForm(p => ({ ...p, endTime: e.target.value })); calcCost(form.startTime, e.target.value); }} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Attendees</label>
              <input type="number" className="form-control" value={form.attendees} min={1} max={facility.capacity}
                onChange={e => setForm(p => ({ ...p, attendees: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Purpose</label>
              <input className="form-control" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="Birthday party, workout..." />
            </div>
          </div>
          {facility.pricePerHour > 0 && cost > 0 && (
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Estimated Cost:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-1)' }}>₹{cost}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : <Calendar size={16} />} Book Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ResidentFacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-bookings'>('browse');
  const [bookFacility, setBookFacility] = useState<Facility | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, bRes] = await Promise.all([facilitiesAPI.getAll(), facilitiesAPI.getMyBookings()]);
      setFacilities(fRes.data.facilities);
      setMyBookings(bRes.data.bookings);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    try { await facilitiesAPI.cancelBooking(id, 'Cancelled by resident'); toast.success('Booking cancelled'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  return (
    <Layout title="Facilities" subtitle="Browse and book society amenities">
      <div className="page-header">
        <div><h1 className="page-title">Facilities</h1></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('browse')}>🏊 Browse</button>
          <button className={`btn btn-sm ${activeTab === 'my-bookings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('my-bookings')}>📅 My Bookings ({myBookings.length})</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner" style={{ width: 36, height: 36, borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
      ) : activeTab === 'browse' ? (
        <div className="grid-3">
          {facilities.map(f => (
            <div key={f._id} className="card">
              <div style={{ fontSize: '2.5rem', marginBottom: 12, textAlign: 'center' }}>{typeEmoji[f.type] || '🏢'}</div>
              <h3 style={{ textAlign: 'center', marginBottom: 8 }}>{f.name}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>{f.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                <span className="badge badge-secondary"><Clock size={11} /> {f.openTime}–{f.closeTime}</span>
                <span className="badge badge-info"><Users size={11} /> {f.capacity} max</span>
                <span className="badge badge-success">{f.pricePerHour > 0 ? `₹${f.pricePerHour}/hr` : 'Free'}</span>
              </div>
              {f.amenities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 16 }}>
                  {f.amenities.slice(0, 3).map((a, i) => <span key={i} style={{ fontSize: '0.72rem', background: 'var(--bg-input)', borderRadius: 4, padding: '2px 8px', color: 'var(--text-secondary)' }}>{a}</span>)}
                </div>
              )}
              <button className="btn btn-primary" onClick={() => setBookFacility(f)} style={{ width: '100%', justifyContent: 'center' }}>
                <Calendar size={14} /> Book Now
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myBookings.length === 0 ? (
            <div className="empty-state card"><div className="empty-icon">📅</div><div className="empty-title">No bookings yet</div><div className="empty-desc">Book a facility to see it here</div></div>
          ) : myBookings.map(b => {
            const fac = b.facility as Facility;
            return (
              <div key={b._id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: '2rem' }}>{typeEmoji[fac?.type] || '🏢'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{fac?.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {new Date(b.date).toLocaleDateString()} · {b.startTime}–{b.endTime} · {b.attendees} person(s)
                  </div>
                  {b.totalAmount > 0 && <div style={{ fontSize: '0.82rem', color: 'var(--accent-1)', fontWeight: 600 }}>₹{b.totalAmount} · {b.paymentStatus}</div>}
                </div>
                <span className={`badge ${b.status === 'cancelled' ? 'badge-danger' : b.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>{b.status}</span>
                {b.status !== 'cancelled' && new Date(b.date) > new Date() && (
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleCancel(b._id)}><XCircle size={14} /></button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {bookFacility && <BookModal facility={bookFacility} onClose={() => setBookFacility(null)} onBooked={fetchAll} />}
    </Layout>
  );
};

export default ResidentFacilitiesPage;
