const express = require('express');
const { body } = require('express-validator');
const {
  getAvailableSlots,
  bookAppointment,
  getPatientAppointments,
  getPatientActivity,
  getPatientUpcomingAppointments,
  getDoctorAppointments,
  getDoctorPatientHistory,
  getDoctorDashboardStats,
  getDoctorTodayAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getConfirmedAppointments,
  reportIssueToAdmin
} = require('../controllers/appointmentController');
const { authenticate, isDoctor, isPatient } = require('../middleware/auth');

const router = express.Router();

// Public routes
// @route   GET /api/appointments/slots/:doctorId/:date
// @desc    Get available time slots for a doctor on a specific date
router.get('/slots/:doctorId/:date', getAvailableSlots);

// @route   GET /api/appointments/confirmed/:doctorId
// @desc    Get confirmed appointments for a doctor
router.get('/confirmed/:doctorId', getConfirmedAppointments);

// Patient routes
// @route   POST /api/appointments/book
// @desc    Book an appointment
router.post('/book', [
  authenticate,
  isPatient,
  body('doctor_id').isInt().withMessage('Doctor ID must be an integer'),
  body('appointment_date').isDate().withMessage('Valid appointment date is required (YYYY-MM-DD)'),
  body('time_slot').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Time slot must be in HH:MM:SS format')
], bookAppointment);

// @route   GET /api/appointments/patient
// @desc    Get all patient appointments
router.get('/patient', authenticate, isPatient, getPatientAppointments);

// @route   GET /api/appointments/patient/activity?days=7
// @desc    Get patient appointment activity for recent days
router.get('/patient/activity', authenticate, isPatient, getPatientActivity);

// @route   GET /api/appointments/patient/upcoming
// @desc    Get patient's upcoming appointments
router.get('/patient/upcoming', authenticate, isPatient, getPatientUpcomingAppointments);

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment
router.put('/:id/cancel', authenticate, isPatient, cancelAppointment);

// Doctor routes
// @route   GET /api/appointments/doctor
// @desc    Get all doctor appointments
router.get('/doctor', authenticate, isDoctor, getDoctorAppointments);

// @route   GET /api/appointments/doctor/history
// @desc    Get doctor patient history (excludes cancelled/canceled)
router.get('/doctor/history', authenticate, isDoctor, getDoctorPatientHistory);

// @route   GET /api/appointments/doctor/dashboard-stats
// @desc    Get doctor dashboard stats (excludes cancelled/canceled)
router.get('/doctor/dashboard-stats', authenticate, isDoctor, getDoctorDashboardStats);

// @route   GET /api/appointments/doctor/today
// @desc    Get doctor's today appointments
router.get('/doctor/today', authenticate, isDoctor, getDoctorTodayAppointments);

// @route   POST /api/appointments/report-issue
// @desc    Report appointment issue to admin
router.post('/report-issue', [
  authenticate,
  isDoctor,
  body('appointmentId').isInt().withMessage('Appointment ID must be an integer'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('description').optional({ values: 'falsy' }).isString().withMessage('Description must be text')
], reportIssueToAdmin);

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
router.put('/:id/status', [
  authenticate,
  isDoctor,
  body('status').isIn(['confirmed', 'cancelled', 'canceled'])
    .withMessage('Status must be one of: confirmed, cancelled, canceled'),
  body('cancellation_message').optional({ values: 'falsy' }).isString().isLength({ max: 500 })
    .withMessage('Cancellation message must be text up to 500 characters')
], updateAppointmentStatus);

module.exports = router;
