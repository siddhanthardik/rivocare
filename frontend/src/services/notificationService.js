import api from './api';

export const notificationService = {
  getNotifications: (limit = 20) => api.get(`/notifications?limit=${limit}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default notificationService;
