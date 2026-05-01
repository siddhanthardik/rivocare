import api from './api';

const providerService = {
  getAll: (params) => api.get('/provider', { params }),
  getById: (id) => api.get(`/provider/${id}`),
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
};

export default providerService;
