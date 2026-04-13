import api from './api';

const appointmentService = {
  getAvailableSlots: async (doctorId, date) => {
    const { data } = await api.get(`/appointments/slots/${doctorId}/${date}`);
    return data;
  },
  getConfirmedAppointments: async (doctorId) => {
    const { data } = await api.get(`/appointments/confirmed/${doctorId}`);
    return data;
  },
  book: async (payload) => {
    const { data } = await api.post('/appointments/book', payload);
    return data;
  },
  getPatientAppointments: async () => {
    const { data } = await api.get('/appointments/patient');
    return data;
  },
  getPatientHistory: async () => {
    const { data } = await api.get('/appointments/patient');
    return data;
  },
  getPatientActivity: async (days = 7) => {
    const { data } = await api.get('/appointments/patient/activity', { params: { days } });
    return data;
  },
  getPatientUpcoming: async () => {
    const { data } = await api.get('/appointments/patient/upcoming');
    return data;
  },
  cancel: async (id) => {
    const { data } = await api.put(`/appointments/${id}/cancel`);
    return data;
  },
  getDoctorAppointments: async () => {
    const { data } = await api.get('/appointments/doctor');
    return data;
  },
  getDoctorPatientHistory: async () => {
    const { data } = await api.get('/appointments/doctor/history');
    return data;
  },
  getDoctorDashboardStats: async () => {
    const { data } = await api.get('/appointments/doctor/dashboard-stats');
    return data;
  },
  getDoctorToday: async () => {
    const { data } = await api.get('/appointments/doctor/today');
    return data;
  },
  reportIssueToAdmin: async ({ appointmentId, patientId, doctorId, reason, description }) => {
    const { data } = await api.post('/appointments/report-issue', {
      appointmentId,
      patientId,
      doctorId,
      reason,
      description,
    });
    return data;
  },
  updateStatus: async (id, status, cancellationMessage = '') => {
    const payload = { status };
    if (status === 'cancelled') {
      payload.cancellation_message = cancellationMessage;
    }

    const { data } = await api.put(`/appointments/${id}/status`, payload);
    return data;
  },
  
  // Clinical History API methods
  getPatientClinicalData: async (appointmentId) => {
    const { data } = await api.get(`/clinical-history/patient/${appointmentId}`);
    return data;
  },
  getClinicalData: async (appointmentId) => {
    const { data } = await api.get(`/clinical-history/${appointmentId}`);
    return data;
  },
  saveDiagnosis: async (appointmentId, notes) => {
    const { data } = await api.post(`/clinical-history/${appointmentId}/diagnosis`, { notes });
    return data;
  },
  savePrescription: async (appointmentId, notes) => {
    const { data } = await api.post(`/clinical-history/${appointmentId}/prescription`, { notes });
    return data;
  },
  saveFollowup: async (appointmentId, notes, followupDate) => {
    const { data } = await api.post(`/clinical-history/${appointmentId}/followup`, { notes, followupDate });
    return data;
  },
  uploadReport: async (appointmentId, file, category = 'report') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const { data } = await api.post(`/clinical-history/${appointmentId}/report-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  deleteReport: async (reportId) => {
    const { data } = await api.delete(`/clinical-history/report/${reportId}`);
    return data;
  },
};

export default appointmentService;
