// import { useEffect, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { useDispatch, useSelector } from 'react-redux'
// import {
//   Car, Map, MessageSquare, X, Camera,
//   AlertTriangle, ChevronDown, ChevronUp,
//   Star, CheckCircle, Clock, Package,
// } from 'lucide-react'
// import {
//   fetchMyBookings, fetchVendorBookings, cancelBooking,
//   selectMyBookings, selectVendorBookings, selectBookingLoading,
// } from '../store/slices/bookingSlice'
// import { fetchProfile } from '../store/slices/authSlice'
// import { useAuth } from '../hooks/useAuth'
// import { formatINR, formatDateTime, statusClass, statusLabel } from '../utils/formatters'
// import HandoverUpload from '../components/booking/HandoverUpload'
// import DamageReport   from '../components/booking/DamageReport'
// import RatingModal    from '../components/booking/RatingModal'
// import Loader  from '../components/ui/Loader'
// import api     from '../services/api'
// import toast   from 'react-hot-toast'

// // ── Deposit release modal ─────────────────────────────────────────────────────
// const DepositReleaseModal = ({ booking, onClose, onReleased }) => {
//   const dispatch = useDispatch()
//   const [deduct,      setDeduct]      = useState('')
//   const [note,        setNote]        = useState('')
//   const [submitting,  setSubmitting]  = useState(false)

//   const handleRelease = async () => {
//     const amt = Number(deduct) || 0
//     if (amt > booking.depositAmount) {
//       return toast.error(`Cannot deduct more than deposit (${formatINR(booking.depositAmount)})`)
//     }
//     setSubmitting(true)
//     try {
//       const { data } = await api.patch(`/bookings/${booking._id}/release-deposit`, {
//         deductAmount: amt,
//         note: note.trim() || undefined,
//       })
//       toast.success(data.message)
//       dispatch(fetchProfile())
//       onReleased?.()
//       onClose()
//     } catch (err) {
//       toast.error(err?.response?.data?.message || 'Failed to release deposit')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       onClick={e => e.target === e.currentTarget && onClose()}>
//       <div className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm" />
//       <div className="relative w-full max-w-md bg-brand-slate border border-white/10 shadow-2xl animate-[fadeUp_0.2s_ease_forwards]">
//         <div className="px-6 py-4 border-b border-white/8">
//           <p className="font-mono text-xs tracking-widest uppercase text-brand-amber">Release Security Deposit</p>
//         </div>
//         <div className="p-6 space-y-4">
//           <div className="p-3 bg-brand-amber/5 border border-brand-amber/20">
//             <p className="font-mono text-xs text-brand-amber">
//               Deposit held: {formatINR(booking.depositAmount)}
//             </p>
//             <p className="font-mono text-[10px] text-brand-muted mt-0.5">
//               Customer: {booking.user?.name}
//             </p>
//           </div>

//           <div>
//             <label className="input-label">Damage Deduction (₹) <span className="text-brand-muted">(0 for full refund)</span></label>
//             <input type="number" value={deduct} onChange={e => setDeduct(e.target.value)}
//               placeholder="0" min="0" max={booking.depositAmount} className="input-field" />
//           </div>

//           {Number(deduct) > 0 && (
//             <div className="p-3 bg-brand-mid/40 border border-white/8 font-mono text-xs space-y-1">
//               <div className="flex justify-between text-brand-muted">
//                 <span>Deposit</span><span>{formatINR(booking.depositAmount)}</span>
//               </div>
//               <div className="flex justify-between text-brand-red">
//                 <span>Deduction</span><span>-{formatINR(Number(deduct))}</span>
//               </div>
//               <div className="flex justify-between text-green-400 pt-1 border-t border-white/8">
//                 <span>Customer refund</span>
//                 <span>{formatINR(booking.depositAmount - Number(deduct))}</span>
//               </div>
//             </div>
//           )}

//           <div>
//             <label className="input-label">Note <span className="text-brand-muted">(optional)</span></label>
//             <textarea value={note} onChange={e => setNote(e.target.value)}
//               placeholder="Reason for deduction or note for customer..."
//               rows={2} className="input-field resize-none text-sm" />
//           </div>

