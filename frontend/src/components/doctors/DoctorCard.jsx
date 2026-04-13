import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import StarRating from '../reviews/StarRating';
import ReviewModal from './ReviewModal';
import reviewService from '../../services/reviewService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const normalizeAddress = (address) => {
  if (typeof address !== 'string') return '';

  const trimmedAddress = address.trim();
  if (!trimmedAddress || trimmedAddress.toLowerCase() === 'n/a') {
    return '';
  }

  return trimmedAddress;
};

const getGoogleMapsSearchUrl = (address) => {
  const normalizedAddress = normalizeAddress(address);
  if (!normalizedAddress) return '';

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedAddress)}`;
};

const getDoctorImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return imagePath.startsWith('/') ? `${UPLOADS_BASE_URL}${imagePath}` : `${UPLOADS_BASE_URL}/${imagePath}`;
};

function DoctorCard({ doctor, index = 0 }) {
  const [summary, setSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const chamberAddress = normalizeAddress(doctor.chamber_address);
  const mapsUrl = getGoogleMapsSearchUrl(doctor.chamber_address);
  const isMapAvailable = Boolean(mapsUrl);
  const doctorImageUrl = getDoctorImageUrl(doctor.profile_image);
  const doctorInitial = (doctor.name?.trim()?.charAt(0) || 'D').toUpperCase();

  useEffect(() => {
    let active = true;
    reviewService
      .getDoctorRatingSummary(doctor.doctor_id)
      .then((res) => {
        if (active) setSummary(res.data || null);
      })
      .catch(() => {
        if (active) setSummary({ total_reviews: 0, average_rating: null });
      });

    return () => {
      active = false;
    };
  }, [doctor.doctor_id]);

  const hasRating = summary !== null && summary.total_reviews > 0;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -6 }}
        className="glass-card rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.11)] transition-shadow dark:border-slate-700/90 dark:bg-slate-900/75 dark:shadow-[0_10px_26px_rgba(2,6,23,0.5)]"
      >
        <div className="mb-4 flex flex-col items-center text-center">
          {doctorImageUrl ? (
            <img src={doctorImageUrl} alt={`Dr. ${doctor.name}`} className="h-28 w-28 rounded-full object-cover object-[center_20%] border-2 border-slate-200 dark:border-slate-700" />
          ) : (
            <span className="h-28 w-28 flex items-center justify-center rounded-full text-2xl font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700">{doctorInitial}</span>
          )}
          <div className="mt-2.5">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">Dr. {doctor.name}</h3>
            <div className="mt-2 inline-flex rounded-2xl border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.1em] text-brand-700 dark:border-brand-700/50 dark:bg-brand-900/30 dark:text-brand-300">
              {doctor.specialization}
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-2 text-center text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-start justify-center">
            <span className="text-brand-500 align-middle">
              <MapPin size={15} strokeWidth={2.1} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              {chamberAddress || 'Address not available'}
            </span>
          </div>

          <div>
            {isMapAvailable ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View chamber map for Dr. ${doctor.name}`}
                className="inline-flex items-center gap-1 rounded-full border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 active:scale-95 dark:border-brand-700/60 dark:text-brand-300 dark:hover:bg-brand-900/30"
              >
                <MapPin size={12} aria-hidden="true" />
                View Map
              </a>
            ) : (
              <span
                aria-label={`Map unavailable for Dr. ${doctor.name}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500"
              >
                <MapPin size={12} aria-hidden="true" />
                Map unavailable
              </span>
            )}
          </div>
        </div>

        <div className="mb-4 h-px w-full bg-slate-200/80 dark:bg-slate-700/80" aria-hidden="true" />

        <div className="mb-5 flex min-h-[28px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-[20px]">
            {summary === null ? (
              <div className="h-3.5 w-36 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            ) : hasRating ? (
              <div className="flex w-full max-w-md items-center gap-1.5 text-sm">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                <div className="flex items-center gap-1.5">
                  <StarRating value={Math.round(summary.average_rating)} size={15} />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {summary.average_rating.toFixed(1)}
                  </span>
                </div>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                <span className="text-slate-400 dark:text-slate-500">
                  ({summary.total_reviews} {summary.total_reviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">No reviews yet</span>
            )}
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 active:scale-95 dark:border-brand-700/60 dark:text-brand-300 dark:hover:bg-brand-900/30"
            >
              Details
            </button>
          </div>
        </div>

        <Link to={`/doctors/${doctor.doctor_id}`} className="primary-button w-full">
          View Profile
        </Link>
      </motion.article>

      <ReviewModal
        doctor={doctor}
        summary={summary}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export default DoctorCard;
