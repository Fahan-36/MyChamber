const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getStats,
  getDoctors,
  updateDoctorStatus,
  deleteDoctor,
  getPatients,
  deletePatient,
  getAppointments,
  getAppointmentIssueReports,
  getReviews,
  deleteReview,
} = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, adminOnly);

router.get('/stats', getStats);
router.get('/doctors', getDoctors);
router.put('/doctors/:doctorId/status', [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid doctor status'),
], updateDoctorStatus);
router.delete('/doctors/:doctorId', deleteDoctor);

router.get('/patients', getPatients);
router.delete('/patients/:patientId', deletePatient);

router.get('/appointments', getAppointments);
router.get('/appointment-issues', getAppointmentIssueReports);

router.get('/reviews', getReviews);
router.delete('/reviews/:reviewId', deleteReview);

module.exports = router;
