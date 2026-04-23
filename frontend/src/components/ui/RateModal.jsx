import { useState } from 'react';
import Modal from './Modal';
import StarRating from './StarRating';
import Button from './Button';
import { reviewService } from '../../services';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import { SERVICE_CONFIG } from '../../utils';

/**
 * RateModal — shown after a completed booking.
 *
 * Props:
 *   isOpen      {boolean}
 *   onClose     {function}
 *   booking     {object}   – the booking to review
 *   onSuccess   {function} – called after successful submission
 */
export default function RateModal({ isOpen, onClose, booking, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!booking) return null;

  const handleClose = () => {
    if (submitting) return;
    setRating(0);
    setComment('');
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('Please select a star rating');
    setSubmitting(true);
    try {
      await reviewService.submit({
        bookingId: booking._id,
        rating,
        comment,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rate Your Experience"
      size="sm"
      footer={
        submitted ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={rating === 0}>
              Submit Review
            </Button>
          </>
        )
      }
    >
      {submitted ? (
        /* ── Success State ─────────────────────────── */
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="font-bold text-slate-800 mb-1">Thank you!</h3>
          <p className="text-sm text-slate-500">Your review has been submitted successfully.</p>
        </div>
      ) : (
        /* ── Review Form ───────────────────────────── */
        <div className="space-y-5">
          {/* Provider info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${SERVICE_CONFIG[booking.service]?.color}`}>
              {SERVICE_CONFIG[booking.service]?.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{booking.provider?.user?.name}</p>
              <p className="text-xs text-slate-500">{SERVICE_CONFIG[booking.service]?.label}</p>
            </div>
          </div>

          {/* Star selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              How would you rate this service? <span className="text-red-500">*</span>
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" showLabel />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Write a review <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this provider..."
              className="input-base resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{comment.length}/500</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
