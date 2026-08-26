// ============================================================
// Payments Page (Admin) - Invoices, dues, bulk billing
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { paymentsAPI, usersAPI } from '../../services/api';
import { CreditCard, Plus, CheckCircle, TrendingUp, AlertCircle, X } from 'lucide-react';
import type { Payment, User } from '../../types';
import toast from 'react-hot-toast';

const statusBadge = (s: string) => ({ paid: 'badge-success', pending: 'badge-warning', overdue: 'badge-danger', waived: 'badge-secondary', partial: 'badge-info' }[s] || 'badge-secondary');

const PaymentsAdminPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [residents, setResidents] = useState<User[]>([]);
  const [, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [showSingle, setShowSingle] = useState(false);

  // Bulk bill form state
  const [bulkForm, setBulkForm] = useState({ amount: '2500', dueDate: '', billingPeriod: new Date().toISOString().slice(0, 7), description: '' });
  const [bulkLoading, setBulkLoading] = useState(false);

  // Single payment form
  const [singleForm, setSingleForm] = useState({ residentId: '', type: 'maintenance', amount: '', penalty: '0', dueDate: '', description: '' });
  const [singleLoading, setSingleLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, rRes] = await Promise.all([
        paymentsAPI.getAll({ status: statusFilter || undefined }),
        paymentsAPI.getSummary(),
        usersAPI.getResidents(),
      ]);
      setPayments(pRes.data.payments);
      setSummary(sRes.data);
      setResidents(rRes.data.residents);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const handleMarkPaid = async (id: string) => {
    const method = window.prompt('Payment method? (cash/upi/card/bank_transfer/cheque)', 'upi');
    if (!method) return;
    try { await paymentsAPI.markAsPaid(id, method); toast.success('Marked as paid'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.dueDate) { toast.error('Due date is required'); return; }
    setBulkLoading(true);
    try {
      const res = await paymentsAPI.generateBulk(bulkForm);
      toast.success(res.data.message);
      setShowBulk(false); fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setBulkLoading(false); }
  };

  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.residentId || !singleForm.amount || !singleForm.dueDate) { toast.error('Fill all required fields'); return; }
    setSingleLoading(true);
    try {
      await paymentsAPI.create(singleForm);
      toast.success('Payment record created');
      setShowSingle(false); fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSingleLoading(false); }
  };

  return (
    <Layout title="Financial Management" subtitle="Track dues, generate invoices and reports">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Management</h1>
          <p className="page-subtitle">{payments.length} payment records</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowSingle(true)}><Plus size={16} /> Add Record</button>
          <button className="btn btn-primary" onClick={() => setShowBulk(true)}><CreditCard size={16} /> Generate Bills</button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><TrendingUp size={22} color="#22c55e" /></div>
            <div className="stat-info">
              <div className="stat-value">₹{(summary.collectedThisMonth || 0).toLocaleString()}</div>
              <div className="stat-label">Collected This Month</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertCircle size={22} color="#ef4444" /></div>
            <div className="stat-info">
              <div className="stat-value">₹{(summary.outstandingDues || 0).toLocaleString()}</div>
              <div className="stat-label">Outstanding Dues</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><CreditCard size={22} color="#f59e0b" /></div>
            <div className="stat-info">
              <div className="stat-value">{summary.overdueCount || 0}</div>
              <div className="stat-label">Overdue Payments</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-row">
        <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Invoice</th><th>Resident</th><th>Type</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">💳</div><div className="empty-title">No payment records</div></div></td></tr>
              ) : payments.map(p => {
                const resident = p.resident as User;
                const isOd = p.status === 'pending' && new Date(p.dueDate) < new Date();
                return (
                  <tr key={p._id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--accent-1)', fontFamily: 'monospace' }}>{p.invoiceNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{resident?.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.flatNumber}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{p.type.replace('_', ' ')}</td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{p.totalAmount.toLocaleString()}</div>
                      {p.penalty > 0 && <div style={{ fontSize: '0.72rem', color: '#ef4444' }}>+₹{p.penalty} penalty</div>}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: isOd ? '#ef4444' : 'var(--text-secondary)' }}>
                      {new Date(p.dueDate).toLocaleDateString()}
                      {isOd && ' ⚠️'}
                    </td>
                    <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                    <td>
                      {p.status !== 'paid' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(p._id)}>
                          <CheckCircle size={13} /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Bill Modal */}
      {showBulk && (
        <div className="modal-overlay" onClick={() => setShowBulk(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Monthly Bills</h3>
              <button className="modal-close" onClick={() => setShowBulk(false)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              This will create maintenance bills for all active residents.
            </p>
            <form onSubmit={handleBulkGenerate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Billing Period</label>
                  <input type="month" className="form-control" value={bulkForm.billingPeriod} onChange={e => setBulkForm(p => ({ ...p, billingPeriod: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-control" value={bulkForm.amount} onChange={e => setBulkForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input type="date" className="form-control" value={bulkForm.dueDate} onChange={e => setBulkForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBulk(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={bulkLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {bulkLoading ? <span className="spinner" /> : <CreditCard size={16} />} Generate Bills
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Payment Modal */}
      {showSingle && (
        <div className="modal-overlay" onClick={() => setShowSingle(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Payment Record</h3>
              <button className="modal-close" onClick={() => setShowSingle(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSingleCreate}>
              <div className="form-group">
                <label className="form-label">Resident *</label>
                <select className="form-control" value={singleForm.residentId} onChange={e => setSingleForm(p => ({ ...p, residentId: e.target.value }))}>
                  <option value="">-- Select Resident --</option>
                  {residents.map(r => <option key={r._id} value={r._id}>{r.name} — {r.flatNumber}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={singleForm.type} onChange={e => setSingleForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="maintenance">Maintenance</option>
                    <option value="penalty">Penalty</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-control" value={singleForm.amount} onChange={e => setSingleForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Penalty (₹)</label>
                  <input type="number" className="form-control" value={singleForm.penalty} onChange={e => setSingleForm(p => ({ ...p, penalty: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input type="date" className="form-control" value={singleForm.dueDate} onChange={e => setSingleForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSingle(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={singleLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {singleLoading ? <span className="spinner" /> : <Plus size={16} />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PaymentsAdminPage;