//           <div className="flex gap-3">
//             <button onClick={onClose} className="btn-outline flex-1 py-2.5">Cancel</button>
//             <button onClick={handleRelease} disabled={submitting}
//               className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-40">
//               {submitting
//                 ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
//                 : <><CheckCircle size={14} /> Release Deposit</>
//               }
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ── Booking card ──────────────────────────────────────────────────────────────
// const BookingCard = ({ b, isVendorView, onRefresh }) => {
//   const dispatch = useDispatch()
//   const { user } = useAuth()
//   const [expanded,        setExpanded]        = useState(false)
//   const [showRating,      setShowRating]       = useState(false)
//   const [showDeposit,     setShowDeposit]      = useState(false)
//   const [acting,          setActing]           = useState(false)

//   const uid         = user?._id
//   const isStartV    = b.startVendor?._id === uid || b.startVendor === uid
//   const isEndV      = b.endVendor?._id   === uid || b.endVendor   === uid

//   const showPickup  = ['pending','awaiting_destination_vendor','active'].includes(b.status)
//   const showDropoff = ['active','in_transit','dropped_at_destination','completed_by_destination','completed'].includes(b.status)
//   const showDamage  = isVendorView && ['completed_by_destination','completed'].includes(b.status)
//   const showHandover= showPickup || showDropoff || showDamage

//   const doAction = async (endpoint, body = {}) => {
//     setActing(true)
//     try {
//       await api.patch(`/bookings/${b._id}/${endpoint}`, body)
//       onRefresh()
//     } catch (err) {
//       toast.error(err?.response?.data?.message || 'Action failed')
//     } finally { setActing(false) }
//   }

//   return (
//     <>
//       <div className="card border border-white/8 overflow-hidden">
//         <div className="p-4 sm:p-5">
//           <div className="flex items-start justify-between gap-3 flex-wrap">
//             {/* Left */}
//             <div className="flex items-start gap-3 min-w-0">
//               <div className="w-11 h-11 bg-brand-mid flex items-center justify-center shrink-0 overflow-hidden">
//                 {b.vehicle?.images?.[0]
//                   ? <img src={b.vehicle.images[0]} alt="" className="w-full h-full object-cover" />
//                   : <Car size={18} className="text-brand-amber" />
//                 }
//               </div>
//               <div className="min-w-0">
//                 <p className="font-medium text-brand-cream truncate text-sm">
//                   {b.vehicle?.make} {b.vehicle?.model}
//                   <span className="font-mono text-xs text-brand-muted ml-2">{b.vehicle?.plateNumber}</span>
//                 </p>
//                 <p className="font-mono text-xs text-brand-muted truncate mt-0.5">
//                   {b.startHub?.city || b.startHub?.name} → {b.endHub?.city || b.endHub?.name}
//                 </p>
//                 {b.startDateTime && (
//                   <p className="font-mono text-xs text-brand-muted">
//                     {formatDateTime(b.startDateTime)}
//                     {b.totalHours ? ` · ${b.totalHours}h` : b.totalDays ? ` · ${b.totalDays}d` : ''}
//                   </p>
//                 )}
//                 {/* Party details */}
//                 {!isVendorView && b.startVendor && (
//                   <p className="font-mono text-xs text-brand-amber mt-0.5 truncate">
//                     📍 {b.startVendor.rentalService?.name || b.startVendor.name}
//                     {b.startVendor.phone && ` · ${b.startVendor.phone}`}
//                   </p>
//                 )}
//                 {isVendorView && b.user && (
//                   <p className="font-mono text-xs text-brand-amber mt-0.5 truncate">
//                     👤 {b.user.name} · {b.user.phone}
//                   </p>
//                 )}
//                 {isStartV && b.endVendor && (
//                   <p className="font-mono text-xs text-green-400 truncate">
//                     🏁 {b.endVendor.rentalService?.name || b.endVendor.name}
//                     {b.endVendor.phone && ` · ${b.endVendor.phone}`}
//                   </p>
//                 )}
//                 {isEndV && b.startVendor && (
//                   <p className="font-mono text-xs text-brand-muted truncate">
//                     🚦 Source: {b.startVendor.rentalService?.name || b.startVendor.name}
//                   </p>
//                 )}
//                 {b.damageReport && (
//                   <div className="flex items-center gap-1 mt-1">
//                     <AlertTriangle size={10} className="text-brand-red" />
//                     <span className="font-mono text-[10px] text-brand-red">
//                       Damage: {formatINR(b.damageReport.damageAmount)} deducted
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Right */}
//             <div className="flex flex-col items-end gap-1.5 shrink-0">
//               <span className={statusClass(b.status)}>{statusLabel(b.status)}</span>
//               <p className="font-display text-xl text-brand-amber">{formatINR(b.rentalCost)}</p>
//               <p className="font-mono text-[10px] text-brand-muted">+{formatINR(b.depositAmount)} deposit</p>
//               {b.depositReleased && (
//                 <span className="font-mono text-[10px] text-green-400">Deposit returned ✓</span>
//               )}
//             </div>
//           </div>

