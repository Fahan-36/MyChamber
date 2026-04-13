const { validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');

const parseTimeToSeconds = (value) => {
  const [hh, mm, ss] = String(value).split(':').map(Number);
  if (
    !Number.isInteger(hh) ||
    !Number.isInteger(mm) ||
    !Number.isInteger(ss) ||
    hh < 0 || hh > 23 ||
    mm < 0 || mm > 59 ||
    ss < 0 || ss > 59
  ) {
    return null;
  }

  return (hh * 3600) + (mm * 60) + ss;
};

const validateScheduleInput = ({ start_time, end_time, slot_duration, start_date, end_date }) => {
  if (!start_date || !end_date) {
    return { valid: false, message: 'Start date and end date are required.' };
  }

  if (start_date > end_date) {
    return { valid: false, message: 'End date cannot be before start date.' };
  }

  const startSeconds = parseTimeToSeconds(start_time);
  const endSeconds = parseTimeToSeconds(end_time);
  const duration = Number(slot_duration);

  if (startSeconds === null || endSeconds === null) {
    return { valid: false, message: 'Invalid time format. Use HH:MM:SS.' };
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    return { valid: false, message: 'Appointment duration must be a positive integer.' };
  }

  if (duration < 5 || duration > 60) {
    return { valid: false, message: 'Appointment duration must be between 5 and 60 minutes.' };
  }

  if (startSeconds >= endSeconds) {
    return { valid: false, message: 'Available From must be earlier than Available Until.' };
  }

  if ((endSeconds - startSeconds) < (duration * 60)) {
    return { valid: false, message: 'Appointment duration must fit inside the selected time range.' };
  }

  return { valid: true };
};

const handleScheduleDbError = (error, res) => {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Schedule for this weekday already exists. Please edit the existing entry.'
    });
  }

  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({
      success: false,
      message: 'Database is not updated for date-range schedules. Run: migrations/add_schedule_date_range.sql'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Server error'
  });
};

// @desc    Create doctor profile
// @route   POST /api/doctors/profile
// @access  Private (Doctor only)
const createDoctorProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      specialization,
      qualification,
      bmdc_registration_number,
      consultation_fee,
      chamber_address,
      chamber_latitude = null,
      chamber_longitude = null
    } = req.body;

    // Check if profile already exists
    const existingProfile = await Doctor.findByUserId(req.user.id);
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Doctor profile already exists'
      });
    }

    // Create doctor profile
    const doctorId = await Doctor.create({
      user_id: req.user.id,
      specialization,
      qualification,
      bmdc_registration_number,
      consultation_fee,
      chamber_address,
      chamber_latitude,
      chamber_longitude
    });

    const doctorProfile = await Doctor.findById(doctorId);

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: doctorProfile
    });
  } catch (error) {
    console.error('Create doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.getAll();

    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search doctors by specialization
// @route   GET /api/doctors/search?specialization=cardiology
// @access  Public
const searchDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    if (!specialization) {
      return res.status(400).json({
        success: false,
        message: 'Specialization parameter is required'
      });
    }

    const doctors = await Doctor.searchBySpecialization(specialization);

    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor details by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get doctor's schedule
    const schedule = await DoctorSchedule.getByDoctorId(id);

    res.json({
      success: true,
      data: {
        ...doctor,
        schedule
      }
    });
  } catch (error) {
    console.error('Get doctor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (Doctor only)
const updateDoctorProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      specialization,
      qualification,
      bmdc_registration_number,
      consultation_fee,
      chamber_address,
      chamber_latitude = null,
      chamber_longitude = null
    } = req.body;

    // Get doctor profile
    let doctorProfile = await Doctor.findByUserId(req.user.id);
    
    // If doctor profile doesn't exist, create it
    if (!doctorProfile) {
      const doctorId = await Doctor.create({
        user_id: req.user.id,
        specialization,
        qualification,
        bmdc_registration_number,
        consultation_fee,
        chamber_address,
        chamber_latitude,
        chamber_longitude
      });
      doctorProfile = await Doctor.findById(doctorId);
      return res.status(201).json({
        success: true,
        message: 'Doctor profile created successfully',
        data: doctorProfile
      });
    }

    // Update profile
    await Doctor.update(doctorProfile.doctor_id, {
      specialization,
      qualification,
      bmdc_registration_number: bmdc_registration_number ?? doctorProfile.bmdc_registration_number,
      consultation_fee,
      chamber_address,
      chamber_latitude,
      chamber_longitude
    });

    const updatedProfile = await Doctor.findById(doctorProfile.doctor_id);

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add doctor schedule
// @route   POST /api/doctors/schedule
// @access  Private (Doctor only)
const addSchedule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { day_of_week, start_time, end_time, slot_duration, start_date, end_date } = req.body;

    const validation = validateScheduleInput({ start_time, end_time, slot_duration, start_date, end_date });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Get doctor profile or auto-create if missing
    let doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile before adding schedules'
      });
    }

    const duplicateDay = await DoctorSchedule.existsByDoctorAndDay(doctorProfile.doctor_id, day_of_week);
    if (duplicateDay) {
      return res.status(409).json({
        success: false,
        message: `Schedule for ${day_of_week} already exists. Please edit the existing entry.`
      });
    }

    // Create schedule
    await DoctorSchedule.create({
      doctor_id: doctorProfile.doctor_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration,
      start_date,
      end_date
    });

    const schedule = await DoctorSchedule.getByDoctorId(doctorProfile.doctor_id);

    res.status(201).json({
      success: true,
      message: 'Schedule added successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Add schedule error:', error);
    return handleScheduleDbError(error, res);
  }
};

