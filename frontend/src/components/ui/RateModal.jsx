import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StarRating from './StarRating';
import Button from './Button';
import { reviewService } from '../../services';
import toast from 'react-hot-toast';
import { CheckCircle2, Quote, X, Calendar } from 'lucide-react';
import { SERVICE_CONFIG, cn, formatDate } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_TAGS = [
  'Professional',
  'On Time',
  'Helpful',
  'Clean & Hygienic',
  'Recommended',
];

export default function RateModal({ isOpen, onClose, booking, onSuccess }) {
  const [rating, setRating]           = useState(0);
  const [comment, setComment]         = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  /* Lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!booking) return null;

  /* ── Handlers ─────────────────────────────────────────── */
  const handleClose = () => {
    if (submitting) return;
    setRating(0);
    setComment('');
    setSelectedTags([]);
    setSubmitted(false);
    onClose();
  };

  const toggleTag = (tag) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('Please select a star rating');
    setSubmitting(true);
    try {
      await reviewService.submit({
        bookingId: booking._id,
        rating,
        comment,
        tags: selectedTags,
      });
      setSubmitted(true);
      onSuccess?.();
      setTimeout(handleClose, 1600);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
   *  Single wrapper = backdrop + flex centering container
   *  The card inside it auto-centers via flexbox.
   *  Framer Motion only animates scale/opacity on the card,
   *  so it never fights with positional CSS.
   * ───────────────────────────────────────────────────────── */
  const modal = (
    <AnimatePresence>
      {isOpen && (
        /* ── Backdrop + centering shell ──────────────────── */
        <motion.div
          key="rm-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.52)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
        >
          {/* ── Card (stops click propagation to backdrop) ── */}
          <motion.div
            key="rm-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '580px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow:
                '0 24px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            <AnimatePresence mode="wait">
              {/* ── Success State ──────────────────────────── */}
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '56px 32px',
                    gap: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: '#ecfdf5',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 style={{ width: 40, height: 40, color: '#10b981' }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 900,
                        color: '#0f172a',
                        letterSpacing: '-0.02em',
                        margin: '0 0 6px',
                      }}
                    >
                      Review Submitted!
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      Your feedback helps us maintain high quality care.
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 28px',
                      background: '#ecfdf5',
                      color: '#059669',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      border: '1px solid #d1fae5',
                    }}
                  >
                    Rated ✓
                  </span>
                </motion.div>
              ) : (
                /* ── Review Form ───────────────────────────── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    flex: 1,
                  }}
                >
                  {/* ── Modal Header ─────────────────────── */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px 24px',
                      borderBottom: '1px solid #f1f5f9',
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: '17px',
                          fontWeight: 900,
                          color: '#0f172a',
                          letterSpacing: '-0.02em',
                          margin: 0,
                        }}
                      >
                        Rate Your Service
                      </h2>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontWeight: 500,
                          margin: '3px 0 0',
                        }}
                      >
                        Your feedback is valuable to us
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      style={{
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRadius: '10px',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        transition: 'background 0.15s, color 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.color = '#475569';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                      aria-label="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* ── Scrollable Body ───────────────────── */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '22px',
                    }}
                  >
                    {/* Provider Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        borderRadius: '16px',
                        padding: '14px 16px',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            border: '2px solid #fff',
                            boxShadow: '0 4px 12px rgba(99,102,241,0.15)',
                          }}
                        >
                          <img
                            src={
                              booking.provider?.user?.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                booking.provider?.user?.name || 'P'
                              )}&background=6366f1&color=fff`
                            }
                            alt="Provider"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-3px',
                            right: '-3px',
                            width: '17px',
                            height: '17px',
                            background: '#10b981',
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CheckCircle2 size={9} color="#fff" />
                        </div>
                      </div>

                      {/* Name + Service */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: '#0f172a',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {booking.provider?.user?.name}
                        </p>
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#2563eb',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            margin: '3px 0 0',
                          }}
                        >
                          {SERVICE_CONFIG[booking.service]?.label}
                        </p>
                      </div>

                      {/* Date */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          flexShrink: 0,
                        }}
                      >
                        <Calendar size={12} color="#94a3b8" />
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748b',
                          }}
                        >
                          {formatDate(booking.scheduledAt)}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#94a3b8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          margin: 0,
                        }}
                      >
                        Overall Rating
                      </p>
                      <StarRating
                        value={rating}
                        onChange={setRating}
                        size="lg"
                        showLabel
                      />
                    </div>

                    {/* Quick Tags */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#94a3b8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          margin: 0,
                        }}
                      >
                        What stood out?
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {QUICK_TAGS.map(tag => {
                          const active = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: active ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                                background: active ? '#2563eb' : '#ffffff',
                                color: active ? '#ffffff' : '#64748b',
                                transform: active ? 'scale(1.04)' : 'scale(1)',
                                boxShadow: active ? '0 4px 14px rgba(37,99,235,0.22)' : 'none',
                                transition: 'all 0.15s',
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Textarea */}
                    <div style={{ position: 'relative' }}>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        style={{
                          width: '100%',
                          background: '#f8fafc',
                          border: '1.5px solid transparent',
                          borderRadius: '14px',
                          padding: '14px 44px 14px 16px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#334155',
                          outline: 'none',
                          resize: 'none',
                          transition: 'all 0.15s',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          lineHeight: 1.6,
                        }}
                        onFocus={e => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)';
                        }}
                        onBlur={e => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <Quote
                        size={16}
                        style={{
                          position: 'absolute',
                          bottom: '14px',
                          right: '14px',
                          color: '#cbd5e1',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* ── Footer ───────────────────────────── */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '16px 24px',
                      borderTop: '1px solid #f1f5f9',
                      flexShrink: 0,
                      background: '#ffffff',
                    }}
                  >
                    <Button
                      variant="ghost"
                      onClick={handleClose}
                      style={{ flex: 1 }}
                      className="rounded-xl py-3 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    >
                      Maybe Later
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      loading={submitting}
                      disabled={rating === 0}
                      style={{ flex: 2 }}
                      className={cn(
                        'rounded-xl py-3 font-black text-white transition-all',
                        rating === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0'
                      )}
                    >
                      Submit Review
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* Mount into document.body — escapes all parent stacking contexts */
  return createPortal(modal, document.body);
}
