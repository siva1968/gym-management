import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Set base URL
axios.defaults.baseURL = API_BASE_URL;

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
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

// Members API
export const membersAPI = {
  getAll: (params) => axios.get('/members', { params }),
  getById: (id) => axios.get(`/members/${id}`),
  create: (data) => axios.post('/members', data),
  update: (id, data) => axios.put(`/members/${id}`, data),
  delete: (id) => axios.delete(`/members/${id}`),
  getDues: () => axios.get('/members/dues/pending'),
  getExpiring: (days) => axios.get(`/members/expiring/soon?days=${days}`),
  renew: (id, data) => axios.post(`/members/${id}/renew`, data)
};

// Trainers API
export const trainersAPI = {
  getAll: (params) => axios.get('/trainers', { params }),
  getById: (id) => axios.get(`/trainers/${id}`),
  create: (data) => axios.post('/trainers', data),
  update: (id, data) => axios.put(`/trainers/${id}`, data),
  delete: (id) => axios.delete(`/trainers/${id}`),
  assignMember: (trainerId, memberId) => axios.post(`/trainers/${trainerId}/assign/${memberId}`),
  removeMember: (trainerId, memberId) => axios.delete(`/trainers/${trainerId}/remove/${memberId}`)
};

// Attendance API
export const attendanceAPI = {
  getAll: (params) => axios.get('/attendance', { params }),
  getToday: () => axios.get('/attendance/today'),
  checkIn: (data) => axios.post('/attendance/checkin', data),
  checkOut: (id) => axios.post(`/attendance/checkout/${id}`),
  getMemberHistory: (memberId) => axios.get(`/attendance/member/${memberId}`),
  getStats: (params) => axios.get('/attendance/stats', { params })
};

// Fees API
export const feesAPI = {
  getPlans: () => axios.get('/fees/plans'),
  createPlan: (data) => axios.post('/fees/plans', data),
  updatePlan: (id, data) => axios.put(`/fees/plans/${id}`, data),
  deletePlan: (id) => axios.delete(`/fees/plans/${id}`),
  getPayments: (params) => axios.get('/fees/payments', { params }),
  getPaymentById: (id) => axios.get(`/fees/payments/${id}`),
  createPayment: (data) => axios.post('/fees/payments', data),
  getMemberPayments: (memberId) => axios.get(`/fees/payments/member/${memberId}`),
  getRevenueSummary: (params) => axios.get('/fees/revenue/summary', { params })
};

// Expenses API
export const expensesAPI = {
  getAll: (params) => axios.get('/expenses', { params }),
  getById: (id) => axios.get(`/expenses/${id}`),
  create: (data) => axios.post('/expenses', data),
  update: (id, data) => axios.put(`/expenses/${id}`, data),
  delete: (id) => axios.delete(`/expenses/${id}`),
  getSummary: (params) => axios.get('/expenses/summary/stats', { params })
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => axios.get('/dashboard/stats'),
  getRecentActivities: () => axios.get('/dashboard/recent-activities')
};

// Reports API
export const reportsAPI = {
  getIncome: (params) => axios.get('/reports/income', { params }),
  getAttendance: (params) => axios.get('/reports/attendance', { params }),
  getRetention: (params) => axios.get('/reports/retention', { params }),
  getProfitLoss: (params) => axios.get('/reports/profit-loss', { params }),
  getMembershipStats: () => axios.get('/reports/membership-stats')
};

export default axios;
