import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo, standard localhost doesn't route properly to host machine for Android Emulator.
// 10.0.2.2 is the default emulator loopback alias for localhost mapping.
// Set EXPO_PUBLIC_API_URL in .env if testing on physical devices (e.g. your local IP 192.168.1.X:5000)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('rivo_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Axios interceptor error retrieving token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Services
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: (formData) => api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeAvatar: () => api.delete('/auth/avatar'),
  getReferrals: () => api.get('/auth/referrals'),
  
  // ❌ DEPRECATED: OTP verification removed from auth flow (2FA removed as of April 2026)
  // Keeping for future reference only - DO NOT USE in login/signup flows
  // verifyOTP: (data) => api.post('/auth/verify-otp', data),
};

// Booking Services
// Canonical contract:
// create => { providerId, service, address, pincode, scheduledAt, durationHours?, notes? }
// status => pending | confirmed | in-progress | completed | cancelled
export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params = {}) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  verifyCompletion: (id, verified) => api.put(`/bookings/${id}/verify-completion`, { verified }),
  updatePrice: (id, newFinalPrice, reason) => api.put(`/bookings/${id}/update-price`, { newFinalPrice, reason }),
  approvePrice: (id) => api.put(`/bookings/${id}/approve-price`),
  rejectPrice: (id) => api.put(`/bookings/${id}/reject-price`),
  checkPincode: (pincode) => api.get(`/bookings/check-pincode/${pincode}`),
};

// Provider Services
export const providerService = {
  getProviders: (params) => api.get('/providers', { params }),
  getProviderById: (id) => api.get(`/providers/${id}`),
  getServices: () => api.get('/providers/services'),
  toggleAvailability: () => api.put('/providers/availability'),
  updateProfile: (data) => api.put('/providers/profile', data),
  getAssignments: () => api.get('/providers/me/assignments'),
  updateAssignment: (id, status) => api.put(`/providers/me/assignments/${id}`, { status }),
  getMyReferral: () => api.get('/providers/me/referral'),
  captureLead: (data) => api.post('/providers/lead', data),
};

export const notificationService = {
  getAll: (limit = 10) => api.get('/notifications', { params: { limit } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const paymentService = {
  createOrder: (bookingId) => api.post('/payment/create-order', { bookingId }),
  verifyPayment: (data) => api.post('/payment/verify', data),
};

export const subscriptionService = {
  getPlans: () => api.get('/subscriptions/plans'),
  getPackages: () => api.get('/subscriptions/packages'),
  purchasePlan: (planId) => api.post('/subscriptions/purchase-plan', { planId }),
  purchasePackage: (packageId) => api.post('/subscriptions/purchase-package', { packageId }),
  getMySubscriptions: () => api.get('/subscriptions/my-subscriptions'),
  getMyPackages: () => api.get('/subscriptions/my-packages'),
  logSession: (id) => api.post(`/subscriptions/packages/${id}/log-session`),
};

export const walletService = {
  getInfo: () => api.get('/wallet'),
  getTransactions: (params = {}) => api.get('/wallet/transactions', { params }),
  requestPayout: (amount) => api.post('/wallet/payout', { amount }),
};

export const kycService = {
  getStatus: () => api.get('/kyc/status'),
  submit: (formData) => api.post('/kyc/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default api;
