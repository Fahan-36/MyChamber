import CountUp from 'react-countup';
import { motion } from 'framer-motion';

function StatsCard({ title, value = 0, suffix = '', icon: Icon, hint, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-3xl p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        {Icon && (
          <span className="rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">
            <Icon size={16} />
          </span>
        )}
      </div>
      <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
        <CountUp end={Number(value)} duration={1.4} separator="," />
        {suffix}
      </h3>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </motion.article>
  );
}

export default StatsCard;