//           {/* ── Actions ─────────────────────────────────────────────────────── */}
//           <div className="flex gap-2 mt-4 flex-wrap">
//             {/* Track */}
//             {['active','in_transit'].includes(b.status) && (
//               <Link to={`/tracking/${b._id}`} className="btn-ghost text-xs flex items-center gap-1 py-2">
//                 <Map size={12} /> Track
//               </Link>
//             )}

//             {/* Chat */}
//             <Link to={`/chat/${b._id}`} className="btn-ghost text-xs flex items-center gap-1 py-2">
//               <MessageSquare size={12} /> Chat
//             </Link>

//             {/* ── SOURCE VENDOR actions ─────────────────────────────────── */}
//             {isStartV && b.status === 'pending' && (
//               <Link to={`/vendor/bookings`}
//                 className="btn-primary text-xs py-2 px-3">
//                 Review & Approve
//               </Link>
//             )}
//             {isStartV && b.status === 'completed_by_destination' && !b.depositReleased && (
//               <button onClick={() => setShowDeposit(true)}
//                 className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
//                 <CheckCircle size={12} /> Release Deposit
//               </button>
//             )}

//             {/* ── DESTINATION VENDOR actions ────────────────────────────── */}
//             {isEndV && b.status === 'awaiting_destination_vendor' && (
//               <>
//                 <button onClick={() => doAction('end-vendor-action', { action: 'approve' })}
//                   disabled={acting} className="btn-primary text-xs py-2 px-3">
//                   Approve
//                 </button>
//                 <button onClick={() => doAction('end-vendor-action', { action: 'decline' })}
//                   disabled={acting} className="btn-danger text-xs py-2 px-3">
//                   Decline
//                 </button>
//               </>
//             )}
//             {isEndV && b.status === 'dropped_at_destination' && (
//               <button onClick={() => doAction('mark-received')}
//                 disabled={acting} className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
//                 <Package size={12} /> Mark Received
//               </button>
//             )}

//             {/* ── CUSTOMER actions ──────────────────────────────────────── */}
//             {!isVendorView && b.status === 'active' && (
//               <button onClick={() => doAction('status', { status: 'in_transit' })}
//                 disabled={acting} className="btn-primary text-xs py-2 px-3">
//                 Start Trip
//               </button>
//             )}
//             {!isVendorView && b.status === 'in_transit' && (
//               <button onClick={() => doAction('mark-dropped')}
//                 disabled={acting} className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
//                 <Package size={12} /> Mark Dropped
//               </button>
//             )}
//             {!isVendorView && b.status === 'pending' && (
//               <button onClick={async () => {
//                 if (!confirm('Cancel this booking?')) return
//                 try {
//                   await dispatch(cancelBooking(b._id)).unwrap()
//                   toast.success('Booking cancelled')
//                   onRefresh()
//                 } catch (err) { toast.error(err || 'Failed') }
//               }} className="btn-ghost text-xs flex items-center gap-1 py-2 text-brand-red">
//                 <X size={12} /> Cancel
//               </button>
//             )}

//             {/* Rate */}
//             {b.status === 'completed' && (
//               <button onClick={() => setShowRating(true)}
//                 className={"btn-ghost text-xs flex items-center gap-1 py-2 " +
//                   ((isVendorView ? b.vendorRating : b.customerRating) ? 'text-brand-amber' : 'text-brand-muted hover:text-brand-amber')}>
//                 <Star size={12} className={(isVendorView ? b.vendorRating : b.customerRating) ? 'fill-brand-amber' : ''} />
//                 {(isVendorView ? b.vendorRating : b.customerRating) ? `Rated ★` : 'Rate'}
//               </button>
//             )}

