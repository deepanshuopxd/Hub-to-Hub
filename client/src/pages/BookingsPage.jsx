// BookingsPage.jsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Car, Map, MessageSquare, X } from 'lucide-react'
import {
  fetchMyBookings, fetchVendorBookings, cancelBooking, updateBookingStatus,
  selectMyBookings, selectVendorBookings, selectBookingLoading,
} from '../store/slices/bookingSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR, formatDate, statusClass, statusLabel } from '../utils/formatters'
import Loader from '../components/ui/Loader'
import toast from 'react-hot-toast'

const BookingsPage = ({ vendor = false }) => {
  const dispatch = useDispatch()
  const { isVendor } = useAuth()
  const isVendorView = vendor || isVendor
  const bookings = useSelector(isVendorView ? selectVendorBookings : selectMyBookings)
  const loading  = useSelector(selectBookingLoading)

  useEffect(() => {
    if (isVendorView) dispatch(fetchVendorBookings())
    else              dispatch(fetchMyBookings())
  }, [dispatch, isVendorView])

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
    <div className="space-y-6 animate-[fadeUp_0.5s_ease_forwards]">
      <div>
        <span className="section-eyebrow">{isVendorView ? 'Rental Requests' : 'My Journeys'}</span>
        <h1 className="font-display text-5xl text-brand-cream">
          {isVendorView ? 'All Bookings' : <><span className="text-brand-amber">My</span> Bookings</>}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader label="Loading bookings..." /></div>
      ) : bookings.length === 0 ? (
        <div className="card p-16 border border-white/8 text-center">
          <Car size={48} className="text-brand-muted mx-auto mb-4" />
          <p className="text-brand-muted">No bookings yet.</p>
          {!isVendorView && <Link to="/vehicles" className="btn-primary inline-flex items-center gap-2 mt-4">Browse Vehicles</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b._id} className="card p-5 border border-white/8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-mid flex items-center justify-center flex-shrink-0">
                    <Car size={20} className="text-brand-amber" />
                  </div>
                  <div>
                    <p className="font-medium text-brand-cream">
                      {b.vehicle?.make} {b.vehicle?.model}
                      <span className="font-mono text-xs text-brand-muted ml-2">{b.vehicle?.plateNumber}</span>
                    </p>
                    <p className="font-mono text-xs text-brand-muted mt-0.5">
                      {b.startHub?.name} → {b.endHub?.name}
                    </p>
                    <p className="font-mono text-xs text-brand-muted">
                      {formatDate(b.startDate)} – {formatDate(b.endDate)}
                    </p>
                    {isVendorView && (
                      <p className="font-mono text-xs text-brand-amber mt-0.5">
                        Customer: {b.user?.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={statusClass(b.status)}>{statusLabel(b.status)}</span>
                  <p className="font-display text-2xl text-brand-amber">{formatINR(b.totalPrice)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {(b.status === 'active' || b.status === 'in_transit') && (
                  <Link to={`/tracking/${b._id}`} className="btn-ghost text-xs flex items-center gap-1 py-2">
                    <Map size={12} /> Track Live
                  </Link>
                )}
                <Link to={`/chat/${b._id}`} className="btn-ghost text-xs flex items-center gap-1 py-2">
                  <MessageSquare size={12} /> Chat
                </Link>
                {isVendorView && b.status === 'pending' && (
                  <>
                    <button onClick={() => handleVendorAction(b._id, 'active')} className="btn-primary py-1.5 px-3 text-xs">Accept</button>
                    <button onClick={() => handleVendorAction(b._id, 'cancelled')} className="btn-danger py-1.5 px-3 text-xs">Decline</button>
                  </>
                )}
                {isVendorView && b.status === 'active' && (
                  <button onClick={() => handleVendorAction(b._id, 'completed')} className="btn-primary py-1.5 px-3 text-xs">Mark Complete</button>
                )}
                {!isVendorView && b.status === 'pending' && (
                  <button onClick={() => handleCancel(b._id)} className="btn-ghost text-xs flex items-center gap-1 py-2 text-brand-red hover:text-brand-red">
                    <X size={12} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { BookingsPage }
export default BookingsPage