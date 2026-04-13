const express = require('express');
const { body } = require('express-validator');
const { authenticate, isPatient } = require('../middleware/auth');
const { submitDoctorReview, getDoctorReviews, getDoctorRatingSummary } = require('../controllers/reviewController');

const router = express.Router();

// @route   POST /api/reviews
// @desc    Submit a review for a completed appointment
// @access  Private (Patient only)
router.post('/', [
  authenticate,
  isPatient,
  body('appointment_id').isInt({ min: 1 }).withMessage('Valid appointment ID is required'),
  body('doctor_id').isInt({ min: 1 }).withMessage('Valid doctor ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('review_text')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review text must not exceed 1000 characters'),
], submitDoctorReview);

// @route   GET /api/reviews/doctor/:doctorId
// @desc    Get all reviews for a doctor
// @access  Public
router.get('/doctor/:doctorId', getDoctorReviews);

// @route   GET /api/reviews/doctor/:doctorId/summary
// @desc    Get rating summary (average + breakdown) for a doctor
// @access  Public
router.get('/doctor/:doctorId/summary', getDoctorRatingSummary);

module.exports = router;
