import api from './api';

export const adminVisitPricingService = {
  getVisitPricingConfigs: async () => {
    const response = await api.get('/admin/visit-pricing');
    return response.data.data || [];
  },
  createVisitPricingConfig: async (data) => {
    const response = await api.post('/admin/visit-pricing', data);
    return response.data;
  },
  updateVisitPricingConfig: async (id, data) => {
    const response = await api.put(`/admin/visit-pricing/${id}`, data);
    return response.data;
  },
  toggleVisitPricingConfig: async (id) => {
    const response = await api.patch(`/admin/visit-pricing/${id}/toggle`);
    return response.data;
  },
};

export default adminVisitPricingService;
