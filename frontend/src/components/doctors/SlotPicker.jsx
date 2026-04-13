import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
};

function SlotPicker({ slots = [], selectedSlot, onSelect }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-2 md:grid-cols-3"
    >
      {slots.map((slot) => {
        const disabled = slot.status === 'booked' || slot.status === 'past';
        const active = selectedSlot === slot.timeValue;

        return (
          <motion.button
            variants={itemVariants}
            whileTap={disabled ? {} : { scale: 0.97 }}
            whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22, mass: 0.8 }}
            key={slot.timeValue || slot.time}
            type="button"
            onClick={() => onSelect(slot.timeValue || slot.time)}
            disabled={disabled}
            className={`rounded-2xl border px-3 py-2 text-sm transition ${
              active
                ? 'border-brand-500 bg-brand-500 text-white'
                : disabled
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
            }`}
          >
            {slot.time}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export default SlotPicker;
