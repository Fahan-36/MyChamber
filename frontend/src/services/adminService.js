import api from './api';

const adminService = {
  getStats: async () => {
    const { data } = await api.get('/admin/stats');
    return data;
  },
  getDoctors: async () => {
    const { data } = await api.get('/admin/doctors');
    return data;
  },
  updateDoctorStatus: async (doctorId, status) => {
    const { data } = await api.put(`/admin/doctors/${doctorId}/status`, { status });
    return data;
  },
  deleteDoctor: async (doctorId) => {
    const { data } = await api.delete(`/admin/doctors/${doctorId}`);
    return data;
  },
  getPatients: async () => {
    const { data } = await api.get('/admin/patients');
    return data;
  },
  deletePatient: async (patientId) => {
    const { data } = await api.delete(`/admin/patients/${patientId}`);
    return data;
  },
  getAppointments: async () => {
    const { data } = await api.get('/admin/appointments');
    return data;
  },
  getAppointmentIssues: async () => {
    const { data } = await api.get('/admin/appointment-issues');
    return data;
  },
  getReviews: async () => {
    const { data } = await api.get('/admin/reviews');
    return data;
  },
  deleteReview: async (reviewId) => {
    const { data } = await api.delete(`/admin/reviews/${reviewId}`);
    return data;
  },
};

export default adminService;
