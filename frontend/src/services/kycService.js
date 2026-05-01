import api from './api';

const kycService = {
  submitKYC: (formData) => api.post('/kyc/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getKYCStatus: () => api.get('/kyc/status'),
  getPending: () => api.get('/kyc/pending'),
  getById: (id) => api.get(`/kyc/${id}`),
  approve: (id) => api.put(`/kyc/${id}/approve`),
  reject: (id, reason) => api.put(`/kyc/${id}/reject`, { reason }),
};

export default kycService;
