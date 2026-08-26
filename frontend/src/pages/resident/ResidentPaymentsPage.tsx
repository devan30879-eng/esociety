// ============================================================
// Resident Payments Page - View invoices, payment history
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { paymentsAPI } from '../../services/api';
import { CreditCard, AlertCircle } from 'lucide-react';
import type { Payment } from '../../types';
import toast from 'react-hot-toast';

const statusBadge = (s: string) => ({ paid:'badge-success', pending:'badge-warning', overdue:'badge-danger', waived:'badge-secondary' }[s] || 'badge-secondary');

const ResidentPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    paymentsAPI.getAll({ status: statusFilter || undefined })
      .then(res => setPayments(res.data.payments))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const pendingTotal = payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.totalAmount, 0);
  const paidTotal = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <Layout title="My Payments" subtitle="View invoices and payment history">
      <div className="page-header">
        <div><h1 className="page-title">My Payments</h1><p className="page-subtitle">{payments.length} records</p></div>
      </div>

      {/* Summary */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertCircle size={22} color="#ef4444" /></div>
          <div className="stat-info">
            <div className="stat-value">₹{pendingTotal.toLocaleString()}</div>
            <div className="stat-label">Total Due</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><CreditCard size={22} color="#22c55e" /></div>
          <div className="stat-info">
            <div className="stat-value">₹{paidTotal.toLocaleString()}</div>
            <div className="stat-label">Total Paid</div>
          </div>
        </div>
      </div>

      <div className="filters-row">
        {['', 'pending', 'paid', 'overdue'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state card"><div className="empty-icon">💳</div><div className="empty-title">No payment records</div></div>
        ) : payments.map(p => {
          const isOd = p.status === 'pending' && new Date(p.dueDate) < new Date();
          return (
            <div key={p._id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, borderColor: isOd ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: p.status === 'paid' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                {p.status === 'paid' ? '✅' : isOd ? '⚠️' : '💳'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                  {p.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  {p.billingPeriod && ` · ${p.billingPeriod}`}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{p.invoiceNumber}</div>
                {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.description}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: p.status === 'paid' ? '#22c55e' : isOd ? '#ef4444' : 'var(--text-primary)' }}>
                  ₹{p.totalAmount.toLocaleString()}
                </div>
                {p.penalty > 0 && <div style={{ fontSize: '0.72rem', color: '#ef4444' }}>+₹{p.penalty} penalty</div>}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {p.status === 'paid' ? `Paid: ${new Date(p.paidAt!).toLocaleDateString()}` : `Due: ${new Date(p.dueDate).toLocaleDateString()}`}
                </div>
                <span className={`badge ${statusBadge(p.status)}`} style={{ marginTop: 4 }}>{p.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default ResidentPaymentsPage;