// @desc    Get doctor's own schedule
// @route   GET /api/doctors/schedule
// @access  Private (Doctor only)
const getMySchedule = async (req, res) => {
  try {
    // Get doctor profile
    let doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.json({
        success: true,
        data: []
      });
    }

    const schedule = await DoctorSchedule.getByDoctorId(doctorProfile.doctor_id);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Get my schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update doctor schedule
// @route   PUT /api/doctors/schedule/:id
// @access  Private (Doctor only)
const updateSchedule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { day_of_week, start_time, end_time, slot_duration, start_date, end_date } = req.body;

    const validation = validateScheduleInput({ start_time, end_time, slot_duration, start_date, end_date });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Get doctor profile
    const doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile before managing schedules'
      });
    }

    const schedule = await DoctorSchedule.findById(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (Number(schedule.doctor_id) !== Number(doctorProfile.doctor_id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this schedule'
      });
    }

    const duplicateDay = await DoctorSchedule.existsByDoctorAndDay(doctorProfile.doctor_id, day_of_week, id);
    if (duplicateDay) {
      return res.status(409).json({
        success: false,
        message: `Schedule for ${day_of_week} already exists. Please edit the existing entry.`
      });
    }

    if (schedule.day_of_week !== day_of_week) {
      const oldDayAppointments = await Appointment.getActiveByDoctorAndWeekday(
        doctorProfile.doctor_id,
        schedule.day_of_week
      );

      if (oldDayAppointments.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot move ${schedule.day_of_week} schedule to ${day_of_week}. Existing pending/confirmed appointments still exist on ${schedule.day_of_week}.`
        });
      }
    }

    const conflicts = await Appointment.getActiveOutsideDateRangeForWeekday(
      doctorProfile.doctor_id,
      day_of_week,
      start_date,
      end_date
    );

    if (conflicts.length > 0) {
      const first = conflicts[0];
      return res.status(409).json({
        success: false,
        message: `Cannot update schedule. Existing ${first.status} appointment on ${first.appointment_date} is outside the selected date range.`
      });
    }

    // Update schedule
    const affectedRows = await DoctorSchedule.update(id, {
      day_of_week,
      start_time,
      end_time,
      slot_duration,
      start_date,
      end_date
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const updatedSchedule = await DoctorSchedule.getByDoctorId(doctorProfile.doctor_id);

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: updatedSchedule
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    return handleScheduleDbError(error, res);
  }
};

// @desc    Delete doctor schedule
// @route   DELETE /api/doctors/schedule/:id
// @access  Private (Doctor only)
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Get doctor profile
    const doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile before managing schedules'
      });
    }

    // Delete schedule
    const schedule = await DoctorSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    if (Number(schedule.doctor_id) !== Number(doctorProfile.doctor_id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this schedule'
      });
    }

    const affectedRows = await DoctorSchedule.delete(id);

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createDoctorProfile,
  getAllDoctors,
  searchDoctors,
  getDoctorById,
  updateDoctorProfile,
  addSchedule,
  getMySchedule,
  updateSchedule,
  deleteSchedule
};
