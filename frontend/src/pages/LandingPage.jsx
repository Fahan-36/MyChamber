import { motion, useReducedMotion } from 'framer-motion';
import CountUp from 'react-countup';
import { ArrowRight, CalendarCheck2, Clock3, HeartPulse, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import doctorHeroImage from '../assets/Doctor-PNG-File-Download-Free.png';
import FAQSection from '../components/common/FAQSection';
import FeatureCard from '../components/common/FeatureCard';
import SectionHeader from '../components/common/SectionHeader';
import UpcomingFeaturesSection from '../components/common/UpcomingFeaturesSection';
import { featureCards, upcomingFeatures } from '../data/fallbackData';

const steps = [
  { title: 'Find the right doctor', text: 'Search by specialization and compare availability fast.' },
  { title: 'Pick a slot in one tap', text: 'Choose date and an available time without guessing.' },
  { title: 'Track and manage', text: 'Handle appointments and updates from one dashboard.' },
];

function LandingPage() {
  const reduceMotion = useReducedMotion();
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    const id = hash.replace('#', '');
    const target = document.getElementById(id);
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [hash]);

  return (
    <>
      <section id="home" className="relative overflow-hidden py-6 scroll-mt-24 md:py-10">
        {/* ── Layered mesh background ── */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-sky-100/80 to-teal-100/75 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950/40" />
          <div className="hero-noise absolute inset-0 opacity-55 dark:opacity-35" />
          <div className="absolute -left-36 -top-36 h-[420px] w-[420px] rounded-full bg-cyan-300/65 blur-[88px] dark:bg-cyan-900/20" />
          <div className="absolute -right-32 top-10 h-[320px] w-[320px] rounded-full bg-teal-200/45 blur-[68px] dark:bg-teal-900/12" />
          <div className="absolute bottom-[-4rem] left-1/2 h-64 w-[620px] -translate-x-1/2 rounded-full bg-sky-200/70 blur-[74px] dark:bg-cyan-900/15" />
          <div className="absolute left-[18%] top-[16%] h-44 w-44 rounded-full bg-sky-200/45 blur-[70px] dark:bg-cyan-900/12" />
          <div className="absolute right-[11%] top-[9%] h-52 w-52 rounded-full border border-cyan-200/70 dark:border-cyan-700/25" />
          <div className="absolute right-[9%] top-[7%] h-72 w-72 rounded-full border border-teal-200/50 dark:border-teal-700/20" />
          <div className="absolute left-[38%] top-[6%] h-40 w-40 rounded-full bg-white/45 blur-[60px] dark:bg-cyan-900/10" />
          <div className="absolute right-[28%] bottom-[8%] h-52 w-52 rounded-full bg-teal-100/30 blur-[74px] dark:bg-teal-900/12" />
          {/* Heartbeat line decoration — animated sweep */}
          <svg className="animate-ecg-bg absolute bottom-[18%] left-0 w-full text-cyan-500/55 opacity-[0.52] dark:text-sky-200/55 dark:opacity-[0.18]" height="60" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 30H270L310 8L348 52L380 22L415 40H600L635 30H820L860 9L895 53L925 25L958 42H1148L1182 30H1440" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Subtle medical cross accents */}
          <span className="absolute left-[7%] top-[36%] text-lg font-semibold text-teal-400/30 dark:text-teal-500/20">+</span>
          <span className="absolute right-[8%] top-[22%] text-base font-semibold text-cyan-400/30 dark:text-cyan-500/20">+</span>
          <span className="absolute right-[6%] bottom-[27%] text-xl font-semibold text-cyan-400/25 dark:text-cyan-500/15">+</span>
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-6 md:grid-cols-[1.1fr_0.9fr]">

            {/* ── Left column ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, ease: 'easeOut' }}
            >
              <span className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Smart Healthcare Platform
              </span>

              <h1 className="font-display text-[2.1rem] font-black leading-[1.08] tracking-[-0.025em] md:text-[2.9rem]">
                <span className="text-slate-900 dark:text-slate-100">Book Doctor Appointments</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-teal-300 dark:to-emerald-300">
                  Faster, Smarter
                </span>
                <span className="text-cyan-900 dark:text-cyan-100"> and Stress-Free</span>
              </h1>

              <p className="mt-4 max-w-[30rem] text-[15px] leading-[1.75] text-slate-500 dark:text-slate-400 md:text-[15.5px]">
                MyChamber helps patients quickly find trusted doctors and book appointments in seconds. Designed for modern healthcare scheduling.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-400/30 transition hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Get Started
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/doctors"
                  className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-white/80 px-6 py-3 text-sm font-semibold text-teal-700 backdrop-blur-sm transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-400 dark:hover:border-teal-600 dark:hover:bg-teal-900/20 active:scale-[0.98]"
                >
                  Explore Doctors
                </Link>
              </div>

            </motion.div>

            {/* ── Right column ── */}
            <motion.div
              initial={{ opacity: 0, x: 26 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              <div className="relative mx-auto w-[90%] md:w-full">
                <div className="relative mx-auto h-[340px] w-[340px] overflow-hidden rounded-full md:h-[420px] md:w-[420px]">
                  {/* Dark theme background matching hero section gradient */}
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-full dark:bg-transparent" />
                  <span className="pointer-events-none absolute inset-0 rounded-full ring-[8px] ring-white/95 shadow-[0_18px_46px_-20px_rgba(15,23,42,0.38)] dark:ring-0 dark:shadow-none" />
                  <img
                    src={doctorHeroImage}
                    alt="Professional doctor"
                    className="relative h-full w-full rounded-full object-cover object-top"
                    loading="eager"
                  />
                </div>

                {/* Floating card — next appointment */}
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, 8, 0], x: [0, 2, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -left-8 bottom-8 w-48 rounded-2xl border border-white/70 bg-white/80 p-2.5 shadow-2xl backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/80"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40">
                      <CalendarCheck2 size={16} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Next Appointment</p>
                      <p className="text-[11px] text-slate-500">Today · 3:00 PM</p>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-brand-400 to-cyan-400" />
                  </div>
                </motion.div>

                {/* Floating card — vitals */}
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -8, 0], x: [0, -2, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="hidden"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Patient Vitals</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <HeartPulse size={14} className="shrink-0 text-rose-500" />
                    <svg width="72" height="22" viewBox="0 0 72 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 11H10L15 4L21 18L28 7L34 15H42L47 11H72" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-white">
                    72 <span className="text-[11px] font-normal text-slate-400">bpm</span>
                    <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Normal</span>
                  </p>
                </motion.div>

                {/* Floating chip — star rating */}
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, 1, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute -right-6 top-6 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-2xl backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/80"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    <p className="text-xs font-bold text-slate-800 dark:text-white">4.9 / 5 Stars</p>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">48,000+ reviews</p>
                </motion.div>

                {/* Bottom pill — verified */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/90 bg-white/95 px-4 py-1.5 shadow-md backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95">
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck size={12} className="text-brand-500" />
                    All doctors verified &amp; BMDC registered
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Stats strip ── */}
          <div id="doctors" className="mt-6 grid grid-cols-2 gap-3 scroll-mt-24 md:mt-8 lg:grid-cols-4">
            {[
              { Icon: Stethoscope,   label: 'Doctors Onboarded',      value: 1280,  suffix: '+' },
              { Icon: CalendarCheck2, label: 'Appointments Managed',   value: 48000, suffix: '+' },
              { Icon: HeartPulse,    label: 'Patient Satisfaction',    value: 98,    suffix: '%' },
              { Icon: Clock3,        label: 'Avg Booking Time',        value: 45,    suffix: ' sec' },
            ].map(({ Icon, label, value, suffix }) => (
              <div
                key={label}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3.5 shadow-[0_12px_30px_-18px_rgba(14,116,144,0.22)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_18px_36px_-14px_rgba(20,184,166,0.35)] dark:border-cyan-900/45 dark:bg-slate-950/80 dark:hover:border-teal-700/60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 text-cyan-700 transition duration-300 group-hover:scale-110 group-hover:from-teal-100 group-hover:to-cyan-100 group-hover:text-teal-600 dark:from-cyan-900/30 dark:to-teal-900/25 dark:text-cyan-400 dark:group-hover:from-teal-800/40 dark:group-hover:to-cyan-800/30">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-[11px] leading-none text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-0.5 font-display text-xl font-extrabold leading-tight text-slate-900 dark:text-white">
                    <CountUp end={value} duration={1.4} separator="," />{suffix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-24">
        <SectionHeader centered title="Built For Modern Care Teams" subtitle="A polished workflow for patients and doctors, designed for daily speed and confidence." />
        <div className="grid gap-5 md:grid-cols-2">
          {featureCards.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} reduceMotion={reduceMotion} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <SectionHeader title="How It Works" subtitle="Three simple steps from discovery to confirmed care." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.38, ease: 'easeOut', delay: reduceMotion ? 0 : index * 0.1 }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -5,
                      scale: 1.01,
                      boxShadow: '0 20px 38px -16px rgba(14, 38, 56, 0.42)',
                    }
              }
              className="glass-card min-h-[215px] rounded-3xl p-7"
            >
              <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-16 scroll-mt-24">
        <div className="grid gap-5 rounded-[2rem] bg-gradient-to-r from-sky-500 to-teal-500 p-10 text-white md:grid-cols-3">
          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
            <CalendarCheck2 />
            <p className="mt-2 text-sm text-white/80">Reliable scheduling</p>
            <p className="font-display text-[1.75rem] font-bold leading-tight">24/7 Booking Flow</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
            <HeartPulse />
            <p className="mt-2 text-sm text-white/80">Patient-first UI</p>
            <p className="font-display text-[1.75rem] font-bold leading-tight">Fast and reassuring</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
            <ShieldCheck />
            <p className="mt-2 text-sm text-white/80">Protected access</p>
            <p className="font-display text-[1.75rem] font-bold leading-tight">Role-based security</p>
          </div>
        </div>
      </section>

      <UpcomingFeaturesSection reduceMotion={reduceMotion} features={upcomingFeatures} />

      <section id="faq" className="scroll-mt-24">
        <FAQSection />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="glass-card rounded-[2rem] p-8 text-center">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white">Ready to streamline your chamber?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Create your account and experience appointment management that feels smooth from first click.
          </p>
          <Link to="/register" className="primary-button mt-6">Create Account</Link>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
