// ============================================================
// API Service Layer - All HTTP calls to the backend
// Axios instance with JWT token auto-injection
// ============================================================
import axios from 'axios';

// Base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────
// Auto-attach JWT token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────
// Redirect to login if token expired (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ================================================================
// AUTH API
// ================================================================
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/updateprofile', data),
  changePassword: (data: any) => api.put('/auth/changepassword', data),
};

// ================================================================
// USERS API (Admin)
// ================================================================
export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getResidents: () => api.get('/users/residents/list'),
  getStats: () => api.get('/users/stats/overview'),
};

// ================================================================
// VISITORS API
// ================================================================
export const visitorsAPI = {
  getAll: (params?: any) => api.get('/visitors', { params }),
  create: (data: any) => api.post('/visitors', data),
  preApprove: (data: any) => api.post('/visitors/preapprove', data),
  approve: (id: string, action: string) => api.put(`/visitors/${id}/approve`, { action }),
  markEntry: (id: string) => api.put(`/visitors/${id}/entry`),
  markExit: (id: string) => api.put(`/visitors/${id}/exit`),
  verifyQR: (token: string) => api.get(`/visitors/verify/${token}`),
  getStats: () => api.get('/visitors/stats'),
};

// ================================================================
// COMPLAINTS API
// ================================================================
export const complaintsAPI = {
  getAll: (params?: any) => api.get('/complaints', { params }),
  getById: (id: string) => api.get(`/complaints/${id}`),
  create: (data: any) => api.post('/complaints', data),
  updateStatus: (id: string, data: any) => api.put(`/complaints/${id}/status`, data),
  rate: (id: string, rating: number) => api.put(`/complaints/${id}/rate`, { rating }),
  getStats: () => api.get('/complaints/stats'),
};

// ================================================================
// FACILITIES & BOOKINGS API
// ================================================================
export const facilitiesAPI = {
  getAll: (params?: any) => api.get('/facilities', { params }),
  getById: (id: string) => api.get(`/facilities/${id}`),
  create: (data: any) => api.post('/facilities', data),
  update: (id: string, data: any) => api.put(`/facilities/${id}`, data),
  delete: (id: string) => api.delete(`/facilities/${id}`),
  book: (id: string, data: any) => api.post(`/facilities/${id}/book`, data),
  getBookings: (id: string, params?: any) => api.get(`/facilities/${id}/bookings`, { params }),
  getMyBookings: () => api.get('/facilities/bookings/my'),
  getAllBookings: () => api.get('/facilities/bookings/all'),
  cancelBooking: (bookingId: string, reason?: string) =>
    api.put(`/facilities/bookings/${bookingId}/cancel`, { reason }),
};

// ================================================================
// PAYMENTS API
// ================================================================
export const paymentsAPI = {
  getAll: (params?: any) => api.get('/payments', { params }),
  create: (data: any) => api.post('/payments', data),
  markAsPaid: (id: string, paymentMethod: string) =>
    api.put(`/payments/${id}/pay`, { paymentMethod }),
  getSummary: () => api.get('/payments/summary'),
  generateBulk: (data: any) => api.post('/payments/bulk', data),
};

// ================================================================
// NOTICES API
// ================================================================
export const noticesAPI = {
  getAll: (params?: any) => api.get('/notices', { params }),
  getById: (id: string) => api.get(`/notices/${id}`),
  create: (data: any) => api.post('/notices', data),
  castVote: (id: string, optionIndex: number) =>
    api.post(`/notices/${id}/vote`, { optionIndex }),
  delete: (id: string) => api.delete(`/notices/${id}`),
};

// ================================================================
// EMERGENCY API
// ================================================================
export const emergencyAPI = {
  getAll: (params?: any) => api.get('/emergency', { params }),
  raise: (data: any) => api.post('/emergency', data),
  resolve: (id: string, note: string) =>
    api.put(`/emergency/${id}/resolve`, { resolutionNote: note }),
  getContacts: () => api.get('/emergency/contacts'),
};

// ================================================================
// DASHBOARD API
// ================================================================
export const dashboardAPI = {
  getAdmin: () => api.get('/dashboard/admin'),
  getResident: () => api.get('/dashboard/resident'),
  getSecurity: () => api.get('/dashboard/security'),
};

export default api;
