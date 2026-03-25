import { useState } from 'react'
import { Star, X, Send, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ── Star selector ─────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-2 justify-center">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="transition-transform hover:scale-110"
      >
        <Star
          size={36}
          className={"transition-colors " +
            (star <= value
              ? 'text-brand-amber fill-brand-amber'
              : 'text-brand-muted'
            )}
        />
      </button>
    ))}
  </div>
)

const STAR_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent!',
}

// ── Main component ─────────────────────────────────────────────────────────────
const RatingModal = ({ booking, isVendor, onClose, onRated }) => {
  const [stars,      setStars]      = useState(0)
  const [note,       setNote]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)

  // Check if already rated
  const alreadyRated = isVendor
    ? !!booking.vendorRating
    : !!booking.customerRating

  const handleSubmit = async () => {
    if (stars < 1) return toast.error('Select a star rating')
    setSubmitting(true)
    try {
      await api.post(`/bookings/${booking._id}/rate`, {
        rating:     stars,
        reviewNote: note.trim() || undefined,
      })
      setDone(true)
      onRated?.()
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-brand-slate border border-white/10 shadow-2xl animate-[fadeUp_0.2s_ease_forwards]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <span className="font-mono text-xs tracking-widest uppercase text-brand-amber">
            Rate Your Experience
          </span>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-cream">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Trip summary */}
          <div className="text-center">
            <p className="font-medium text-brand-cream">
              {booking.vehicle?.make} {booking.vehicle?.model}
            </p>
            <p className="font-mono text-xs text-brand-muted mt-0.5">
              {booking.startHub?.city || booking.startHub?.name}
              {' → '}
              {booking.endHub?.city || booking.endHub?.name}
            </p>
          </div>

          {done ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle size={48} className="text-green-400 mx-auto" />
              <p className="font-display text-2xl text-brand-cream">Thank you!</p>
              <p className="font-mono text-xs text-brand-muted">Your rating has been submitted.</p>
            </div>
          ) : alreadyRated ? (
            <div className="text-center py-4 space-y-3">
              <div className="flex justify-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={28}
                    className={(s <= (isVendor ? booking.vendorRating : booking.customerRating)
                      ? 'text-brand-amber fill-brand-amber'
                      : 'text-brand-muted')} />
                ))}
              </div>
              <p className="font-mono text-xs text-brand-muted">Already rated</p>
              {booking.reviewNote && (
                <p className="font-mono text-xs text-brand-cream italic">"{booking.reviewNote}"</p>
              )}
            </div>
          ) : (
            <>
              {/* Star picker */}
              <div className="space-y-3">
                <StarPicker value={stars} onChange={setStars} />
                {stars > 0 && (
                  <p className="text-center font-display text-xl text-brand-amber">
                    {STAR_LABELS[stars]}
                  </p>
                )}
              </div>

              {/* Prompt text */}
              <p className="text-center font-mono text-xs text-brand-muted">
                {isVendor
                  ? 'How was this customer?'
                  : 'How was your rental experience?'
                }
              </p>

              {/* Review note — customers only */}
              {!isVendor && (
                <div>
                  <label className="input-label">
                    Write a review <span className="text-brand-muted">(optional)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Share your experience with future renters..."
                    rows={3}
                    maxLength={300}
                    className="input-field resize-none text-sm"
                  />
                  <p className="font-mono text-[10px] text-brand-muted mt-1 text-right">
                    {note.length}/300
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-outline flex-1 py-2.5">
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || stars < 1}
                  className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                    : <><Send size={14} /> Submit</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RatingModal