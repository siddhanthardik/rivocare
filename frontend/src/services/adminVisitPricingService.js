import api from './api';

export const adminVisitPricingService = {
  getVisitPricingConfigs: () => api.get('/admin/visit-pricing'),
  createVisitPricingConfig: (data) => api.post('/admin/visit-pricing', data),
  updateVisitPricingConfig: (id, data) => api.put(`/admin/visit-pricing/${id}`, data),
  toggleVisitPricingConfig: (id) => api.patch(`/admin/visit-pricing/${id}/toggle`),
};

export default adminVisitPricingService;