//             {/* Photos/Video toggle */}
//             {showHandover && (
//               <button onClick={() => setExpanded(!expanded)}
//                 className="btn-ghost text-xs flex items-center gap-1 py-2 ml-auto">
//                 <Camera size={12} />
//                 {expanded ? 'Hide' : 'Photos/Video'}
//                 {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Handover section */}
//         {expanded && showHandover && (
//           <div className="border-t border-white/8 p-4 sm:p-5 space-y-5 bg-brand-mid/20">
//             {showPickup && (
//               <HandoverUpload bookingId={b._id} type="pickup"
//                 existingMedia={b.pickupMedia || []} onUploaded={onRefresh} />
//             )}
//             {showDropoff && (
//               <>
//                 {showPickup && <div className="h-px bg-white/8" />}
//                 <HandoverUpload bookingId={b._id} type="dropoff"
//                   existingMedia={b.dropoffMedia || []} onUploaded={onRefresh} />
//               </>
//             )}
//             {showDamage && (
//               <>
//                 <div className="h-px bg-white/8" />
//                 <DamageReport booking={b} onReported={onRefresh} />
//               </>
//             )}
//           </div>
//         )}
//       </div>

//       {showRating && (
//         <RatingModal booking={b} isVendor={isVendorView}
//           onClose={() => setShowRating(false)} onRated={onRefresh} />
//       )}
//       {showDeposit && (
//         <DepositReleaseModal booking={b}
//           onClose={() => setShowDeposit(false)} onReleased={onRefresh} />
//       )}
//     </>
//   )
// }

// // ── Page ──────────────────────────────────────────────────────────────────────
// const BookingsPage = ({ vendor = false }) => {
//   const dispatch     = useDispatch()
//   const { isVendor } = useAuth()
//   const isVendorView = vendor || isVendor
//   const bookings     = useSelector(isVendorView ? selectVendorBookings : selectMyBookings)
//   const loading      = useSelector(selectBookingLoading)

//   const refresh = () => {
//     if (isVendorView) dispatch(fetchVendorBookings())
//     else              dispatch(fetchMyBookings())
//   }

//   useEffect(() => { refresh() }, [isVendorView])

//   return (
//     <div className="space-y-5 sm:space-y-6 animate-[fadeUp_0.5s_ease_forwards]">
//       <div>
//         <span className="section-eyebrow">{isVendorView ? 'Rental Requests' : 'My Journeys'}</span>
//         <h1 className="font-display text-3xl sm:text-5xl text-brand-cream">
//           {isVendorView ? 'All Bookings' : <><span className="text-brand-amber">My</span> Bookings</>}
//         </h1>
//       </div>

