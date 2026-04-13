import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import SectionHeader from './SectionHeader';

const faqs = [
  {
    question: 'How do patients book appointments?',
    answer:
      'Patients can browse doctors, open a doctor profile, select a date, view real-time available slots, and confirm booking in a few taps.',
  },
  {
    question: 'Can doctors manage availability easily?',
    answer:
      'Yes. Doctors can define weekly schedules with start/end times and slot durations, then manage appointment updates from the dashboard.',
  },
  {
    question: 'Is patient data secure?',
    answer:
      'MyChamber uses authenticated API access with JWT-based authorization and role-based route protection for secure dashboard operations.',
  },
  {
    question: 'Can clinics track appointments and performance?',
    answer:
      'Yes. Dashboards include appointment summaries, status distribution, and activity charts to help clinics monitor operational flow.',
  },
  {
    question: 'Is MyChamber suitable for small and growing clinics?',
    answer:
      'Absolutely. The system is lightweight for small teams while still scalable enough to support growing appointment volume and workflows.',
  },
  {
    question: 'How fast is onboarding?',
    answer:
      'Most teams can get started quickly: create accounts, set doctor schedules, and begin booking appointments within minutes.',
  },
];

function FAQItem({ item, index, isOpen, onToggle }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: reduceMotion ? 0 : index * 0.06 }}
      whileHover={reduceMotion ? undefined : { y: -3, scale: 1.005, boxShadow: '0 20px 38px -16px rgba(14, 38, 56, 0.42)' }}
      className="glass-card overflow-hidden rounded-3xl"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-display text-lg font-bold text-slate-900 dark:text-white">{item.question}</span>
        <motion.span
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl bg-slate-100 p-1.5 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="border-t border-slate-200/70 px-5 py-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700/70 dark:text-slate-300">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeader
        centered
        title="Frequently Asked Questions"
        subtitle="Everything patients, doctors, and clinics usually ask before getting started with MyChamber."
      />

      <div className="mx-auto grid max-w-4xl gap-3">
        {faqs.map((item, index) => (
          <FAQItem
            key={item.question}
            item={item}
            index={index}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex((prev) => (prev === index ? -1 : index))}
          />
        ))}
      </div>
    </section>
  );
}

export default FAQSection;
