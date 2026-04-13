import { Star } from 'lucide-react';

/**
 * StarRating - Interactive or read-only star selector.
 *
 * Props:
 *   value       {number}   Current rating (1–5). 0 = nothing selected.
 *   onChange    {function} Called with the new rating when a star is clicked.
 *                          Omit (or pass null) to make the component read-only.
 *   hovered     {number}   Externally controlled hover state (optional).
 *   onHover     {function} Called with hovered index on mouseenter.
 *   onLeave     {function} Called on mouseleave to reset hover state.
 *   size        {number}   Icon size in px. Default: 20.
 */
function StarRating({ value = 0, onChange, hovered = 0, onHover, onLeave, size = 20 }) {
  const isReadOnly = typeof onChange !== 'function';

  return (
    <div
      className="flex items-center gap-0.5"
      role={isReadOnly ? 'img' : 'group'}
      aria-label={isReadOnly ? `Rating: ${value} out of 5 stars` : 'Select a star rating'}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);

        return (
          <button
            key={star}
            type="button"
            disabled={isReadOnly}
            onClick={() => !isReadOnly && onChange(star)}
            onMouseEnter={() => onHover && onHover(star)}
            onMouseLeave={() => onLeave && onLeave()}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            className={[
              'transition-transform duration-100',
              isReadOnly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded',
            ].join(' ')}
          >
            <Star
              size={size}
              className={
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-slate-300 dark:text-slate-600'
              }
            />
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
