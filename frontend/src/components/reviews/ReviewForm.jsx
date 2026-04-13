import { useState } from 'react';
import { Send } from 'lucide-react';
import StarRating from './StarRating';

/**
 * ReviewForm - Let a patient rate and optionally comment on a completed appointment.
 *
 * Props:
 *   appointmentId  {number}
 *   doctorId       {number}
 *   doctorName     {string}
 *   onSubmit       {function(rating, reviewText): Promise<void>}
 *   submitting     {boolean}
 */
function ReviewForm({ appointmentId, doctorId, doctorName, onSubmit, submitting }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || submitting) return;
    onSubmit(rating, reviewText.trim() || null);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
        Rate Your Experience
      </p>

      <div className="flex items-center gap-3">
        <StarRating
          value={rating}
          onChange={setRating}
          hovered={hovered}
          onHover={setHovered}
          onLeave={() => setHovered(0)}
          size={22}
        />
        {rating > 0 && (
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </span>
        )}
      </div>

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        maxLength={1000}
        placeholder="Share your experience (optional)…"
        rows={2}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-teal-500 dark:focus:ring-teal-900/40"
      />

      <button
        type="submit"
        disabled={!rating || submitting}
        className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
      >
        <Send size={13} />
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

export default ReviewForm;
