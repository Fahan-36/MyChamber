import { MessageSquare } from 'lucide-react';
import StarRating from './StarRating';

/**
 * ReviewDisplay - Read-only summary of a submitted review.
 *
 * Props:
 *   rating      {number}  1–5
 *   reviewText  {string|null}
 */
function ReviewDisplay({ rating, reviewText }) {
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
        Your Review
      </p>

      <div className="flex items-center gap-3">
        <StarRating value={rating} size={18} />
        <span className="text-sm font-semibold text-amber-500">{rating}/5</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{labels[rating]}</span>
      </div>

      {reviewText && (
        <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <MessageSquare size={14} className="mt-0.5 shrink-0 text-slate-400" />
          <span>{reviewText}</span>
        </p>
      )}
    </div>
  );
}

export default ReviewDisplay;
