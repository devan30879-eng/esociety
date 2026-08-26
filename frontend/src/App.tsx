// ============================================================
// App.tsx - Root routing with role-based protected routes
// ============================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import './index.css';

// ─── Pages ───────────────────────────────────────────────────
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import VisitorsPage from './pages/admin/VisitorsPage';
import ComplaintsAdminPage from './pages/admin/ComplaintsAdminPage';
import FacilitiesAdminPage from './pages/admin/FacilitiesAdminPage';
import PaymentsAdminPage from './pages/admin/PaymentsAdminPage';
import NoticesAdminPage from './pages/admin/NoticesAdminPage';
import EmergencyPage from './pages/EmergencyPage';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import ResidentVisitorsPage from './pages/resident/ResidentVisitorsPage';
import ResidentComplaintsPage from './pages/resident/ResidentComplaintsPage';
import ResidentFacilitiesPage from './pages/resident/ResidentFacilitiesPage';
import ResidentPaymentsPage from './pages/resident/ResidentPaymentsPage';
import ResidentNoticesPage from './pages/resident/ResidentNoticesPage';
import SecurityDashboard from './pages/security/SecurityDashboard';

// ─── Protected Route wrapper ──────────────────────────────────
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show spinner while checking auth state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--accent-1)', borderColor: 'rgba(99,102,241,0.2)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading eSociety...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Redirect if wrong role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const redirectMap: Record<string, string> = {
      admin: '/admin/dashboard',
      resident: '/resident/dashboard',
      security: '/security/dashboard',
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
};

// ─── Root redirect based on role ─────────────────────────────
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--accent-1)', borderColor: 'rgba(99,102,241,0.2)' }} />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const redirectMap: Record<string, string> = {
    admin: '/admin/dashboard',
    resident: '/resident/dashboard',
    security: '/security/dashboard',
  };

  return <Navigate to={redirectMap[user?.role || ''] || '/login'} replace />;
};

// ─── Main App ─────────────────────────────────────────────────
const AppRoutes: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<RootRedirect />} />

    {/* ── Admin Routes ── */}
    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
    <Route path="/admin/visitors" element={<ProtectedRoute allowedRoles={['admin', 'security']}><VisitorsPage /></ProtectedRoute>} />
    <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={['admin']}><ComplaintsAdminPage /></ProtectedRoute>} />
    <Route path="/admin/facilities" element={<ProtectedRoute allowedRoles={['admin']}><FacilitiesAdminPage /></ProtectedRoute>} />
    <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><PaymentsAdminPage /></ProtectedRoute>} />
    <Route path="/admin/notices" element={<ProtectedRoute allowedRoles={['admin']}><NoticesAdminPage /></ProtectedRoute>} />
    <Route path="/admin/emergency" element={<ProtectedRoute allowedRoles={['admin', 'security']}><EmergencyPage /></ProtectedRoute>} />

    {/* ── Resident Routes ── */}
    <Route path="/resident/dashboard" element={<ProtectedRoute allowedRoles={['resident']}><ResidentDashboard /></ProtectedRoute>} />
    <Route path="/resident/visitors" element={<ProtectedRoute allowedRoles={['resident']}><ResidentVisitorsPage /></ProtectedRoute>} />
    <Route path="/resident/complaints" element={<ProtectedRoute allowedRoles={['resident']}><ResidentComplaintsPage /></ProtectedRoute>} />
    <Route path="/resident/facilities" element={<ProtectedRoute allowedRoles={['resident']}><ResidentFacilitiesPage /></ProtectedRoute>} />
    <Route path="/resident/payments" element={<ProtectedRoute allowedRoles={['resident']}><ResidentPaymentsPage /></ProtectedRoute>} />
    <Route path="/resident/notices" element={<ProtectedRoute allowedRoles={['resident']}><ResidentNoticesPage /></ProtectedRoute>} />
    <Route path="/resident/emergency" element={<ProtectedRoute allowedRoles={['resident']}><EmergencyPage /></ProtectedRoute>} />

    {/* ── Security Routes ── */}
    <Route path="/security/dashboard" element={<ProtectedRoute allowedRoles={['security', 'admin']}><SecurityDashboard /></ProtectedRoute>} />
    <Route path="/security/visitors" element={<ProtectedRoute allowedRoles={['security', 'admin']}><VisitorsPage /></ProtectedRoute>} />
    <Route path="/security/emergency" element={<ProtectedRoute allowedRoles={['security', 'admin']}><EmergencyPage /></ProtectedRoute>} />

    {/* 404 Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <AuthProvider>
    <SocketProvider>
      <Router>
        <AppRoutes />
        {/* Toast notifications - positioned top-right */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '0.88rem',
              boxShadow: 'var(--shadow-lg)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </Router>
    </SocketProvider>
  </AuthProvider>
);

export default App;
