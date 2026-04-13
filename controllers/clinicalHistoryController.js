// NEW CONTROLLER: Clinical History for Patient History Feature
// This does NOT modify existing appointment controller

const { validationResult } = require('express-validator');
const ClinicalHistory = require('../models/ClinicalHistory');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const fs = require('fs');
const path = require('path');

// Helper: Verify doctor owns the appointment
const verifyDoctorOwnership = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return { valid: false, error: 'Appointment not found' };
  }
  
  const doctor = await Doctor.findByUserId(userId);
  if (!doctor || appointment.doctor_id !== doctor.doctor_id) {
    return { valid: false, error: 'Unauthorized access' };
  }
  
  return { valid: true, appointment, doctor };
};

// Helper: Verify patient owns the appointment
const verifyPatientOwnership = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return { valid: false, error: 'Appointment not found' };
  }

  const patient = await Patient.findByUserId(userId);
  if (!patient || appointment.patient_id !== patient.patient_id) {
    return { valid: false, error: 'Unauthorized access' };
  }

  return { valid: true, appointment, patient };
};

// @desc    Get clinical data for an appointment
// @route   GET /api/clinical-history/:id
// @access  Private (Doctor only)
const getClinicalData = async (req, res) => {
  try {
    const { id } = req.params;
    
    const verification = await verifyDoctorOwnership(id, req.user.id);
    if (!verification.valid) {
      return res.status(404).json({ success: false, message: verification.error });
    }

    const clinicalData = await ClinicalHistory.getAppointmentClinicalData(id);
    const reports = await ClinicalHistory.getAppointmentReports(id);

    res.json({
      success: true,
      data: {
        ...clinicalData,
        reports
      }
    });
  } catch (error) {
    console.error('Get clinical data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get clinical data for a patient's own appointment
// @route   GET /api/clinical-history/patient/:id
// @access  Private (Patient only, read-only)
const getClinicalDataForPatient = async (req, res) => {
  try {
    const { id } = req.params;

    const verification = await verifyPatientOwnership(id, req.user.id);
    if (!verification.valid) {
      return res.status(404).json({ success: false, message: verification.error });
    }

    const clinicalData = await ClinicalHistory.getAppointmentClinicalData(id);
    const reports = await ClinicalHistory.getAppointmentReports(id);

    res.json({
      success: true,
      data: {
        ...clinicalData,
        reports
      }
    });
  } catch (error) {
    console.error('Get patient clinical data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Save diagnosis notes
// @route   POST /api/clinical-history/:id/diagnosis
// @access  Private (Doctor only)
const saveDiagnosis = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { notes } = req.body;

    const verification = await verifyDoctorOwnership(id, req.user.id);
    if (!verification.valid) {
      return res.status(404).json({ success: false, message: verification.error });
    }

    await ClinicalHistory.saveDiagnosisNotes(id, notes);

    res.json({
      success: true,
      message: 'Diagnosis notes saved successfully'
    });
  } catch (error) {
    console.error('Save diagnosis error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Save prescription notes
// @route   POST /api/clinical-history/:id/prescription
// @access  Private (Doctor only)
const savePrescription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { notes } = req.body;

    const verification = await verifyDoctorOwnership(id, req.user.id);
    if (!verification.valid) {
      return res.status(404).json({ success: false, message: verification.error });
    }

    await ClinicalHistory.savePrescriptionNotes(id, notes);

    res.json({
      success: true,
      message: 'Prescription saved successfully'
    });
  } catch (error) {
    console.error('Save prescription error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Save follow-up notes
// @route   POST /api/clinical-history/:id/followup
// @access  Private (Doctor only)
const saveFollowup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { notes, followupDate } = req.body;

    const verification = await verifyDoctorOwnership(id, req.user.id);
    if (!verification.valid) {
      return res.status(404).json({ success: false, message: verification.error });
    }

    await ClinicalHistory.saveFollowupNotes(id, notes, followupDate || null);

    res.json({
      success: true,
      message: 'Follow-up notes saved successfully'
    });
  } catch (error) {
    console.error('Save follow-up error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Upload report file
// @route   POST /api/clinical-history/:id/report-upload
// @access  Private (Doctor only)
const uploadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const requestedCategory = String(req.body?.category || 'report').toLowerCase();
    const fileCategory = requestedCategory === 'prescription' ? 'prescription' : 'report';

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const verification = await verifyDoctorOwnership(id, req.user.id);
    if (!verification.valid) {
      // Delete uploaded file if unauthorized
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: verification.error });
    }

    const filePath = `/uploads/reports/${req.file.filename}`;
    const fileType = req.file.mimetype;

    const reportId = await ClinicalHistory.uploadReport(id, req.file.filename, filePath, fileType, fileCategory);

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      data: {
        report_id: reportId,
        file_name: req.file.filename,
        file_path: filePath,
        file_category: fileCategory
      }
    });
  } catch (error) {
    console.error('Upload report error:', error);
    // Clean up file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete uploaded report/prescription file
// @route   DELETE /api/clinical-history/report/:reportId
// @access  Private (Doctor only)
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const parsedId = Number(reportId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid report id' });
    }

    const report = await ClinicalHistory.getReportById(parsedId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const verification = await verifyDoctorOwnership(report.appointment_id, req.user.id);
    if (!verification.valid) {
      return res.status(404).json({ success: false, message: verification.error });
    }

    const deleted = await ClinicalHistory.deleteReport(parsedId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (report.file_path) {
      const relativePath = report.file_path.replace(/^\/+/, '');
      const absolutePath = path.join(__dirname, '..', relativePath);
      fs.unlink(absolutePath, () => {
        // Best-effort cleanup
      });
    }

    return res.json({
      success: true,
      message: 'File deleted successfully',
      data: {
        report_id: parsedId,
        file_category: report.file_category || 'report'
      }
    });
  } catch (error) {
    console.error('Delete report error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getClinicalDataForPatient,
  getClinicalData,
  saveDiagnosis,
  savePrescription,
  saveFollowup,
  uploadReport,
  deleteReport
};
