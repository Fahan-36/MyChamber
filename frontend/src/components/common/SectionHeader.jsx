import { motion } from 'framer-motion';

function SectionHeader({ title, subtitle, centered = false, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`mb-6 ${centered ? 'text-center' : ''}`}
    >
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

export default SectionHeader;
