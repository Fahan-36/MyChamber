import { AnimatePresence, motion } from 'framer-motion';
import { formatAppointmentTime } from '../../utils/date';

function BookingModal({ open, onClose, onConfirm, doctorName, date, slot }) {
  const displayTime = slot ? formatAppointmentTime(slot) : '';
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="glass-card w-full max-w-md rounded-3xl p-6"
          >
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Confirm Appointment</h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              You are about to book <strong>Dr. {doctorName}</strong> on <strong>{date}</strong> at <strong>{displayTime}</strong>.
            </p>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={onClose} className="secondary-button w-full">Cancel</button>
              <button type="button" onClick={onConfirm} className="primary-button w-full">Confirm</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BookingModal;
