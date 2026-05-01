import { useState, useEffect } from 'react';
import { reviewService } from '../../../services';
import StarRating from '../../../components/ui/StarRating';
import { Star, MessageSquare } from 'lucide-react';
import { PageLoader } from '../../../components/ui/Feedback';

/**
 * ProviderReviews — self-contained reviews panel for the provider dashboard.
 * Fetches its own data given a providerId (Provider model _id).
 */
export default function ProviderReviews({ providerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    reviewService
      .getProviderReviews(providerId, { page, limit: 5 })
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId, page]);

  if (!providerId) return null;
  if (loading) return <PageLoader />;

  const { reviews, avgRating, totalReviews, totalPages } = data || {};

  return (
    <div className="border border-slate-100 bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-slate-800">Patient Reviews</h2>
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {totalReviews}
          </span>
        </div>
        {totalReviews > 0 && (
          <div className="flex items-center gap-1.5">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">{avgRating}</span>
            <span className="text-xs text-slate-400">/ 5</span>
          </div>
        )}
      </div>

      {/* Average rating summary */}
      {totalReviews > 0 && (
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-4 bg-amber-50/50">
          <div className="text-center">
            <p className="text-4xl font-black text-slate-800">{avgRating}</p>
            <StarRating value={Math.round(avgRating)} size="sm" />
            <p className="text-xs text-slate-500 mt-1">{totalReviews} reviews</p>
          </div>
          {/* Simple bar distribution */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 w-3 text-right">{star}</span>
                  <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-slate-400 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review list */}
      <div className="divide-y divide-slate-50">
        {reviews.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No reviews yet</p>
            <p className="text-slate-400 text-xs mt-1">
              Reviews appear here after patients rate completed bookings.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {review.patient?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {/* Mask middle name for privacy */}
                      {maskName(review.patient?.name)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600 leading-relaxed pl-10">
                  "{review.comment}"
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs font-semibold text-slate-500 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs font-semibold text-slate-500 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/** Partially mask a name for privacy: "Anjali Sharma" → "Anjali S." */
function maskName(name = '') {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}
