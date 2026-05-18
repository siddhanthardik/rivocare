import api from './api';

const providerService = {
  getAll: (params) => api.get('/provider', { params }),
  getById: (id) => api.get(`/provider/${id}`),
  getDashboard: () => api.get('/provider/dashboard'),
  getEarningsSummary: () => api.get('/provider/earnings-summary'),
  getProfile: () => api.get('/provider/me'),
  getAvailability: () => api.get('/provider/me/availability'),
  updateAvailability: (data) => api.put('/provider/me/availability', data),
  toggleAvailability: () => api.put('/provider/availability'),
  updateProfile: (data) => api.put('/provider/profile', data),
  getServices: () => api.get('/provider/services'),
  getAssignments: () => api.get('/provider/me/assignments'),
  updateAssignment: (id, status) => api.put(`/provider/me/assignments/${id}`, { status }),
  captureLead: (data) => api.post('/provider/lead', data),
  getMyReferral: () => api.get('/provider/me/referral'),
  // Onboarding
  getOnboardingStatus: () => api.get('/provider/onboarding/status'),
  saveOnboardingProfile: (data) => api.put('/provider/onboarding/profile', data),
  submitKYC: (formData) => api.post('/provider/onboarding/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitDocument: (formData) => api.post('/provider/onboarding/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitDeclaration: () => api.post('/provider/onboarding/submit'),
};

export default providerService;
