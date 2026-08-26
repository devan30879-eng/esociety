// ============================================================
// Login Page - Authentication form with demo credentials
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit login form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);

      // Get fresh user from localStorage after login
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Redirect based on role
      const redirectMap: Record<string, string> = {
        admin: '/admin/dashboard',
        resident: '/resident/dashboard',
        security: '/security/dashboard',
      };

      toast.success(`Welcome back, ${user.name?.split(' ')[0]}!`);
      navigate(redirectMap[user.role] || '/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill demo credentials for quick testing
  const fillDemo = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@esociety.com', password: 'password123' },
      resident: { email: 'priya@esociety.com', password: 'password123' },
      security: { email: 'security@esociety.com', password: 'password123' },
    };
    setFormData(creds[role]);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Card */}
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="logo-icon">🏘️</div>
            <h1>eSociety</h1>
            <p>Management System — Sign in to continue</p>
          </div>

          {/* Demo buttons */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>
              Quick Demo Login:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['admin', 'resident', 'security'].map(role => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, textTransform: 'capitalize', justifyContent: 'center' }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="divider">or enter credentials</div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              {loading ? <span className="spinner" /> : <LogIn size={18} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 20 }}>
          Default password for all demo accounts: <strong style={{ color: 'var(--text-secondary)' }}>password123</strong>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
