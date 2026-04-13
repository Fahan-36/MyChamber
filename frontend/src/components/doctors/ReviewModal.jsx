import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, ShieldCheck, Star, ThumbsUp, Users, X } from 'lucide-react';
import StarRating from '../reviews/StarRating';
import ReviewItem from './ReviewItem';
import reviewService from '../../services/reviewService';

/**
 * ReviewModal - Full-screen overlay showing a doctor's reviews list.
 *
 * Props:
 *   doctor   { doctor_id, name }   Doctor object
 *   summary  { total_reviews, average_rating } | null
 *             Summary already fetched by the card (avoids double request).
 *             Pass null if not yet available — modal will still work.
 *   open     {boolean}            Controls enter/exit presence animation
 *   onClose  {function}
 */
function ReviewModal({ doctor, summary, open, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const listVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 320, damping: 25, mass: 0.8 },
    },
  };

  // Fetch reviews when modal opens
  useEffect(() => {
    if (!open) return undefined;

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await reviewService.getDoctorReviews(doctor.doctor_id);
        if (active) setReviews(res.data || []);
      } catch {
        if (active) toast.error('Could not load reviews. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [doctor.doctor_id, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  const avg = summary?.average_rating ?? null;
  const total = summary?.total_reviews ?? 0;
  const hasRating = avg !== null && total > 0;
  const recommendPercent = hasRating ? Math.round((avg / 5) * 100) : 0;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          onClick={onClose}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.9 }}
            className="relative w-full max-w-[760px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_18px_55px_-24px_rgba(15,23,42,0.7)] dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400" />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.28 }}
            className="border-b border-slate-200 px-5 pb-4 pt-5 md:px-6 dark:border-slate-800"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="review-modal-title"
                  className="font-display text-[30px] font-bold leading-none tracking-tight text-slate-900 md:text-[36px] dark:text-white"
                >
                  Dr. {doctor.name}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {hasRating ? (
                    <>
                      <span className="text-[34px] font-extrabold leading-none text-amber-500 md:text-[44px] dark:text-amber-300">
                        {avg.toFixed(1)}
                      </span>
                      <StarRating value={Math.round(avg)} size={15} />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {total} {total === 1 ? 'review' : 'reviews'}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">No reviews yet</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close reviews"
                className="rounded-full bg-slate-200/80 p-2 text-slate-400 transition hover:bg-slate-300/70 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <ShieldCheck size={14} className="text-cyan-600" />
              <span>Verified patient feedback</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-2 border-b border-slate-200 px-5 py-3 md:px-6 dark:border-slate-800">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.25 }}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80"
            >
              <motion.div
                animate={{ y: [0, -2, 0], rotate: [0, -6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute right-2 top-2 rounded-md bg-amber-100 p-1.5 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300"
              >
                <Star size={12} className="fill-current" />
              </motion.div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Average</p>
              <p className="mt-0.5 text-[34px] font-bold leading-none text-amber-500 dark:text-amber-300">
                {hasRating ? avg.toFixed(1) : '0.0'}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute right-2 top-2 rounded-md bg-cyan-100 p-1.5 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300"
              >
                <Users size={12} />
              </motion.div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Total Reviews</p>
              <p className="mt-0.5 text-[34px] font-bold leading-none text-cyan-600 dark:text-cyan-300">{total}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.25 }}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-cyan-100/60 px-3 py-2 dark:border-slate-700 dark:bg-cyan-500/10"
            >
              <motion.div
                animate={{ x: [0, 2, 0], y: [0, -1, 0] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute right-2 top-2 rounded-md bg-teal-100 p-1.5 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300"
              >
                <ThumbsUp size={12} />
              </motion.div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Recommend</p>
              <p className="mt-0.5 text-[34px] font-bold leading-none text-cyan-700 dark:text-cyan-300">{recommendPercent}%</p>
            </motion.div>
          </div>

          <div className="max-h-[44vh] overflow-y-auto px-5 py-2 md:px-6">
            {loading ? (
              <div className="space-y-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-slate-200 py-3 last:border-0 dark:border-slate-800">
                    <div className="flex animate-pulse gap-3 px-1">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="h-3 w-1/5 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <motion.div className="space-y-0" variants={listVariants} initial="hidden" animate="show">
                {reviews.map((r) => (
                  <motion.div key={r.id} variants={itemVariants}>
                    <ReviewItem review={r} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet. Be the first to share your experience.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 py-2 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={12} className="text-cyan-500" />
              Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">MyChamber</span>
            </span>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReviewModal;
