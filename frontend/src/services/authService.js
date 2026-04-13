import api from './api';

const authService = {
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },
  profile: async () => {
    const { data } = await api.get('/auth/profile');
    return data;
  },
  updateProfile: async (payload) => {
    const { data } = await api.put('/auth/profile', payload);
    return data;
  },
  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.put('/auth/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  changePassword: async (payload) => {
    const { data } = await api.put('/auth/change-password', payload);
    return data;
  },
  deleteAccount: async () => {
    const { data } = await api.delete('/auth/delete-account');
    return data;
  },
};

export default authService;
