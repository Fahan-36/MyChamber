import { motion } from 'framer-motion';
import { CalendarDays, CalendarX2, Clock3 } from 'lucide-react';
import { formatDate, formatAppointmentTime } from '../../utils/date';

function ConfirmedSlotsCard({ slots = [] }) {
  return (
    <section className="glass-card rounded-3xl p-6">
      <h2 className="mb-4 font-display text-xl font-bold text-slate-900 dark:text-white">Confirmed Booked Slots</h2>
      <div className="space-y-2">
        {slots.length > 0 ? (
          slots.map((slot) => (
            <div
              key={slot.appointment_id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex-1">
                <p className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                  <CalendarDays size={14} />
                  {formatDate(slot.appointment_date)}
                </p>
                <p className="ml-5 mt-0.5 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Clock3 size={14} />
                  {formatAppointmentTime(slot.time_slot)}
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Confirmed
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative mb-3"
              aria-hidden="true"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.18, 0.35] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl bg-cyan-200/60 blur-md dark:bg-cyan-500/20"
              />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 text-cyan-700 dark:from-cyan-500/20 dark:to-teal-500/20 dark:text-cyan-300">
                <CalendarX2 size={28} />
              </div>
            </motion.div>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No confirmed booked slots at the moment.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ConfirmedSlotsCard;
