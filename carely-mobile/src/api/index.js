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
  getMyBookings: (_role) => api.get('/bookings'),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  checkPincode: (pincode) => api.get(`/bookings/check-pincode/${pincode}`),
};

// Provider Services
export const providerService = {
  getProviders: (params) => api.get('/providers', { params }),
  toggleAvailability: () => api.put('/providers/availability'),
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

export default api;
