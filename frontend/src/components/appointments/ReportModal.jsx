import { AnimatePresence, motion } from 'framer-motion';
import { formatDate, formatAppointmentTime } from '../../utils/date';

const ISSUE_REASONS = [
  'Patient did not show up',
  'Patient arrived late',
  'Cancelled too late',
  'Fake booking / invalid appointment',
  'Other',
];

function ReportModal({
  open,
  appointment,
  reason,
  description,
  submitting = false,
  onReasonChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}) {
  const isReasonMissing = !reason;

  return (
    <AnimatePresence>
      {open && appointment && (
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
            className="w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:mx-auto sm:max-w-2xl sm:rounded-3xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Report to Admin</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Share what happened during this appointment.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              <p>
                <span className="font-medium">Patient:</span> {appointment.patient_name || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Date:</span> {formatDate(appointment.appointment_date)}
              </p>
              <p>
                <span className="font-medium">Time:</span> {formatAppointmentTime(appointment.time_slot)}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="issue-reason" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Reason
                </label>
                <select
                  id="issue-reason"
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-brand-300 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="" disabled>
                    Select reason
                  </option>
                  {ISSUE_REASONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="issue-description" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Description (optional)
                </label>
                <textarea
                  id="issue-description"
                  rows={6}
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Add additional context if needed..."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-brand-300 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="secondary-button w-full sm:w-auto" disabled={submitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isReasonMissing || submitting}
                className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReportModal;