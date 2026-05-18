import api from './api';

const reconciliationService = {
  getSummary: () => api.get('/admin/reconciliation/summary'),
  getPayments: (params) => api.get('/admin/reconciliation/payments', { params }),
  getPayouts: (params) => api.get('/admin/reconciliation/payouts', { params }),
  getFailures: (params) => api.get('/admin/reconciliation/failures', { params }),
};

export default reconciliationService;
