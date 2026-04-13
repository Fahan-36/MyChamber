import api from './api';

const doctorService = {
  getAll: async () => {
    const { data } = await api.get('/doctors');
    return data;
  },
  search: async (specialization) => {
    const { data } = await api.get('/doctors/search', { params: { specialization } });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/doctors/${id}`);
    return data;
  },
  updateProfile: async (payload) => {
    const { data } = await api.put('/doctors/profile', payload);
    return data;
  },
  addSchedule: async (payload) => {
    const { data } = await api.post('/doctors/schedule', payload);
    return data;
  },
  getMySchedule: async () => {
    const { data } = await api.get('/doctors/my/schedule');
    return data;
  },
  updateSchedule: async (id, payload) => {
    const { data } = await api.put(`/doctors/schedule/${id}`, payload);
    return data;
  },
  deleteSchedule: async (id) => {
    const { data } = await api.delete(`/doctors/schedule/${id}`);
    return data;
  },
};

export default doctorService;
