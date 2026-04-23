import api from './api';

export const subscriptionService = {
  // Public
  getPlans: () => api.get('/subscriptions/plans'),
  getPackages: () => api.get('/subscriptions/packages'),
  
  // Patient
  purchasePlan: (planId) => api.post('/subscriptions/purchase-plan', { planId }),
  purchasePackage: (packageId) => api.post('/subscriptions/purchase-package', { packageId }),
  getMySubscriptions: () => api.get('/subscriptions/my-subscriptions'),
  getMyPackages: () => api.get('/subscriptions/my-packages'),
  
  // Provider / Admin
  logSession: (packageId) => api.post(`/subscriptions/packages/${packageId}/log-session`),
};
