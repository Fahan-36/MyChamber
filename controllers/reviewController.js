const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Review = require('../models/Review');

// @desc    Submit a review for a completed appointment
// @route   POST /api/reviews
// @access  Private (Patient only)
const submitDoctorReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { appointment_id, doctor_id, rating, review_text } = req.body;

    // Resolve patient from authenticated user
    const patientProfile = await Patient.findByUserId(req.user.id);
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    // Verify the appointment exists
    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ownership check: appointment must belong to this patient
    if (appointment.patient_id !== patientProfile.patient_id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to review this appointment' });
    }

    // Appointment must belong to the specified doctor
    if (Number(appointment.doctor_id) !== Number(doctor_id)) {
      return res.status(400).json({ success: false, message: 'Doctor ID does not match the appointment' });
    }

    // Only completed appointments can be reviewed
    const status = String(appointment.status || '').toLowerCase();
    if (status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed appointments can be reviewed' });
    }

    // Prevent duplicate review for the same appointment
    const existing = await Review.getReviewByAppointmentId(appointment_id);
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this appointment' });
    }

    const reviewId = await Review.createReview({
      appointment_id,
      doctor_id,
      patient_id: patientProfile.patient_id,
      rating,
      review_text: review_text ? String(review_text).trim() : null,
    });

    const created = await Review.getReviewByAppointmentId(appointment_id);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { ...created, id: reviewId },
    });
  } catch (error) {
    console.error('Submit review error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'You have already reviewed this appointment' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all reviews for a doctor
// @route   GET /api/reviews/doctor/:doctorId
// @access  Public
const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const id = Number(doctorId);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const reviews = await Review.getReviewsByDoctorId(id);

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('Get doctor reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get rating summary for a doctor (average + total)
// @route   GET /api/reviews/doctor/:doctorId/summary
// @access  Public
const getDoctorRatingSummary = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const id = Number(doctorId);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const summary = await Review.getDoctorRatingSummary(id);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get doctor rating summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitDoctorReview, getDoctorReviews, getDoctorRatingSummary };
