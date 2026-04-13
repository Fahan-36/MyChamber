import { useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, MapPin, Phone, UserRound } from 'lucide-react';
import { formatDate, formatAppointmentTime, statusColor } from '../../utils/date';

/**
 * AppointmentCard
 *
 * Props:
 *   appointment  {object}          Appointment data (may include review_id, review_rating, review_text)
 *   role         {'patient'|'doctor'}
 *   actions      {ReactNode}       Action buttons rendered at the bottom
 *   actionsClassName {string}      Optional className extension for actions wrapper
 *   reviewSlot   {ReactNode}       Optional review form / display (patient-only, completed status)
 */
function AppointmentCard({ appointment, role = 'patient', actions, actionsClassName = '', reviewSlot }) {
  const [showCancellationDetails, setShowCancellationDetails] = useState(false);
  const isCancelled = String(appointment.status || '').trim().toLowerCase() === 'cancelled';
  const cancelledByRole = String(appointment.cancelled_by_role || '').trim().toLowerCase();
  const cancelledByName = appointment.cancelled_by_name || '';

  const formatCancelledTime = (value) => {
    if (!value) return 'Not recorded';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded';

    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const displayHours = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const cancelledByLabel = (() => {
    if (!isCancelled) return null;

    if (cancelledByRole === 'doctor') {
      if (role === 'doctor') return 'You';
      return cancelledByName ? `Dr. ${cancelledByName}` : `Dr. ${appointment.doctor_name || 'Doctor'}`;
    }

    if (cancelledByRole === 'patient') {
      if (role === 'patient') return 'You';
      return cancelledByName || appointment.patient_name || 'Patient';
    }

    if (cancelledByRole === 'system') {
      return 'System';
    }

    if (role === 'doctor' && appointment.patient_name) return appointment.patient_name;
    if (role === 'patient' && appointment.doctor_name) return `Dr. ${appointment.doctor_name}`;

    return null;
  })();

  const cancelledDateLabel = isCancelled
    ? formatDate(appointment.cancelled_at || appointment.updated_at)
    : '';

  const cancelledTimeLabel = isCancelled
    ? formatCancelledTime(appointment.cancelled_at || appointment.updated_at)
    : '';

  return (
    <article className="glass-card flex h-full flex-col rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          {role === 'doctor' ? appointment.patient_name : `Dr. ${appointment.doctor_name}`}
        </h3>
        <span className={`min-w-[96px] whitespace-nowrap rounded-full px-3 py-1 text-center text-xs font-semibold capitalize ${statusColor(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>

      <div className="flex-1 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
        <p className="flex items-center gap-2"><CalendarDays size={14} /> {formatDate(appointment.appointment_date)}</p>
        <p className="flex items-center gap-2"><Clock3 size={14} /> {formatAppointmentTime(appointment.time_slot)}</p>
        {role === 'patient' ? (
          <>
            <p className="flex items-center gap-2"><UserRound size={14} /> {appointment.specialization}</p>
            <p className="flex items-center gap-2"><MapPin size={14} /> {appointment.chamber_address}</p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2"><UserRound size={14} /> Patient ID: {appointment.patient_code || 'N/A'}</p>
            <p className="flex items-center gap-2"><Phone size={14} /> {appointment.patient_phone || 'Phone N/A'}</p>
          </>
        )}
        {isCancelled && (
          <div className="mt-2 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100/70 p-3 text-xs text-rose-800 dark:border-rose-900/70 dark:from-rose-500/15 dark:to-rose-500/5 dark:text-rose-100">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white dark:bg-rose-500">
                  <AlertTriangle size={14} />
                </span>
                <p className="font-semibold tracking-wide">Appointment Cancelled</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancellationDetails((prev) => !prev)}
                className="rounded-full border border-rose-300 bg-white/70 px-3 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-white dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/45"
                aria-expanded={showCancellationDetails}
              >
                {showCancellationDetails ? 'Hide details' : 'Cancellation details'}
              </button>
            </div>

            {showCancellationDetails && (
              <div className="mt-2 grid gap-1.5 pl-8">
                {cancelledByLabel && (
                  <p className="leading-5">
                    <span className="font-semibold">Cancelled by:</span> {cancelledByLabel}
                  </p>
                )}
                <p className="leading-5">
                  <span className="font-semibold">Cancelled on:</span> {cancelledDateLabel}
                </p>
                <p className="leading-5">
                  <span className="font-semibold">Cancelled time:</span> {cancelledTimeLabel}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review form or display — only rendered for completed patient appointments */}
      {reviewSlot}

      {actions && (
        <div className={`mt-4 flex min-h-[42px] flex-wrap items-center gap-2 ${actionsClassName}`}>{actions}</div>
      )}
    </article>
  );
}

export default AppointmentCard;
