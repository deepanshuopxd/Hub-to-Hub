import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MapPin, Calendar, ArrowRight, Car, AlertTriangle, ShieldCheck } from 'lucide-react'
import { fetchVehicleById, selectSelectedVehicle } from '../store/slices/vehicleSlice'
import { createBooking, selectBookingCreating } from '../store/slices/bookingSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR, formatDate, calculateDays, calculateTotalPrice, HUBS } from '../utils/formatters'
import { validateBookingForm, hasErrors } from '../utils/validators'
import Loader from '../components/ui/Loader'
import toast from 'react-hot-toast'

const DEPOSIT = Number(import.meta.env.VITE_DEPOSIT_AMOUNT) || 2000

const BookingPage = () => {
  const { id }     = useParams()
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user, isKycVerified } = useAuth()

  const vehicle  = useSelector(selectSelectedVehicle)
  const creating = useSelector(selectBookingCreating)

  const [form, setForm] = useState({
    startHub:  null,
    endHub:    null,
    startDate: '',
    endDate:   '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (id) dispatch(fetchVehicleById(id))
  }, [id, dispatch])

  // Pre-fill start hub from vehicle location
  useEffect(() => {
    if (vehicle?.currentHub) {
      const hub = HUBS.find(h => h.name === vehicle.currentHub.name) || vehicle.currentHub
      setForm(f => ({ ...f, startHub: hub }))
    }
  }, [vehicle])

  const days       = form.startDate && form.endDate ? calculateDays(form.startDate, form.endDate) : 0
  const rentalCost = vehicle ? calculateTotalPrice(vehicle.pricePerDay, form.startDate || new Date(), form.endDate || new Date()) : 0
  const totalCost  = rentalCost + DEPOSIT

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateBookingForm(form)
    if (hasErrors(errs)) { setErrors(errs); return }

    if (!isKycVerified) {
      toast.error('Complete KYC verification before booking')
      navigate('/kyc')
      return
    }

    if ((user?.wallet?.balance || 0) < DEPOSIT) {
      toast.error(`Insufficient wallet balance. Need ${formatINR(DEPOSIT)} for security deposit.`)
      return
    }

    try {
      const result = await dispatch(createBooking({
        vehicleId:  id,
        startHub:   form.startHub,
        endHub:     form.endHub,
        startDate:  form.startDate,
        endDate:    form.endDate,
        totalPrice: days > 0 ? calculateTotalPrice(vehicle.pricePerDay, form.startDate, form.endDate) : 0,
      })).unwrap()

      toast.success('Booking confirmed!')
      navigate('/bookings')
    } catch (err) {
      toast.error(err || 'Booking failed')
    }
  }

  if (!vehicle) return <div className="flex justify-center py-20"><Loader label="Loading vehicle..." /></div>

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-4xl animate-[fadeUp_0.5s_ease_forwards]">
      <span className="section-eyebrow">New Booking</span>
      <h1 className="font-display text-5xl text-brand-cream mb-8">
        Book <span className="text-brand-amber">{vehicle.make} {vehicle.model}</span>
      </h1>

      {/* KYC warning */}
      {!isKycVerified && (
        <div className="mb-6 p-4 border border-brand-red/30 bg-brand-red/5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-brand-red flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-cream">KYC Required</p>
            <p className="font-mono text-xs text-brand-muted mt-0.5">
              You must complete identity verification before booking.{' '}
              <a href="/kyc" className="text-brand-amber hover:underline">Verify now →</a>
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form — 3 cols */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          {/* Hub selectors */}
          <div className="space-y-4">
            <h2 className="font-mono text-xs tracking-widest uppercase text-brand-amber flex items-center gap-2">
              <MapPin size={14} /> Select Route
            </h2>

            {/* Start Hub */}
            <div>
              <label className="input-label">Pickup Hub</label>
              <select
                value={form.startHub?.name || ''}
                onChange={(e) => {
                  const hub = HUBS.find(h => h.name === e.target.value)
                  setForm(f => ({ ...f, startHub: hub }))
                  if (errors.startHub) setErrors(er => ({ ...er, startHub: null }))
                }}
                className={`input-field ${errors.startHub ? 'border-brand-red/50' : ''}`}
              >
                <option value="">Select pickup hub</option>
                {HUBS.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
              </select>
              {errors.startHub && <p className="font-mono text-xs text-brand-red mt-1">{errors.startHub}</p>}
            </div>

            {/* Arrow */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/8" />
              <ArrowRight size={16} className="text-brand-amber" />
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* End Hub */}
            <div>
              <label className="input-label">Drop-off Hub</label>
              <select
                value={form.endHub?.name || ''}
                onChange={(e) => {
                  const hub = HUBS.find(h => h.name === e.target.value)
                  setForm(f => ({ ...f, endHub: hub }))
                  if (errors.endHub) setErrors(er => ({ ...er, endHub: null }))
                }}
                className={`input-field ${errors.endHub ? 'border-brand-red/50' : ''}`}
              >
                <option value="">Select drop-off hub</option>
                {HUBS.filter(h => h.name !== form.startHub?.name).map(h => (
                  <option key={h.name} value={h.name}>{h.name}</option>
                ))}
              </select>
              {errors.endHub && <p className="font-mono text-xs text-brand-red mt-1">{errors.endHub}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h2 className="font-mono text-xs tracking-widest uppercase text-brand-amber flex items-center gap-2">
              <Calendar size={14} /> Travel Dates
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Start Date</label>
                <input type="date" value={form.startDate} min={today}
                  onChange={(e) => { setForm(f => ({ ...f, startDate: e.target.value })); setErrors(er => ({ ...er, startDate: null })) }}
                  className={`input-field ${errors.startDate ? 'border-brand-red/50' : ''}`} />
                {errors.startDate && <p className="font-mono text-xs text-brand-red mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="input-label">End Date</label>
                <input type="date" value={form.endDate} min={form.startDate || today}
                  onChange={(e) => { setForm(f => ({ ...f, endDate: e.target.value })); setErrors(er => ({ ...er, endDate: null })) }}
                  className={`input-field ${errors.endDate ? 'border-brand-red/50' : ''}`} />
                {errors.endDate && <p className="font-mono text-xs text-brand-red mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating || !isKycVerified}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? (
              <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
            ) : (
              <><ShieldCheck size={16} /> Confirm Booking & Pay Deposit</>
            )}
          </button>
        </form>

        {/* Summary — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Vehicle card */}
          <div className="card p-5 border border-white/8">
            <div className="w-full h-36 bg-brand-mid mb-4 overflow-hidden">
              {vehicle.images?.[0] ? (
                <img src={vehicle.images[0]} alt="vehicle" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car size={36} className="text-brand-muted/30" />
                </div>
              )}
            </div>
            <h3 className="font-medium text-brand-cream">{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
            <p className="font-mono text-xs text-brand-muted mt-1">{vehicle.plateNumber}</p>
            <p className="font-mono text-xs text-brand-muted">{vehicle.currentHub?.name}</p>
            <div className="mt-3 pt-3 border-t border-white/8">
              <span className="font-display text-2xl text-brand-amber">{formatINR(vehicle.pricePerDay)}</span>
              <span className="font-mono text-xs text-brand-muted ml-1">/day</span>
            </div>
          </div>

          {/* Price breakdown */}
          {days > 0 && (
            <div className="card p-5 border border-brand-amber/20 bg-brand-amber/3 space-y-3">
              <h3 className="font-mono text-xs tracking-widest uppercase text-brand-amber">Price Summary</h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-brand-muted">
                  <span>Rental ({formatINR(vehicle.pricePerDay)} × {days} days)</span>
                  <span className="text-brand-cream">{formatINR(rentalCost)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Security deposit (refundable)</span>
                  <span className="text-brand-cream">{formatINR(DEPOSIT)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/8 text-brand-cream">
                  <span className="font-bold">Total Payable</span>
                  <span className="font-display text-xl text-brand-amber">{formatINR(totalCost)}</span>
                </div>
              </div>
              <p className="font-mono text-[10px] text-brand-muted leading-relaxed">
                Deposit of {formatINR(DEPOSIT)} is held and auto-released on trip completion.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingPage