import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AppointmentCard from '../components/appointments/AppointmentCard';
import ReportModal from '../components/appointments/ReportModal';
import EmptyState from '../components/common/EmptyState';
import SectionHeader from '../components/common/SectionHeader';
import appointmentService from '../services/appointmentService';

function DoctorCancelModal({ open, appointment, message, submitting, onChangeMessage, onClose, onSubmit }) {
  if (!open || !appointment) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end bg-slate-900/50 p-0 sm:items-center sm:p-4"
      >
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-xl sm:rounded-3xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Cancel Appointment</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Send a message to the patient explaining why this appointment is cancelled.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={submitting}
            >
              Close
            </button>
          </div>

          <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
            <p><span className="font-medium">Patient:</span> {appointment.patient_name || 'N/A'}</p>
            <p><span className="font-medium">Appointment ID:</span> {appointment.appointment_id}</p>
          </div>

          <label htmlFor="doctor-cancel-message" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Cancellation message
          </label>
          <textarea
            id="doctor-cancel-message"
            rows={4}
            value={message}
            onChange={(e) => onChangeMessage(e.target.value)}
            placeholder="Write a short message for the patient..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-brand-300 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="secondary-button w-full sm:w-auto" disabled={submitting}>
              Keep Appointment
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!message.trim() || submitting}
              className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const getDoctorStatusOptions = (currentStatus) => {
  if (currentStatus === 'pending') {
    return ['confirmed', 'cancelled'];
  }

  if (currentStatus === 'confirmed') {
    return ['cancelled'];
  }

  return [currentStatus];
};

function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [reportingAppointment, setReportingAppointment] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [cancelMessage, setCancelMessage] = useState('');
  const [sendingCancel, setSendingCancel] = useState(false);

  const loadAppointments = async () => {
    try {
      const res = await appointmentService.getDoctorAppointments();
      setAppointments(res.data || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const [selectResetKey, setSelectResetKey] = useState(0);
  const updateStatus = async (id, status) => {
    try {
      if (status === 'cancelled') {
        const appointment = appointments.find((item) => item.appointment_id === id) || null;
        setCancellingAppointment(appointment);
        setCancelMessage('');
        return;
      }

      await appointmentService.updateStatus(id, status);
      toast.success('Status updated');
      loadAppointments();
      setSelectResetKey((k) => k + 1); // force select reset
    } catch (error) {
      toast.error(error.message);
    }
  };

  const closeCancelModal = () => {
    setCancellingAppointment(null);
    setCancelMessage('');
  };

  const confirmCancelStatus = async () => {
    if (!cancellingAppointment || !cancelMessage.trim()) {
      toast.error('Cancellation message is required.');
      return;
    }

    try {
      setSendingCancel(true);
      await appointmentService.updateStatus(
        cancellingAppointment.appointment_id,
        'cancelled',
        cancelMessage.trim()
      );
      toast.success('Appointment cancelled and patient notified');
      closeCancelModal();
      loadAppointments();
      setSelectResetKey((k) => k + 1);
    } catch (error) {
      toast.error(error.message || 'Failed to cancel appointment');
    } finally {
      setSendingCancel(false);
    }
  };

  const handleOpenReport = (appointment) => {
    setReportingAppointment(appointment);
    setReportReason('');
    setReportDescription('');
  };

  const handleCloseReport = () => {
    setReportingAppointment(null);
    setReportReason('');
    setReportDescription('');
  };

  const onReportIssue = async ({ appointmentId, patientId, doctorId, reason, description = '' }) => {
    await appointmentService.reportIssueToAdmin({ appointmentId, patientId, doctorId, reason, description });
  };

  const handleSendReport = async () => {
    if (!reportingAppointment || !reportReason) {
      return;
    }

    try {
      setSendingReport(true);
      await onReportIssue({
        appointmentId: reportingAppointment.appointment_id,
        patientId: reportingAppointment.patient_id,
        doctorId: reportingAppointment.doctor_id,
        reason: reportReason,
        description: reportDescription.trim(),
      });
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.appointment_id === reportingAppointment.appointment_id
            ? { ...appointment, issue_report_id: appointment.issue_report_id || 'reported' }
            : appointment
        )
      );
      toast.success('Issue reported successfully');
      handleCloseReport();
    } catch (error) {
      toast.error(error?.message || 'Failed to report issue');
    } finally {
      setSendingReport(false);
    }
  };

  // Filtered appointments
  const filteredAppointments = (() => {
    if (filter === 'all') return appointments;
    if (filter === 'upcoming') return appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
    if (filter === 'completed') return appointments.filter(a => a.status === 'completed');
    if (filter === 'cancelled') return appointments.filter(a => a.status === 'cancelled' || a.status === 'canceled');
    return appointments;
  })();

  return (
    <section className="space-y-4">
      <DoctorCancelModal
        open={Boolean(cancellingAppointment)}
        appointment={cancellingAppointment}
        message={cancelMessage}
        submitting={sendingCancel}
        onChangeMessage={setCancelMessage}
        onClose={closeCancelModal}
        onSubmit={confirmCancelStatus}
      />

      <SectionHeader title="Appointment Management" subtitle="Update statuses and keep patient communication clear and current." />

      {/* Filter Dropdown */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label htmlFor="appointment-filter" className="text-sm font-medium text-slate-600 dark:text-slate-300 mr-2">Filter:</label>
        <select
          id="appointment-filter"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <AnimatePresence initial={false} mode="wait">
          {filteredAppointments.length ? (
            filteredAppointments.map((item) => (
              <motion.div
                key={item.appointment_id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.32, ease: 'easeInOut' }}
              >
                <AppointmentCard
                  appointment={item}
                  role="doctor"
                  actions={
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <select
                        key={selectResetKey + '-' + item.appointment_id}
                        value=""
                        onChange={(e) => updateStatus(item.appointment_id, e.target.value)}
                        disabled={!['pending', 'confirmed'].includes(item.status)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 sm:w-44"
                      >
                        <option value="" disabled>
                          Change status
                        </option>
                        {getDoctorStatusOptions(item.status).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {['completed', 'cancelled', 'canceled'].includes(item.status) && (
                        <button
                          type="button"
                          onClick={() => handleOpenReport(item)}
                          disabled={Boolean(item.issue_report_id)}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-700 sm:ml-auto"
                        >
                          {item.issue_report_id ? 'Reported' : 'Report'}
                        </button>
                      )}
                    </div>
                  }
                />
              </motion.div>
            ))
          ) : (
            <EmptyState title="No appointments" description="Appointments will appear here when patients book your slots." />
          )}
        </AnimatePresence>
      </div>

      <ReportModal
        open={Boolean(reportingAppointment)}
        appointment={reportingAppointment}
        reason={reportReason}
        description={reportDescription}
        submitting={sendingReport}
        onReasonChange={setReportReason}
        onDescriptionChange={setReportDescription}
        onClose={handleCloseReport}
        onSubmit={handleSendReport}
      />
    </section>
  );
}

export default DoctorAppointmentsPage;
