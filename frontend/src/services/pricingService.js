import api from './api';

const pricingService = {
  // Public
  getServices: () => api.get('/pricing/services'),
  getPlansByService: (serviceId) => api.get(`/pricing/services/${serviceId}/plans`),

  // Admin Services
  adminGetServices: () => api.get('/pricing/admin/services'),
  createService: (data) => api.post('/pricing/admin/services', data),
  updateService: (id, data) => api.put(`/pricing/admin/services/${id}`, data),

  // Admin Rules
  getAdminRules: () => api.get('/pricing/admin/rules'),
  upsertRule: (data) => api.post('/pricing/admin/rules', data),

  // Admin Offerings
  adminGetOfferings: () => api.get('/pricing/admin/plans'),
  createOffering: (data) => api.post('/pricing/admin/plans', data),
  updateOffering: (id, data) => api.put(`/pricing/admin/plans/${id}`, data),
  deleteOffering: (id) => api.delete(`/pricing/admin/plans/${id}`),

  // Aliases for transition
  adminGetPlans: function() { return this.adminGetOfferings(); },
  createPlan: function(data) { return this.createOffering(data); },
  updatePlan: function(id, data) { return this.updateOffering(id, data); },
  deletePlan: function(id) { return this.deleteOffering(id); },

  // Legacy (keeping for compatibility during migration)
  getAdminPricing: () => api.get('/pricing/admin/list'),
  upsertPricing: (data) => api.post('/pricing/admin/upsert', data),
  calculatePrice: (data) => api.post('/pricing/calculate', data)
};


export default pricingService;
