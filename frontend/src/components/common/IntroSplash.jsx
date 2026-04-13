import { motion } from 'framer-motion';
import { Stethoscope } from 'lucide-react';

function IntroSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-card rounded-3xl p-8 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 12, -8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white"
        >
          <Stethoscope size={28} />
        </motion.div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-slate-100">MyChamber</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Preparing your care workspace...</p>
      </motion.div>
    </div>
  );
}

export default IntroSplash;
