// NEW ROUTES: Clinical History for Patient History Feature
// This does NOT modify existing appointment routes

const express = require('express');
const { body } = require('express-validator');
const {
  getClinicalDataForPatient,
  getClinicalData,
  saveDiagnosis,
  savePrescription,
  saveFollowup,
  uploadReport,
  deleteReport
} = require('../controllers/clinicalHistoryController');
const { authenticate, isDoctor, isPatient } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Patient read-only route
// @route   GET /api/clinical-history/patient/:id
// @desc    Get clinical data for patient's own appointment
router.get('/patient/:id', authenticate, isPatient, getClinicalDataForPatient);

// All routes below require doctor authentication
router.use(authenticate, isDoctor);

// @route   GET /api/clinical-history/:id
// @desc    Get clinical data for an appointment
router.get('/:id', getClinicalData);

// @route   POST /api/clinical-history/:id/diagnosis
// @desc    Save diagnosis notes
router.post('/:id/diagnosis', [
  body('notes').optional().isString().trim()
], saveDiagnosis);

// @route   POST /api/clinical-history/:id/prescription
// @desc    Save prescription notes
router.post('/:id/prescription', [
  body('notes').optional().isString().trim()
], savePrescription);

// @route   POST /api/clinical-history/:id/followup
// @desc    Save follow-up notes
router.post('/:id/followup', [
  body('notes').optional().isString().trim(),
  body('followupDate').optional().isDate()
], saveFollowup);

// @route   POST /api/clinical-history/:id/report-upload
// @desc    Upload report file
router.post('/:id/report-upload', upload.single('file'), uploadReport);

// @route   DELETE /api/clinical-history/report/:reportId
// @desc    Delete uploaded report/prescription file
router.delete('/report/:reportId', deleteReport);

module.exports = router;
