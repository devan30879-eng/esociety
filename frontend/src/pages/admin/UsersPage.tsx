// ============================================================
// Users Management Page (Admin) - Create, edit, deactivate users
// ============================================================
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { usersAPI } from '../../services/api';
import { UserPlus, Search, Edit2, Trash2, X } from 'lucide-react';
import type { User } from '../../types';
import toast from 'react-hot-toast';

// ─── User Form Modal ──────────────────────────────────────────
interface UserFormProps {
  user?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSaved }) => {
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'resident',
    phone: user?.phone || '',
    flatNumber: user?.flatNumber || '',
    block: user?.block || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && user) {
        const payload = { ...form };
        if (!payload.password) delete (payload as any).password;
        await usersAPI.update(user._id, payload);
        toast.success('User updated successfully');
      } else {
        if (!form.password) { toast.error('Password is required'); setLoading(false); return; }
        await usersAPI.create(form);
        toast.success('User created successfully');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit User' : 'Add New User'}</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} placeholder="john@example.com" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                <option value="resident">Resident</option>
                <option value="security">Security Guard</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="phone" className="form-control" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
            </div>
            <div className="form-group">
              <label className="form-label">Flat Number</label>
              <input name="flatNumber" className="form-control" value={form.flatNumber} onChange={handleChange} placeholder="A-101" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Block</label>
            <input name="block" className="form-control" value={form.block} onChange={handleChange} placeholder="A, B, C..." />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : null}
              {isEdit ? 'Update' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Role Badge Colors ────────────────────────────────────────
const roleBadge = (role: string) => {
  const map: Record<string, string> = { admin: 'badge-purple', resident: 'badge-info', security: 'badge-success' };
  return map[role] || 'badge-secondary';
};

// ─── Main Users Page ──────────────────────────────────────────
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ search, role: roleFilter || undefined });
      setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  // Deactivate user (soft delete)
  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? They won't be able to log in.`)) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deactivated');
      fetchUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  return (
    <Layout title="Users Management" subtitle="Manage residents, security staff and admins">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Users Management</h1>
          <p className="page-subtitle">{users.length} users found</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditUser(null); setShowForm(true); }}>
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 380 }}>
          <Search />
          <input
            placeholder="Search by name, email, flat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 160 }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="resident">Residents</option>
          <option value="security">Security</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ borderTopColor: 'var(--accent-1)', borderColor: 'var(--border)' }} /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Flat / Block</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <div className="empty-title">No users found</div>
                        <div className="empty-desc">Try adjusting your search filters</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="user-avatar" style={{ width: 34, height: 34, fontSize: '0.85rem' }}>
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                      <td>{u.flatNumber ? `${u.flatNumber} · Block ${u.block || '-'}` : '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => { setEditUser(u); setShowForm(true); }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          {u.isActive && (
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              onClick={() => handleDeactivate(u._id, u.name)}
                              title="Deactivate"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <UserForm
          user={editUser}
          onClose={() => setShowForm(false)}
          onSaved={fetchUsers}
        />
      )}
    </Layout>
  );
};

export default UsersPage;
