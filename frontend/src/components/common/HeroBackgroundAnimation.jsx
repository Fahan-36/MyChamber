import { motion } from 'framer-motion';
import { Activity, CalendarDays, HeartPulse, Stethoscope } from 'lucide-react';

function HeroBackgroundAnimation({ reduceMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        animate={reduceMotion ? undefined : { x: [0, 16, 0], y: [0, -12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/15"
      />

      <motion.div
        animate={reduceMotion ? undefined : { x: [0, -14, 0], y: [0, 14, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-[-3.5rem] top-1/4 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-500/15"
      />

      <motion.div
        animate={reduceMotion ? undefined : { x: [0, 10, 0], y: [0, 12, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-4.5rem] left-1/3 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-400/10"
      />

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -8, 0], opacity: [0.16, 0.24, 0.16] }}
        transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[12%] top-[30%] text-brand-500/25 dark:text-brand-400/20"
      >
        <Stethoscope size={22} />
      </motion.div>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, 10, 0], opacity: [0.14, 0.22, 0.14] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute right-[16%] top-[22%] text-sky-500/25 dark:text-sky-400/20"
      >
        <CalendarDays size={20} />
      </motion.div>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -9, 0], opacity: [0.14, 0.22, 0.14] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute bottom-[18%] left-[22%] text-teal-500/25 dark:text-teal-300/20"
      >
        <HeartPulse size={20} />
      </motion.div>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, 9, 0], opacity: [0.14, 0.22, 0.14] }}
        transition={{ duration: 7.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute bottom-[26%] right-[28%] text-brand-500/25 dark:text-brand-300/20"
      >
        <Activity size={18} />
      </motion.div>
    </div>
  );
}

export default HeroBackgroundAnimation;
