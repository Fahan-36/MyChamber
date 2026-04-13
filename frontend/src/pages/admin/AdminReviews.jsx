import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionHeader from '../../components/common/SectionHeader';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/date';

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  const loadReviews = async () => {
    try {
      const res = await adminService.getReviews();
      setReviews(res.data || []);
    } catch (error) {
      toast.error(error.message);
      setReviews([]);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    try {
      setLoadingId(reviewId);
      await adminService.deleteReview(reviewId);
      toast.success('Review deleted successfully');
      await loadReviews();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <SectionHeader title="Reviews Moderation" subtitle="Moderate patient feedback and remove inappropriate reviews." />

      <div className="glass-card rounded-3xl p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                <th className="px-3 py-3 font-semibold">Doctor</th>
                <th className="px-3 py-3 font-semibold">Patient</th>
                <th className="px-3 py-3 font-semibold">Rating</th>
                <th className="px-3 py-3 font-semibold">Comment</th>
                <th className="px-3 py-3 font-semibold">Delete</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{review.doctor_name}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{review.patient_name}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{review.rating}/5</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{review.review_text || 'No comment'}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={loadingId === review.id}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!reviews.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    No reviews found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminReviews;
