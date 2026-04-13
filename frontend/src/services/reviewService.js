import api from './api';

const reviewService = {
  // Submit a review for a completed appointment
  submitReview: async ({ appointment_id, doctor_id, rating, review_text }) => {
    const { data } = await api.post('/reviews', { appointment_id, doctor_id, rating, review_text });
    return data;
  },

  // Get all reviews for a doctor
  getDoctorReviews: async (doctorId) => {
    const { data } = await api.get(`/reviews/doctor/${doctorId}`);
    return data;
  },

  // Get rating summary for a doctor (average + breakdown)
  getDoctorRatingSummary: async (doctorId) => {
    const { data } = await api.get(`/reviews/doctor/${doctorId}/summary`);
    return data;
  },
};

export default reviewService;
