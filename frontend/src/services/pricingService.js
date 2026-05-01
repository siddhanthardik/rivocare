import api from './api';

const pricingService = {
  // Admin: Manage rules
  getAdminPricing: () => api.get('/pricing/admin/list'),
  upsertPricing: (data) => api.post('/pricing/admin/upsert', data),
  
  // Public: Calculate price
  calculatePrice: (data) => api.post('/pricing/calculate', data)
};

export default pricingService;
