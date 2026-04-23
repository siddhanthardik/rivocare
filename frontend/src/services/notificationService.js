import api from './api'; // Ensure you have standard configured axios interceptor here

export const getNotifications = (limit = 20) => api.get(`/notifications?limit=${limit}`);
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllAsRead = () => api.put(`/notifications/read-all`);
