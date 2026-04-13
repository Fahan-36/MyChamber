import { Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

function StethoscopeLoader({ compact = false }) {
  return (
    <motion.div
      className={`relative flex flex-col items-center justify-center ${compact ? 'py-6' : 'py-12'}`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-emerald-200/70 blur-xl dark:bg-emerald-900/40"
        animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-300 bg-white/90 shadow-md dark:border-emerald-700 dark:bg-slate-900/90">
        <motion.div
          className="absolute inset-0 rounded-full border border-emerald-400/80 dark:border-emerald-500/60"
          animate={{ scale: [1, 1.22], opacity: [0.5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.div
          animate={{ y: [0, -3, 0], rotate: [0, -4, 0, 4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Stethoscope className="h-9 w-9 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
        </motion.div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/90 dark:text-emerald-300/90">
        Loading Care
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        {[0, 0.16, 0.32].map((delay) => (
          <motion.span
            key={delay}
            className="h-2 w-2 rounded-full bg-emerald-500"
            animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function LoadingSkeleton({ type = 'card', count = 1 }) {
  if (type === 'page') {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <StethoscopeLoader />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-3xl border border-slate-200/70 bg-white/70 px-4 dark:border-slate-800 dark:bg-slate-900/40">
          <StethoscopeLoader compact />
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
