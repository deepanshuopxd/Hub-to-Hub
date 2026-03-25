import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Car, Map, MessageSquare, X, Camera, AlertTriangle, ChevronDown, ChevronUp, Star } from 'lucide-react'
import {
  fetchMyBookings, fetchVendorBookings, cancelBooking, updateBookingStatus,
  selectMyBookings, selectVendorBookings, selectBookingLoading,
} from '../store/slices/bookingSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR, formatDateTime, statusClass, statusLabel } from '../utils/formatters'
import HandoverUpload from '../components/booking/HandoverUpload'
import RatingModal   from '../components/booking/RatingModal'
import DamageReport   from '../components/booking/DamageReport'
import Loader from '../components/ui/Loader'
import toast  from 'react-hot-toast'

// ── Booking card ──────────────────────────────────────────────────────────────
const BookingCard = ({ b, isVendorView, onVendorAction, onCancel, onRefresh }) => {
  const [expanded,      setExpanded]      = useState(false)
  const [showRating,    setShowRating]    = useState(false)
  const { user }  = useAuth()

  const showPickupUpload  = ['pending', 'active'].includes(b.status)
  const showDropoffUpload = ['active', 'in_transit', 'completed'].includes(b.status)
  const showDamage        = isVendorView && b.status === 'completed'
  const showHandover      = showPickupUpload || showDropoffUpload || showDamage

  return (
    <div className="card border border-white/8 overflow-hidden">
      {/* Main row */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            {/* Vehicle image */}
            <div className="w-12 h-12 bg-brand-mid flex items-center justify-center flex-shrink-0 overflow-hidden">
              {b.vehicle?.images?.[0]
                ? <img src={b.vehicle.images[0]} alt="" className="w-full h-full object-cover" />
                : <Car size={20} className="text-brand-amber" />
              }
            </div>

            <div className="min-w-0">
              <p className="font-medium text-brand-cream truncate">
                {b.vehicle?.make} {b.vehicle?.model}
                <span className="font-mono text-xs text-brand-muted ml-2">{b.vehicle?.plateNumber}</span>
              </p>
              <p className="font-mono text-xs text-brand-muted mt-0.5 truncate">
                {b.startHub?.city || b.startHub?.name} → {b.endHub?.city || b.endHub?.name}
              </p>
              <p className="font-mono text-xs text-brand-muted">
                {b.startDateTime
                  ? formatDateTime(b.startDateTime)
                  : b.startDate && formatDateTime(b.startDate)
                } — {b.totalHours ? `${b.totalHours}h` : `${b.totalDays}d`}
              </p>
              {isVendorView && (
                <p className="font-mono text-xs text-brand-amber mt-0.5">
                  {b.user?.name} · {b.user?.phone}
                </p>
              )}
              {!isVendorView && b.startVendor && (
                <p className="font-mono text-xs text-brand-muted mt-0.5">
                  Vendor: {b.startVendor?.rentalService?.name || b.startVendor?.name}
                </p>
              )}
              {/* Damage badge */}
              {b.damageReport && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle size={11} className="text-brand-red" />
                  <span className="font-mono text-[10px] text-brand-red">
                    Damage reported — {formatINR(b.damageReport.damageAmount)} deducted
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={statusClass(b.status)}>{statusLabel(b.status)}</span>
            <p className="font-display text-xl text-brand-amber">{formatINR(b.rentalCost)}</p>
            <p className="font-mono text-[10px] text-brand-muted">
              +{formatINR(b.depositAmount)} deposit
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(b.status === 'active' || b.status === 'in_transit') && (
            <Link to={`/tracking/${b._id}`}
              className="btn-ghost text-xs flex items-center gap-1 py-2">
              <Map size={12} /> Track Live
            </Link>
          )}
          <Link to={`/chat/${b._id}`}
            className="btn-ghost text-xs flex items-center gap-1 py-2">
            <MessageSquare size={12} /> Chat
          </Link>

          {/* Vendor actions */}
          {isVendorView && b.status === 'pending' && (
            <>
              <button onClick={() => onVendorAction(b._id, 'active')}
                className="btn-primary py-1.5 px-3 text-xs">Accept</button>
              <button onClick={() => onVendorAction(b._id, 'cancelled')}
                className="btn-danger py-1.5 px-3 text-xs">Decline</button>
            </>
          )}
          {isVendorView && b.status === 'active' && (
            <button onClick={() => onVendorAction(b._id, 'in_transit')}
              className="btn-primary py-1.5 px-3 text-xs">Mark In Transit</button>
          )}
          {isVendorView && b.status === 'in_transit' && (
            <button onClick={() => onVendorAction(b._id, 'completed')}
              className="btn-primary py-1.5 px-3 text-xs">Mark Completed</button>
          )}

          {/* Customer cancel */}
          {!isVendorView && b.status === 'pending' && (
            <button onClick={() => onCancel(b._id)}
              className="btn-ghost text-xs flex items-center gap-1 py-2 text-brand-red hover:text-brand-red">
              <X size={12} /> Cancel
            </button>
          )}

          {/* Rate button — completed bookings */}
          {b.status === 'completed' && (
            <button
              onClick={() => setShowRating(true)}
              className={"btn-ghost text-xs flex items-center gap-1 py-2 " +
                ((isVendorView ? b.vendorRating : b.customerRating)
                  ? 'text-brand-amber'
                  : 'text-brand-muted hover:text-brand-amber'
                )}
            >
              <Star size={12} className={(isVendorView ? b.vendorRating : b.customerRating) ? 'fill-brand-amber' : ''} />
              {(isVendorView ? b.vendorRating : b.customerRating)
                ? `Rated ${isVendorView ? b.vendorRating : b.customerRating}★`
                : 'Rate'
              }
            </button>
          )}

          {/* Handover toggle */}
          {showHandover && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-ghost text-xs flex items-center gap-1 py-2 ml-auto"
            >
              <Camera size={12} />
              {expanded ? 'Hide Media' : 'Photos/Video'}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Handover section — expandable */}
      {expanded && showHandover && (
        <div className="border-t border-white/8 p-4 sm:p-5 space-y-5 bg-brand-mid/20">

          {/* Pickup media */}
          {showPickupUpload && (
            <HandoverUpload
              bookingId={b._id}
              type="pickup"
              existingMedia={b.pickupMedia || []}
              onUploaded={onRefresh}
            />
          )}

          {/* Dropoff media */}
          {showDropoffUpload && (
            <>
              {showPickupUpload && <div className="h-px bg-white/8" />}
              <HandoverUpload
                bookingId={b._id}
                type="dropoff"
                existingMedia={b.dropoffMedia || []}
                onUploaded={onRefresh}
              />
            </>
          )}

          {/* Damage report — vendor only, after completion */}
          {showDamage && (
            <>
              <div className="h-px bg-white/8" />
              <DamageReport booking={b} onReported={onRefresh} />
            </>
          )}
        </div>
      )}
      {/* Rating modal */}
      {showRating && (
        <RatingModal
          booking={b}
          isVendor={isVendorView}
          onClose={() => setShowRating(false)}
          onRated={onRefresh}
        />
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const BookingsPage = ({ vendor = false }) => {
  const dispatch = useDispatch()
  const { isVendor } = useAuth()
  const isVendorView = vendor || isVendor
  const bookings     = useSelector(isVendorView ? selectVendorBookings : selectMyBookings)
  const loading      = useSelector(selectBookingLoading)

  const refresh = () => {
    if (isVendorView) dispatch(fetchVendorBookings())
    else              dispatch(fetchMyBookings())
  }

  useEffect(() => { refresh() }, [isVendorView])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await dispatch(cancelBooking(id)).unwrap()
      toast.success('Booking cancelled')
    } catch (err) { toast.error(err || 'Failed') }
  }

  const handleVendorAction = async (id, status) => {
    try {
      await dispatch(updateBookingStatus({ id, status })).unwrap()
      toast.success(`Booking ${status}`)
    } catch (err) { toast.error(err || 'Failed') }
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-[fadeUp_0.5s_ease_forwards]">
      <div>
        <span className="section-eyebrow">{isVendorView ? 'Rental Requests' : 'My Journeys'}</span>
        <h1 className="font-display text-3xl sm:text-5xl text-brand-cream">
          {isVendorView ? 'All Bookings' : <><span className="text-brand-amber">My</span> Bookings</>}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader label="Loading bookings..." /></div>
      ) : bookings.length === 0 ? (
        <div className="card p-16 border border-white/8 text-center">
          <Car size={48} className="text-brand-muted mx-auto mb-4" />
          <p className="text-brand-muted">No bookings yet.</p>
          {!isVendorView && (
            <Link to="/vehicles" className="btn-primary inline-flex items-center gap-2 mt-4">
              Browse Vehicles
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <BookingCard
              key={b._id}
              b={b}
              isVendorView={isVendorView}
              onVendorAction={handleVendorAction}
              onCancel={handleCancel}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { BookingsPage }
export default BookingsPage