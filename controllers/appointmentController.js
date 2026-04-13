const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const DoctorSchedule = require('../models/DoctorSchedule');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');

const createNotificationSafe = async (payload) => {
  try {
    await Notification.create(payload);
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

const normalizeStatus = (status = '') => {
  const lower = String(status).toLowerCase();
  return lower === 'canceled' ? 'cancelled' : lower;
};

const syncElapsedAppointmentStatuses = async (filters = {}) => {
  await Appointment.autoCancelElapsedPending(filters);
  await Appointment.autoCompleteElapsedConfirmed(filters);
};

const toDateOnly = (value) => {
  if (!value) return '';
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
};

const isDateWithinRange = (date, startDate, endDate) => {
  const d = toDateOnly(date);
  const s = toDateOnly(startDate);
  const e = toDateOnly(endDate);
  return d >= s && d <= e;
};

const isValidIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const combineDateAndTime = (dateValue, timeValue) => {
  if (!isValidIsoDate(dateValue) || !/^\d{2}:\d{2}(:\d{2})?$/.test(String(timeValue || ''))) {
    return null;
  }

  const [year, month, day] = String(dateValue).split('-').map(Number);
  const [hours, minutes, seconds = 0] = String(timeValue).split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds, 0);
};

const isFutureSlot = (dateValue, timeValue, now = new Date()) => {
  const slotDateTime = combineDateAndTime(dateValue, timeValue);
  if (!slotDateTime || Number.isNaN(slotDateTime.getTime())) return false;
  return slotDateTime.getTime() > now.getTime();
};

// Helper function to format appointment date for notifications
const formatAppointmentDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to format appointment time for notifications
const formatAppointmentTime = (timeString) => {
  if (!timeString) return '';
  // timeString is in format HH:MM:SS
  const [hours, minutes] = timeString.split(':').map(Number);
  const displayHours = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Helper function to generate time slots
const generateTimeSlots = (startTime, endTime, slotDuration) => {
  const slots = [];
  
  // Parse start time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  let currentTime = new Date();
  currentTime.setHours(startHour, startMinute, 0, 0);
  
  // Parse end time
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const endDateTime = new Date();
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  // Generate slots that fit fully in the configured time window.
  while (currentTime < endDateTime) {
    const slotEnd = new Date(currentTime.getTime() + (slotDuration * 60 * 1000));
    if (slotEnd > endDateTime) {
      break;
    }

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    
    // Format time as HH:MM:SS for database
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    // Format time for display (12-hour format)
    const displayHours = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    slots.push({
      time: displayTime,
      timeValue: timeString
    });
    
    // Add slot duration
    currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
  }
  
  return slots;
};

// Helper function to get day name from date
const getDayName = (dateString) => {
  // Parse YYYY-MM-DD explicitly to avoid timezone day-shift bugs.
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(dateString);
  return days[date.getDay()];
};

// @desc    Get available time slots for a doctor on a specific date
// @route   GET /api/appointments/slots/:doctorId/:date
// @access  Public
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const now = new Date();
    const today = toDateOnly(now);

    if (!isValidIsoDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    if (date < today) {
      return res.json({
        success: true,
        message: 'Past dates are not available for booking.',
        data: []
      });
    }

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get day of week from date
    const dayOfWeek = getDayName(date);

    // Get doctor's schedule for that day
    const schedule = await DoctorSchedule.getByDoctorAndDay(doctorId, dayOfWeek);
    
    if (!schedule) {
      return res.json({
        success: true,
        message: `Doctor is not available on ${dayOfWeek}.`,
        data: []
      });
    }

    if (!isDateWithinRange(date, schedule.start_date, schedule.end_date)) {
      return res.json({
        success: true,
        message: `Doctor is unavailable on ${date}.`,
        data: []
      });
    }

    // Generate all possible time slots
    const allSlots = generateTimeSlots(
      schedule.start_time,
      schedule.end_time,
      schedule.slot_duration
    );

    // Remove already elapsed slots for today using server system time.
    const filteredSlots = allSlots.filter((slot) => isFutureSlot(date, slot.timeValue, now));

    // Get booked slots for this date
    const bookedSlots = await Appointment.getBookedSlots(doctorId, date);
    
    // Mark slots as booked or available
    const slotsWithStatus = filteredSlots.map(slot => {
      const isBooked = bookedSlots.some(bookedTime => {
        const bookedTimeStr = bookedTime.toString().substring(0, 8); // Extract HH:MM:SS
        return bookedTimeStr === slot.timeValue;
      });
      
      return {
        time: slot.time,
        timeValue: slot.timeValue,
        status: isBooked ? 'booked' : 'available'
      };
    });

    res.json({
      success: true,
      data: slotsWithStatus
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Book an appointment
// @route   POST /api/appointments/book
// @access  Private (Patient only)
const bookAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { doctor_id, appointment_date, time_slot } = req.body;
    const now = new Date();
    const today = toDateOnly(now);

    if (!isValidIsoDate(appointment_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date format. Expected YYYY-MM-DD.'
      });
    }

    if (appointment_date < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book an appointment for a past date.'
      });
    }

    if (!isFutureSlot(appointment_date, time_slot, now)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book an appointment for a past or elapsed time slot.'
      });
    }

    // Get patient profile
    const patientProfile = await Patient.findByUserId(req.user.id);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Validate doctor exists
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if slot is available
    const isAvailable = await Appointment.isSlotAvailable(doctor_id, appointment_date, time_slot);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Block multiple appointments with the same doctor on the same day for the same patient.
    const alreadyBookedWithDoctorOnDate = await Appointment.hasPatientAppointmentWithDoctorOnDate(
      patientProfile.patient_id,
      doctor_id,
      appointment_date
    );
    if (alreadyBookedWithDoctorOnDate) {
      return res.status(400).json({
        success: false,
        message: 'You already have an appointment with this doctor on this date. Only one appointment per doctor per day is allowed.'
      });
    }

    // Verify the slot exists in doctor's schedule
    const dayOfWeek = getDayName(appointment_date);
    const schedule = await DoctorSchedule.getByDoctorAndDay(doctor_id, dayOfWeek);
    
    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available on this day'
      });
    }

    if (!isDateWithinRange(appointment_date, schedule.start_date, schedule.end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available on this date'
      });
    }

    // Create appointment
    const appointmentId = await Appointment.create({
      doctor_id,
      patient_id: patientProfile.patient_id,
      appointment_date,
      time_slot,
      status: 'pending'
    });

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    // Notify doctor when patient books an appointment.
    const patientDetails = await Patient.findById(patientProfile.patient_id);
    const patientName = patientDetails?.name || 'A patient';
    const formattedDate = formatAppointmentDate(appointment_date);
    const formattedTime = formatAppointmentTime(time_slot);
    await createNotificationSafe({
      user_id: doctor.user_id,
      title: 'New Appointment Booked',
      message: `${patientName} booked an appointment on ${formattedDate} at ${formattedTime}.`,
      type: 'appointment_booked',
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get patient's appointments
// @route   GET /api/appointments/patient
// @access  Private (Patient only)
const getPatientAppointments = async (req, res) => {
  try {
    // Get patient profile
    const patientProfile = await Patient.findByUserId(req.user.id);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    await syncElapsedAppointmentStatuses({ patient_id: patientProfile.patient_id });
    const appointments = await Appointment.getByPatientId(patientProfile.patient_id);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get patient appointment activity for last N days
// @route   GET /api/appointments/patient/activity?days=7
// @access  Private (Patient only)
const getPatientActivity = async (req, res) => {
  try {
    const patientProfile = await Patient.findByUserId(req.user.id);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const requestedDays = Number.parseInt(req.query.days, 10);
    const days = Number.isInteger(requestedDays) && requestedDays > 0 && requestedDays <= 30 ? requestedDays : 7;

    await syncElapsedAppointmentStatuses({ patient_id: patientProfile.patient_id });
    const appointments = await Appointment.getByPatientId(patientProfile.patient_id);

    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
    const buckets = [];
    const bucketMap = new Map();

    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - offset);

      const key = toDateOnly(date);
      const bucket = { day: formatter.format(date), count: 0 };
      buckets.push(bucket);
      bucketMap.set(key, bucket);
    }

    appointments.forEach((appointment) => {
      const appointmentDate = toDateOnly(appointment.appointment_date);
      const status = normalizeStatus(appointment.status);

      if (status === 'cancelled') {
        return;
      }

      const bucket = bucketMap.get(appointmentDate);
      if (bucket) {
        bucket.count += 1;
      }
    });

    return res.json({
      success: true,
      data: buckets
    });
  } catch (error) {
    console.error('Get patient activity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get patient's upcoming appointments
// @route   GET /api/appointments/patient/upcoming
// @access  Private (Patient only)
const getPatientUpcomingAppointments = async (req, res) => {
  try {
    // Get patient profile
    const patientProfile = await Patient.findByUserId(req.user.id);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    await syncElapsedAppointmentStatuses({ patient_id: patientProfile.patient_id });
    const appointments = await Appointment.getUpcomingByPatientId(patientProfile.patient_id);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get patient upcoming appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor
// @access  Private (Doctor only)
const getDoctorAppointments = async (req, res) => {
  try {
    // Get doctor profile
    const doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile to view appointments'
      });
    }

    await syncElapsedAppointmentStatuses({ doctor_id: doctorProfile.doctor_id });
    const appointments = await Appointment.getByDoctorId(doctorProfile.doctor_id);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor's patient history (exclude cancelled/canceled)
// @route   GET /api/appointments/doctor/history
// @access  Private (Doctor only)
const getDoctorPatientHistory = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile to view patient history'
      });
    }

    await syncElapsedAppointmentStatuses({ doctor_id: doctorProfile.doctor_id });
    const appointments = await Appointment.getByDoctorIdForHistory(doctorProfile.doctor_id);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get doctor patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor's dashboard stats (exclude cancelled/canceled)
// @route   GET /api/appointments/doctor/dashboard-stats
// @access  Private (Doctor only)
const getDoctorDashboardStats = async (req, res) => {
  try {
    const doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile to view dashboard'
      });
    }

    await syncElapsedAppointmentStatuses({ doctor_id: doctorProfile.doctor_id });
    const stats = await Appointment.getDashboardStatsByDoctorId(doctorProfile.doctor_id);

    const data = {
      cards: {
        totalAppointments: Number(stats.total_appointments || 0),
        today: Number(stats.today_appointments || 0),
        pending: Number(stats.pending_appointments || 0),
        confirmed: Number(stats.confirmed_appointments || 0),
        uniquePatients: Number(stats.unique_patients || 0),
      },
      chart: [
        { name: 'pending', value: Number(stats.pending_appointments || 0) },
        { name: 'confirmed', value: Number(stats.confirmed_appointments || 0) },
        { name: 'completed', value: Number(stats.completed_appointments || 0) },
      ]
    };

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get doctor dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor's today appointments
// @route   GET /api/appointments/doctor/today
// @access  Private (Doctor only)
const getDoctorTodayAppointments = async (req, res) => {
  try {
    // Get doctor profile
    const doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile to view today\'s appointments'
      });
    }

    await syncElapsedAppointmentStatuses({ doctor_id: doctorProfile.doctor_id });
    const appointments = await Appointment.getTodayByDoctorId(doctorProfile.doctor_id);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get doctor today appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Doctor only)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = normalizeStatus(req.body.status);
    const cancellationMessage = String(req.body.cancellation_message || '').trim();

    // Doctors can only move pending appointments to confirmed/cancelled.
    if (!['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed or cancelled status updates are allowed'
      });
    }

    // Get doctor profile
    const doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile to manage appointments'
      });
    }

    await syncElapsedAppointmentStatuses({ doctor_id: doctorProfile.doctor_id });

    // Verify appointment belongs to this doctor
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.doctor_id !== doctorProfile.doctor_id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this appointment'
      });
    }

    const currentStatus = normalizeStatus(appointment.status);

    if (['cancelled', 'completed'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Appointment is already ${currentStatus} and cannot be changed`
      });
    }

    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['cancelled']
    };

    const nextAllowedStatuses = allowedTransitions[currentStatus] || [];
    if (!nextAllowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status transition from ${currentStatus} to ${status} is not allowed`
      });
    }

    if (status === 'cancelled' && !cancellationMessage) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation message is required when cancelling an appointment.'
      });
    }

    if (status === 'cancelled') {
      await Appointment.updateStatus(id, status, 'manual', 'doctor', req.user.id);
    } else {
      await Appointment.updateStatus(id, status, null);
    }

    const patientProfile = await Patient.findById(appointment.patient_id);
    const doctorDetails = await Doctor.findById(appointment.doctor_id);
    
    if (patientProfile?.user_id) {
      const formattedDate = formatAppointmentDate(appointment.appointment_date);
      const formattedTime = formatAppointmentTime(appointment.time_slot);
      const doctorName = doctorDetails?.name ? `Dr. ${doctorDetails.name}` : 'your doctor';

      if (status === 'confirmed') {
        await createNotificationSafe({
          user_id: patientProfile.user_id,
          title: 'Appointment Confirmed',
          message: `Your appointment with ${doctorName} on ${formattedDate} at ${formattedTime} has been confirmed.`,
          type: 'appointment_confirmed',
        });
      }

      if (status === 'cancelled') {
        const patientMessage = cancellationMessage
          ? ` Message from doctor: "${cancellationMessage}"`
          : '';
        await createNotificationSafe({
          user_id: patientProfile.user_id,
          title: 'Appointment Cancelled',
          message: `Your appointment with ${doctorName} on ${formattedDate} at ${formattedTime} has been cancelled.${patientMessage}`,
          type: 'appointment_cancelled_by_doctor',
        });
      }

    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully'
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Patient only)
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    // Get patient profile
    const patientProfile = await Patient.findByUserId(req.user.id);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Verify appointment belongs to this patient
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.patient_id !== patientProfile.patient_id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this appointment'
      });
    }

    // Check if appointment can be cancelled (only completed and cancelled appointments cannot be cancelled)
    const status = String(appointment.status || '').trim().toLowerCase();

    if (status === 'completed' || status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This appointment cannot be cancelled'
      });
    }

    // Allow cancellation at any time for pending or confirmed appointments
    await Appointment.cancel(id, 'patient', req.user.id);

    const doctor = await Doctor.findById(appointment.doctor_id);
    const patientDetails = await Patient.findById(appointment.patient_id);
    
    if (doctor?.user_id) {
      const patientName = patientDetails?.name || 'A patient';
      const formattedDate = formatAppointmentDate(appointment.appointment_date);
      const formattedTime = formatAppointmentTime(appointment.time_slot);
      await createNotificationSafe({
        user_id: doctor.user_id,
        title: 'Appointment Cancelled',
        message: `${patientName} cancelled the appointment on ${formattedDate} at ${formattedTime}.`,
        type: 'appointment_cancelled_by_patient',
      });
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get confirmed appointments for a doctor (public view)
// @route   GET /api/appointments/confirmed/:doctorId
// @access  Public
const getConfirmedAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await syncElapsedAppointmentStatuses({ doctor_id: doctorId });
    const appointments = await Appointment.getConfirmedByDoctorId(doctorId);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get confirmed appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Report appointment issue to admin panel
// @route   POST /api/appointments/report-issue
// @access  Private (Doctor only)
const reportIssueToAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const doctorProfile = await Doctor.findByUserId(req.user.id);
    if (!doctorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your doctor profile to report appointment issues'
      });
    }

    const appointmentId = Number(req.body.appointmentId);
    const reason = String(req.body.reason || '').trim();
    const description = String(req.body.description || '').trim();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (Number(appointment.doctor_id) !== Number(doctorProfile.doctor_id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to report this appointment'
      });
    }

    const issueId = await Appointment.createIssueReport({
      appointment_id: appointmentId,
      patient_id: Number(appointment.patient_id),
      doctor_id: Number(doctorProfile.doctor_id),
      reason,
      description,
      reported_by_user_id: Number(req.user.id),
    });

    res.status(201).json({
      success: true,
      message: 'Issue reported to admin successfully',
      data: {
        issue_id: issueId,
        appointment_id: appointmentId,
      }
    });
  } catch (error) {
    console.error('Report issue to admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
};
