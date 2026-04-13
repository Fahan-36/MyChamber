import { motion } from 'framer-motion';
import { CalendarClock, ChartSpline, LayoutDashboard, Search } from 'lucide-react';

const iconByKey = {
  smartSearch: Search,
  fluidScheduling: CalendarClock,
  unifiedWorkspace: LayoutDashboard,
  actionableInsights: ChartSpline,
};

function FeatureCard({ feature, index, reduceMotion }) {
  const Icon = iconByKey[feature.iconKey] || Search;

  return (
    <motion.article
      initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.38, ease: 'easeOut', delay: reduceMotion ? 0 : index * 0.08 }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -5,
              scale: 1.01,
              boxShadow: '0 20px 38px -16px rgba(14, 38, 56, 0.42)',
            }
      }
      className="glass-card min-h-[190px] rounded-3xl p-6 md:p-7"
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -3, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: reduceMotion ? 0 : index * 0.12 }}
        className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shadow-sm dark:bg-teal-900/40 dark:text-teal-300 dark:ring-1 dark:ring-teal-700/50"
      >
        <Icon size={18} />
      </motion.div>

      <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{feature.description}</p>
    </motion.article>
  );
}

export default FeatureCard;
