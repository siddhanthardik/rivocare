import api from './api';

const bookingService = {
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  // Update booking fields (used to change paymentMethod without changing lifecycle status)
  update: (id, data) => api.put(`/bookings/${id}`, data),
  collectCash: (id, data) => api.post(`/bookings/${id}/collect-cash`, data),
  markPaid: (id) => api.put(`/bookings/${id}/mark-paid`),
  verifyCompletion: (id, verified) => api.put(`/bookings/${id}/verify-completion`, { verified }),
  delete: (id) => api.delete(`/bookings/${id}`),
  cancel: (id, data) => api.put(`/bookings/${id}/status`, { ...data, status: 'CANCELLED' }),
  checkPincode: (pincode) => api.get(`/bookings/check-pincode/${pincode}`),
};

export default bookingService;
