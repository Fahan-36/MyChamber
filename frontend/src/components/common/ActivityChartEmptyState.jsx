import { CalendarDays, Stethoscope, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

function ActivityChartEmptyState() {
  return (
    <div className="grid h-[82%] place-items-center rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-center dark:border-slate-700">
      <div className="flex max-w-xs flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative mb-4"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-teal-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
          >
            <TrendingUp className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          </motion.div>

          <motion.div
            animate={{ y: [0, -3, 0], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="absolute -left-8 top-1/2 -translate-y-1/2 rounded-xl border border-emerald-100 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </motion.div>

          <motion.div
            animate={{ y: [0, -3, 0], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -right-8 top-1/2 -translate-y-1/2 rounded-xl border border-teal-100 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </motion.div>
        </motion.div>

        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Not enough appointment activity yet to show trend analytics.
        </p>
      </div>
    </div>
  );
}

export default ActivityChartEmptyState;
