import api from './api';
export * as notificationService from './notificationService';
export * from './subscriptionService';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  // OTP endpoints disabled (2FA removed from backend)
  // verifyOTP: (data) => api.post('/auth/verify-otp', data),
  // resendOTP: (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

export const providerService = {
  getAll: (params) => api.get('/providers', { params }),
  getById: (id) => api.get(`/providers/${id}`),
  toggleAvailability: () => api.put('/providers/availability'),
  updateProfile: (data) => api.put('/providers/profile', data),
  getServices: () => api.get('/providers/services'),
  getAssignments: () => api.get('/providers/me/assignments'),
  updateAssignment: (id, status) => api.put(`/providers/me/assignments/${id}`, { status }),
  captureLead: (data) => api.post('/providers/lead', data),
  getMyReferral: () => api.get('/providers/me/referral'),
};

export const bookingService = {
  // Canonical booking contract shared by web/mobile:
  // create => { providerId, service, address, pincode, scheduledAt, durationHours?, notes? }
  // status => pending | confirmed | in-progress | completed | cancelled
  // response shape => patient, provider.user, scheduledAt, lowercase status
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  verifyCompletion: (id, verified) => api.put(`/bookings/${id}/verify-completion`, { verified }),
  delete: (id) => api.delete(`/bookings/${id}`),
  checkPincode: (pincode) => api.get(`/bookings/check-pincode/${pincode}`),
  updatePrice: (id, data) => api.put(`/bookings/${id}/update-price`, data),
  approvePrice: (id) => api.put(`/bookings/${id}/approve-price`),
  rejectPrice: (id) => api.put(`/bookings/${id}/reject-price`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getProviders: (params) => api.get('/admin/providers', { params }),
  getProviderDetails: (id) => api.get(`/admin/providers/${id}/details`),
  verifyProvider: (id, data) => api.put(`/admin/providers/${id}/verify`, data),
  // Revenue Dashboard
  getDashboardSummary: () => api.get('/admin/dashboard/summary'),
  getDashboardRevenue: (period) => api.get('/admin/dashboard/revenue', { params: { period } }),
  getTopProviders: (limit = 10) => api.get('/admin/dashboard/top-providers', { params: { limit } }),
  getDashboardBookings: () => api.get('/admin/dashboard/bookings'),
  // Fraud Analytics
  getFraudSummary: () => api.get('/admin/fraud/summary'),
  getFraudFlags: (params) => api.get('/admin/fraud/flags', { params }),
  takeFraudAction: (data) => api.post('/admin/fraud/action', data),
  // Serviceable Pincodes
  getPincodes: () => api.get('/admin/pincodes/list'),
  addPincode: (data) => api.post('/admin/pincodes/add', data),
  togglePincode: (id) => api.put(`/admin/pincodes/${id}/toggle`),
  
  // Subscriptions & Packages
  createPlan: (data) => api.post('/admin/plans/create', data),
  getPlans: () => api.get('/admin/plans'),
  updatePlan: (id, data) => api.put(`/admin/plans/${id}`, data),
  createPackage: (data) => api.post('/admin/packages/create', data),
  getPackages: () => api.get('/admin/packages'),
  updatePackage: (id, data) => api.put(`/admin/packages/${id}`, data),
  getPendingAssignments: () => api.get('/admin/assignments/pending'),
  assignProvider: (data) => api.post('/admin/assign-provider', data),
  // Service Pricing
  getServicePricing: () => api.get('/admin/services/pricing'),
  updateServicePricing: (id, data) => api.put(`/admin/services/${id}/pricing`, data),
  // Admin Price Override
  setAdminPrice: (bookingId, data) => api.put(`/admin/bookings/${bookingId}/set-price`, data),
  // Provider Leads & Supply
  getProviderLeads: (params) => api.get('/admin/leads', { params }),
  updateLeadStatus: (id, data) => api.put(`/admin/leads/${id}`, data),
  updateProviderOnboarding: (id, data) => api.put(`/admin/providers/${id}/onboarding-status`, data),
  getSupplyGaps: () => api.get('/admin/supply-gaps'),
  // Content Management
  createPage: (data) => api.post('/admin/content/pages', data),
  listPages: (params) => api.get('/admin/content/pages', { params }),
  getPage: (id) => api.get(`/admin/content/pages/${id}`),
  updatePage: (id, data) => api.put(`/admin/content/pages/${id}`, data),
  deletePage: (id) => api.delete(`/admin/content/pages/${id}`),
  uploadPageHero: (id, formData) => api.post(`/admin/content/pages/${id}/hero`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  createBlog: (data) => api.post('/admin/blogs', data),
  listBlogs: (params) => api.get('/admin/blogs', { params }),
  getBlog: (id) => api.get(`/admin/blogs/${id}`),
  updateBlog: (id, data) => api.put(`/admin/blogs/${id}`, data),
  deleteBlog: (id) => api.delete(`/admin/blogs/${id}`),
  uploadBlogHero: (id, formData) => api.post(`/admin/blogs/${id}/hero`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const kycService = {
  // Provider
  submitKYC: (formData) => api.post('/kyc/submit', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
  getKYCStatus: () => api.get('/kyc/status'),
  
  // Admin
  getPending: () => api.get('/kyc/pending'),
  getById: (id) => api.get(`/kyc/${id}`),
  approve: (id) => api.put(`/kyc/${id}/approve`),
  reject: (id, reason) => api.put(`/kyc/${id}/reject`, { reason }),
};

export const reviewService = {
  // Patient: submit a new review
  submit: (data) => api.post('/reviews', data),
  // Check if a booking already has a review
  getBookingReview: (bookingId) => api.get(`/reviews/booking/${bookingId}`),
  // Get all reviews + avg rating for a provider
  getProviderReviews: (providerId, params) => api.get(`/reviews/provider/${providerId}`, { params }),
};

export const paymentService = {
  createOrder: (bookingId) => api.post('/payment/create-order', { bookingId }),
  verifyPayment: (data) => api.post('/payment/verify', data),
  payWithWallet: (bookingId) => api.post('/payment/pay-with-wallet', { bookingId }),
};

export const walletService = {
  getInfo: () => api.get('/wallet'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  requestPayout: (amount) => api.post('/wallet/payout', { amount }),
};
