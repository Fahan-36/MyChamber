import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppointmentCard from '../components/appointments/AppointmentCard';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewDisplay from '../components/reviews/ReviewDisplay';
import EmptyState from '../components/common/EmptyState';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import SectionHeader from '../components/common/SectionHeader';
import appointmentService from '../services/appointmentService';
import reviewService from '../services/reviewService';
import { isUpcomingAppointmentByStatus } from '../utils/date';

// --- Cancellation Confirmation Modal ---------------------------------------------------

function CancelModal({ onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <h2 id="cancel-modal-title" className="mb-2 font-display text-lg font-bold text-slate-900 dark:text-white">
          Cancel Appointment
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to cancel this appointment? This action cannot be undone and the time slot
          will become available for other patients.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Keep Appointment
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-95"
          >
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------

function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState(null); // { id, appointment }

  // Per-appointment review submitting state: { [appointmentId]: boolean }
  const [submittingReview, setSubmittingReview] = useState({});

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getPatientAppointments();
      setAppointments(res.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // --- Cancellation ----------------------------------------------------------------
  const requestCancel = (id, appointment) => {
    if (!appointment) {
      toast.error('Invalid appointment data');
      return;
    }
    setCancelTarget({ id, appointment });
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    const { id } = cancelTarget;
    setCancelTarget(null);
    try {
      await appointmentService.cancel(id);
      toast.success('Appointment cancelled');
      loadAppointments();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const dismissCancel = () => setCancelTarget(null);

  // --- Review submission -----------------------------------------------------------
  const handleReviewSubmit = async (appointment, rating, reviewText) => {
    const apptId = appointment.appointment_id;
    setSubmittingReview((prev) => ({ ...prev, [apptId]: true }));
    try {
      const res = await reviewService.submitReview({
        appointment_id: apptId,
        doctor_id: appointment.doctor_id,
        rating,
        review_text: reviewText,
      });

      // Optimistically update the appointment in local state so the UI
      // immediately switches from the form to ReviewDisplay without a reload.
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointment_id === apptId
            ? {
                ...a,
                review_id: res.data?.id ?? 1,
                review_rating: rating,
                review_text: reviewText || null,
              }
            : a
        )
      );

      toast.success('Review submitted — thank you!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingReview((prev) => ({ ...prev, [apptId]: false }));
    }
  };

  return (
    <>
      {cancelTarget && (
        <CancelModal onConfirm={confirmCancel} onClose={dismissCancel} />
      )}

      <section className="space-y-4">
        <SectionHeader
          title="My Appointments"
          subtitle="Review your booking history and cancel upcoming visits when needed."
        />

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : appointments.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {appointments.map((item) => {
              const canCancel = isUpcomingAppointmentByStatus(item);
              const isCompleted = String(item.status || '').toLowerCase() === 'completed';
              const hasReview = Boolean(item.review_id);

              // Build the review slot (only for patient-facing completed appointments)
              let reviewSlot = null;
              if (isCompleted) {
                if (hasReview) {
                  reviewSlot = (
                    <ReviewDisplay
                      rating={item.review_rating}
                      reviewText={item.review_text}
                    />
                  );
                } else {
                  reviewSlot = (
                    <ReviewForm
                      appointmentId={item.appointment_id}
                      doctorId={item.doctor_id}
                      doctorName={item.doctor_name}
                      submitting={Boolean(submittingReview[item.appointment_id])}
                      onSubmit={(rating, reviewText) =>
                        handleReviewSubmit(item, rating, reviewText)
                      }
                    />
                  );
                }
              }

              return (
                <div key={item.appointment_id} className="h-full">
                  <AppointmentCard
                    appointment={item}
                    role="patient"
                    reviewSlot={reviewSlot}
                    actions={
                      canCancel ? (
                        <button
                          type="button"
                          onClick={() => requestCancel(item.appointment_id, item)}
                          className="secondary-button text-rose-600"
                        >
                          Cancel
                        </button>
                      ) : null
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No appointments yet" description="Your booked appointments will appear here." />
        )}
      </section>
    </>
  );
}

export default PatientAppointmentsPage;
