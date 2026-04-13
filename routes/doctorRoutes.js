const express = require('express');
const { body } = require('express-validator');
const {
  createDoctorProfile,
  getAllDoctors,
  searchDoctors,
  getDoctorById,
  updateDoctorProfile,
  addSchedule,
  getMySchedule,
  updateSchedule,
  deleteSchedule
} = require('../controllers/doctorController');
const { authenticate, isDoctor } = require('../middleware/auth');

const router = express.Router();

// Public routes
// @route   GET /api/doctors
// @desc    Get all doctors
router.get('/', getAllDoctors);

// @route   GET /api/doctors/search
// @desc    Search doctors by specialization
router.get('/search', searchDoctors);

// @route   GET /api/doctors/:id
// @desc    Get doctor details by ID
router.get('/:id', getDoctorById);

// Protected routes (Doctor only)
// @route   POST /api/doctors/profile
// @desc    Create doctor profile
router.post('/profile', [
  authenticate,
  isDoctor,
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('qualification').notEmpty().withMessage('Qualification is required'),
  body('bmdc_registration_number').notEmpty().withMessage('BMDC Registration Number is required'),
  body('consultation_fee').isNumeric().withMessage('Consultation fee must be a number'),
  body('chamber_address').notEmpty().withMessage('Chamber address is required'),
  body('chamber_latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('chamber_longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
], createDoctorProfile);

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile
router.put('/profile', [
  authenticate,
  isDoctor,
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('qualification').notEmpty().withMessage('Qualification is required'),
  body('consultation_fee').isNumeric().withMessage('Consultation fee must be a number'),
  body('chamber_address').notEmpty().withMessage('Chamber address is required'),
  body('chamber_latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('chamber_longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
], updateDoctorProfile);

// @route   POST /api/doctors/schedule
// @desc    Add doctor schedule
router.post('/schedule', [
  authenticate,
  isDoctor,
  body('day_of_week').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM:SS format'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM:SS format'),
  body('slot_duration').isInt({ min: 1 }).withMessage('Slot duration must be a positive integer'),
  body('start_date').isDate().withMessage('Valid start date is required (YYYY-MM-DD)'),
  body('end_date').isDate().withMessage('Valid end date is required (YYYY-MM-DD)')
], addSchedule);

// @route   GET /api/doctors/my/schedule
// @desc    Get doctor's own schedule
router.get('/my/schedule', authenticate, isDoctor, getMySchedule);

// @route   PUT /api/doctors/schedule/:id
// @desc    Update doctor schedule
router.put('/schedule/:id', [
  authenticate,
  isDoctor,
  body('day_of_week').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM:SS format'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM:SS format'),
  body('slot_duration').isInt({ min: 1 }).withMessage('Slot duration must be a positive integer'),
  body('start_date').isDate().withMessage('Valid start date is required (YYYY-MM-DD)'),
  body('end_date').isDate().withMessage('Valid end date is required (YYYY-MM-DD)')
], updateSchedule);

// @route   DELETE /api/doctors/schedule/:id
// @desc    Delete doctor schedule
router.delete('/schedule/:id', authenticate, isDoctor, deleteSchedule);

module.exports = router;
