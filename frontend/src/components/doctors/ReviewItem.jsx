import StarRating from '../reviews/StarRating';

// Converts a UTC date string to a human-readable relative time (e.g. "2 weeks ago")
const relativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';
  const secs = Math.floor(diffMs / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (secs < 60) return 'Just now';
  if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
};

// Deterministic avatar color based on first character of patient name
const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
];

const maskPatientName = (name) => {
  const cleaned = (name || '').trim();
  if (!cleaned) return 'Anonymous';

  const chars = cleaned.split('');
  const visibleIndexes = [];

  for (let i = 0; i < chars.length; i += 1) {
    if (chars[i] !== ' ') {
      visibleIndexes.push(i);
    }
  }

  if (visibleIndexes.length <= 2) {
    return cleaned;
  }

  const first = visibleIndexes[0];
  const last = visibleIndexes[visibleIndexes.length - 1];

  return chars
    .map((char, index) => {
      if (char === ' ' || index === first || index === last) {
        return char;
      }
      return '*';
    })
    .join('');
};

/**
 * ReviewItem - Renders a single patient review row inside ReviewModal.
 *
 * Props:
 *   review  { id, patient_name, rating, review_text, created_at }
 */
function ReviewItem({ review }) {
  const name = review.patient_name || 'Anonymous';
  const maskedName = maskPatientName(name);
  const colorClass = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const avatarLetter = (maskedName.match(/[A-Za-z]/)?.[0] || 'A').toUpperCase();

  return (
    <div className="flex gap-3 border-b border-slate-200 px-1 py-3 last:border-0 dark:border-slate-800">
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${colorClass}`}
        aria-hidden="true"
      >
        {avatarLetter}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="text-base font-semibold leading-none text-slate-800 dark:text-white">{maskedName}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {relativeTime(review.created_at)}
          </span>
        </div>

        <div className="mt-0.5">
          <StarRating value={review.rating} size={13} />
        </div>

        {review.review_text && (
          <p className="mt-1 text-sm leading-snug text-slate-600 dark:text-slate-300">
            {review.review_text}
          </p>
        )}
      </div>
    </div>
  );
}

export default ReviewItem;