//       {loading ? (
//         <div className="flex justify-center py-20"><Loader label="Loading..." /></div>
//       ) : bookings.length === 0 ? (
//         <div className="card p-16 border border-white/8 text-center">
//           <Car size={48} className="text-brand-muted mx-auto mb-4" />
//           <p className="text-brand-muted">No bookings yet.</p>
//           {!isVendorView && (
//             <Link to="/vehicles" className="btn-primary inline-flex items-center gap-2 mt-4">
//               Browse Vehicles
//             </Link>
//           )}
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {bookings.map(b => (
//             <BookingCard key={b._id} b={b} isVendorView={isVendorView} onRefresh={refresh} />
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// export { BookingsPage }
// export default BookingsPage



































import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Car, Map, MessageSquare, X, Camera,
  AlertTriangle, ChevronDown, ChevronUp,
  Star, CheckCircle, Clock, Package,
} from 'lucide-react'
import {
  fetchMyBookings, fetchVendorBookings, cancelBooking,
  selectMyBookings, selectVendorBookings, selectBookingLoading,
} from '../store/slices/bookingSlice'
import { fetchProfile } from '../store/slices/authSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR, formatDateTime, statusClass, statusLabel } from '../utils/formatters'
import HandoverUpload    from '../components/booking/HandoverUpload'
import BookingDetailModal from '../components/vendor/BookingDetailModal'
import DamageReport   from '../components/booking/DamageReport'
import RatingModal    from '../components/booking/RatingModal'
import Loader  from '../components/ui/Loader'
import api     from '../services/api'
import toast   from 'react-hot-toast'

// ── Deposit release modal ─────────────────────────────────────────────────────
const DepositReleaseModal = ({ booking, onClose, onReleased }) => {
  const dispatch = useDispatch()
  const [deduct,      setDeduct]      = useState('')
  const [note,        setNote]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  const handleRelease = async () => {
    const amt = Number(deduct) || 0
    if (amt > booking.depositAmount) {
      return toast.error(`Cannot deduct more than deposit (${formatINR(booking.depositAmount)})`)
    }
    setSubmitting(true)
    try {
      const { data } = await api.patch(`/bookings/${booking._id}/release-deposit`, {
        deductAmount: amt,
        note: note.trim() || undefined,
      })
      toast.success(data.message)
      dispatch(fetchProfile())
      onReleased?.()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to release deposit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-brand-slate border border-white/10 shadow-2xl animate-[fadeUp_0.2s_ease_forwards]">
        <div className="px-6 py-4 border-b border-white/8">
          <p className="font-mono text-xs tracking-widest uppercase text-brand-amber">Release Security Deposit</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-brand-amber/5 border border-brand-amber/20">
            <p className="font-mono text-xs text-brand-amber">
              Deposit held: {formatINR(booking.depositAmount)}
            </p>
            <p className="font-mono text-[10px] text-brand-muted mt-0.5">
              Customer: {booking.user?.name}
            </p>
          </div>

          <div>
            <label className="input-label">Damage Deduction (₹) <span className="text-brand-muted">(0 for full refund)</span></label>
            <input type="number" value={deduct} onChange={e => setDeduct(e.target.value)}
              placeholder="0" min="0" max={booking.depositAmount} className="input-field" />
          </div>

          {Number(deduct) > 0 && (
            <div className="p-3 bg-brand-mid/40 border border-white/8 font-mono text-xs space-y-1">
              <div className="flex justify-between text-brand-muted">
                <span>Deposit</span><span>{formatINR(booking.depositAmount)}</span>
              </div>
              <div className="flex justify-between text-brand-red">
                <span>Deduction</span><span>-{formatINR(Number(deduct))}</span>
              </div>
              <div className="flex justify-between text-green-400 pt-1 border-t border-white/8">
                <span>Customer refund</span>
                <span>{formatINR(booking.depositAmount - Number(deduct))}</span>
              </div>
            </div>
          )}

          <div>
            <label className="input-label">Note <span className="text-brand-muted">(optional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Reason for deduction or note for customer..."
              rows={2} className="input-field resize-none text-sm" />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1 py-2.5">Cancel</button>
            <button onClick={handleRelease} disabled={submitting}
              className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-40">
              {submitting
                ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                : <><CheckCircle size={14} /> Release Deposit</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Booking card ──────────────────────────────────────────────────────────────
const BookingCard = ({ b, isVendorView, onRefresh }) => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const [expanded,        setExpanded]        = useState(false)
  const [showRating,      setShowRating]       = useState(false)
  const [showDeposit,     setShowDeposit]      = useState(false)
  const [showReview,      setShowReview]       = useState(false)
  const [acting,          setActing]           = useState(false)

  const uid         = user?._id
  const isStartV    = b.startVendor?._id === uid || b.startVendor === uid
  const isEndV      = b.endVendor?._id   === uid || b.endVendor   === uid

  const showPickup  = ['pending','awaiting_destination_vendor','active'].includes(b.status)
  const showDropoff = ['active','in_transit','dropped_at_destination','completed_by_destination','completed'].includes(b.status)
  const showDamage  = isVendorView && ['completed_by_destination','completed'].includes(b.status)
  const showHandover= showPickup || showDropoff || showDamage

  const doAction = async (endpoint, body = {}) => {
    setActing(true)
    try {
      await api.patch(`/bookings/${b._id}/${endpoint}`, body)
      onRefresh()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed')
    } finally { setActing(false) }
  }

  return (
    <>
      <div className="card border border-white/8 overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            {/* Left */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 bg-brand-mid flex items-center justify-center shrink-0 overflow-hidden">
                {b.vehicle?.images?.[0]
                  ? <img src={b.vehicle.images[0]} alt="" className="w-full h-full object-cover" />
                  : <Car size={18} className="text-brand-amber" />
                }
              </div>
              <div className="min-w-0">
                <p className="font-medium text-brand-cream truncate text-sm">
                  {b.vehicle?.make} {b.vehicle?.model}
                  <span className="font-mono text-xs text-brand-muted ml-2">{b.vehicle?.plateNumber}</span>
                </p>
                <p className="font-mono text-xs text-brand-muted truncate mt-0.5">
                  {b.startHub?.city || b.startHub?.name} → {b.endHub?.city || b.endHub?.name}
                </p>
                {b.startDateTime && (
                  <p className="font-mono text-xs text-brand-muted">
                    {formatDateTime(b.startDateTime)}
                    {b.totalHours ? ` · ${b.totalHours}h` : b.totalDays ? ` · ${b.totalDays}d` : ''}
                  </p>
                )}
                {/* Party details */}
                {!isVendorView && b.startVendor && (
                  <p className="font-mono text-xs text-brand-amber mt-0.5 truncate">
                    📍 {b.startVendor.rentalService?.name || b.startVendor.name}
                    {b.startVendor.phone && ` · ${b.startVendor.phone}`}
                  </p>
                )}
                {isVendorView && b.user && (
                  <p className="font-mono text-xs text-brand-amber mt-0.5 truncate">
                    👤 {b.user.name} · {b.user.phone}
                  </p>
                )}
                {isStartV && b.endVendor && (
                  <p className="font-mono text-xs text-green-400 truncate">
                    🏁 {b.endVendor.rentalService?.name || b.endVendor.name}
                    {b.endVendor.phone && ` · ${b.endVendor.phone}`}
                  </p>
                )}
                {isEndV && b.startVendor && (
                  <p className="font-mono text-xs text-brand-muted truncate">
                    🚦 Source: {b.startVendor.rentalService?.name || b.startVendor.name}
                  </p>
                )}
                {b.damageReport && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle size={10} className="text-brand-red" />
                    <span className="font-mono text-[10px] text-brand-red">
                      Damage: {formatINR(b.damageReport.damageAmount)} deducted
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={statusClass(b.status)}>{statusLabel(b.status)}</span>
              <p className="font-display text-xl text-brand-amber">{formatINR(b.rentalCost)}</p>
              <p className="font-mono text-[10px] text-brand-muted">+{formatINR(b.depositAmount)} deposit</p>
              {b.depositReleased && (
                <span className="font-mono text-[10px] text-green-400">Deposit returned ✓</span>
              )}
            </div>
          </div>

          {/* ── Actions ─────────────────────────────────────────────────────── */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {/* Track */}
            {['active','in_transit'].includes(b.status) && (
              <Link to={`/tracking/${b._id}`} className="btn-ghost text-xs flex items-center gap-1 py-2">
                <Map size={12} /> Track
              </Link>
            )}

            {/* Chat */}
            <Link to={`/chat/${b._id}`} className="btn-ghost text-xs flex items-center gap-1 py-2">
              <MessageSquare size={12} /> Chat
            </Link>

            {/* ── SOURCE VENDOR actions ─────────────────────────────────── */}
            {isStartV && b.status === 'pending' && (
              <button onClick={() => setShowReview(true)}
                className="btn-primary text-xs py-2 px-3">
                Review & Approve
              </button>
            )}
            {isStartV && b.status === 'completed_by_destination' && !b.depositReleased && (
              <button onClick={() => setShowDeposit(true)}
                className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
                <CheckCircle size={12} /> Release Deposit
              </button>
            )}

            {/* ── DESTINATION VENDOR actions ────────────────────────────── */}
            {isEndV && b.status === 'awaiting_destination_vendor' && (
              <>
                <button onClick={() => doAction('end-vendor-action', { action: 'approve' })}
                  disabled={acting} className="btn-primary text-xs py-2 px-3">
                  Approve
                </button>
                <button onClick={() => doAction('end-vendor-action', { action: 'decline' })}
                  disabled={acting} className="btn-danger text-xs py-2 px-3">
                  Decline
                </button>
              </>
            )}
            {isEndV && b.status === 'dropped_at_destination' && (
              <button onClick={() => doAction('mark-received')}
                disabled={acting} className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
                <Package size={12} /> Mark Received
              </button>
            )}

            {/* ── CUSTOMER actions ──────────────────────────────────────── */}
            {!isVendorView && b.status === 'active' && (
              <button onClick={() => doAction('status', { status: 'in_transit' })}
                disabled={acting} className="btn-primary text-xs py-2 px-3">
                Start Trip
              </button>
            )}
            {!isVendorView && b.status === 'in_transit' && (
              <button onClick={() => doAction('mark-dropped')}
                disabled={acting} className="btn-primary text-xs py-2 px-3 flex items-center gap-1">
                <Package size={12} /> Mark Dropped
              </button>
            )}
            {!isVendorView && b.status === 'pending' && (
              <button onClick={async () => {
                if (!confirm('Cancel this booking?')) return
                try {
                  await dispatch(cancelBooking(b._id)).unwrap()
                  toast.success('Booking cancelled')
                  onRefresh()
                } catch (err) { toast.error(err || 'Failed') }
              }} className="btn-ghost text-xs flex items-center gap-1 py-2 text-brand-red">
                <X size={12} /> Cancel
              </button>
            )}

            {/* Rate */}
            {b.status === 'completed' && (
              <button onClick={() => setShowRating(true)}
                className={"btn-ghost text-xs flex items-center gap-1 py-2 " +
                  ((isVendorView ? b.vendorRating : b.customerRating) ? 'text-brand-amber' : 'text-brand-muted hover:text-brand-amber')}>
                <Star size={12} className={(isVendorView ? b.vendorRating : b.customerRating) ? 'fill-brand-amber' : ''} />
                {(isVendorView ? b.vendorRating : b.customerRating) ? `Rated ★` : 'Rate'}
              </button>
            )}

            {/* Photos/Video toggle */}
            {showHandover && (
              <button onClick={() => setExpanded(!expanded)}
                className="btn-ghost text-xs flex items-center gap-1 py-2 ml-auto">
                <Camera size={12} />
                {expanded ? 'Hide' : 'Photos/Video'}
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* Handover section */}
        {expanded && showHandover && (
          <div className="border-t border-white/8 p-4 sm:p-5 space-y-5 bg-brand-mid/20">
            {showPickup && (
              <HandoverUpload bookingId={b._id} type="pickup"
                existingMedia={b.pickupMedia || []} onUploaded={onRefresh} />
            )}
            {showDropoff && (
              <>
                {showPickup && <div className="h-px bg-white/8" />}
                <HandoverUpload bookingId={b._id} type="dropoff"
                  existingMedia={b.dropoffMedia || []} onUploaded={onRefresh} />
              </>
            )}
            {showDamage && (
              <>
                <div className="h-px bg-white/8" />
                <DamageReport booking={b} onReported={onRefresh} />
              </>
            )}
          </div>
        )}
      </div>

      {showRating && (
        <RatingModal booking={b} isVendor={isVendorView}
          onClose={() => setShowRating(false)} onRated={onRefresh} />
      )}
      {showDeposit && (
        <DepositReleaseModal booking={b}
          onClose={() => setShowDeposit(false)} onReleased={onRefresh} />
      )}
      {showReview && (
        <BookingDetailModal
          booking={b}
          onClose={() => setShowReview(false)}
          onActionDone={() => { setShowReview(false); onRefresh() }}
        />
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const BookingsPage = ({ vendor = false }) => {
  const dispatch     = useDispatch()
  const { isVendor } = useAuth()
  const isVendorView = vendor || isVendor
  const bookings     = useSelector(isVendorView ? selectVendorBookings : selectMyBookings)
  const loading      = useSelector(selectBookingLoading)

  const refresh = () => {
    if (isVendorView) dispatch(fetchVendorBookings())
    else              dispatch(fetchMyBookings())
  }

  useEffect(() => { refresh() }, [isVendorView])

  return (
    <div className="space-y-5 sm:space-y-6 animate-[fadeUp_0.5s_ease_forwards]">
      <div>
        <span className="section-eyebrow">{isVendorView ? 'Rental Requests' : 'My Journeys'}</span>
        <h1 className="font-display text-3xl sm:text-5xl text-brand-cream">
          {isVendorView ? 'All Bookings' : <><span className="text-brand-amber">My</span> Bookings</>}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader label="Loading..." /></div>
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
            <BookingCard key={b._id} b={b} isVendorView={isVendorView} onRefresh={refresh} />
          ))}
        </div>
      )}
    </div>
  )
}

export { BookingsPage }
export default BookingsPage