import api from './api';

const notificationService = {
  getAll: async (limit = 20) => {
    const { data } = await api.get('/notifications', { params: { limit } });
    return data;
  },
  getUnreadCount: async () => {
    const { data } = await api.get('/notifications/unread-count');
    return data;
  },
  markAsRead: async (id) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
  markAllAsRead: async () => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },
};

export default notificationService;
