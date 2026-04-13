import { motion } from 'framer-motion';
import { Bot, CreditCard, Pill, Video } from 'lucide-react';
import SectionHeader from './SectionHeader';

const iconByTitle = {
  'Online Payment': CreditCard,
  'AI Doctor': Bot,
  Telemedicine: Video,
  'Online Medicine': Pill,
};

function UpcomingFeaturesSection({ reduceMotion, features }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader
        centered
        title="Upcoming Features"
        subtitle="Powerful capabilities coming soon to make care more connected, intelligent, and convenient."
      />

      <div className="mt-7 space-y-4">
        {features.map((feature, index) => {
          const isReversed = index % 2 === 1;
          const FeatureIcon = iconByTitle[feature.title] || Bot;

          return (
            <motion.article
              key={feature.title}
              initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.42, ease: 'easeOut', delay: reduceMotion ? 0 : index * 0.06 }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -4,
                      boxShadow: '0 20px 38px -16px rgba(14, 38, 56, 0.42)',
                    }
              }
              className="glass-card rounded-[2rem] p-5 md:p-6"
            >
              <div className="grid items-center gap-5 md:grid-cols-2 md:gap-6">
                <div className={isReversed ? 'md:order-2' : 'md:order-1'}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-slate-900 dark:text-brand-300">
                    Coming Soon
                  </div>
                  <h3 className="mt-3 font-display text-xl font-black text-slate-900 dark:text-white md:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-[15px]">
                    {feature.description}
                  </p>
                </div>

                <div className={isReversed ? 'md:order-1' : 'md:order-2'}>
                  {/* Placeholder visual area designed for future Lottie/SVG/GIF/Framer replacements */}
                  <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 p-4 shadow-soft dark:border-slate-700 dark:from-slate-900 dark:to-slate-800/90">
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-300/20 dark:bg-brand-500/20" />
                    <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-teal-300/20 dark:bg-sky-400/10" />

                    <motion.div
                      animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative mx-auto flex min-h-[165px] w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/60 p-5 text-center backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70"
                    >
                      <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                        <FeatureIcon size={20} />
                      </div>
                      <p className="font-display text-base font-bold text-slate-900 dark:text-white">{feature.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{feature.visualLabel}</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default UpcomingFeaturesSection;
