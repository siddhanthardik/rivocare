import api from './api';

const bookingService = {
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

export default bookingService;
