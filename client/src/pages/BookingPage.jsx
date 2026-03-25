import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MapPin, Clock, ArrowRight, Car, AlertTriangle, ShieldCheck, Search } from 'lucide-react'
import { fetchVehicleById, selectSelectedVehicle } from '../store/slices/vehicleSlice'
import { createBooking, selectBookingCreating } from '../store/slices/bookingSlice'
import { fetchProfile } from '../store/slices/authSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR, formatDuration } from '../utils/formatters'
import api from '../services/api'
import Loader from '../components/ui/Loader'
import toast from 'react-hot-toast'

// ── City search with debounce ─────────────────────────────────────────────────
const CitySearch = ({ label, value, onSelect, excludeCity = null }) => {
  const [query,       setQuery]       = useState(value?.city || '')
  const [results,     setResults]     = useState([])
  const [searching,   setSearching]   = useState(false)
  const [showResults, setShowResults] = useState(false)

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const { data } = await api.get(`/vendors/search?city=${encodeURIComponent(q)}`)
      const filtered = excludeCity
        ? data.vendors.filter(v => v.city.toLowerCase() !== excludeCity.toLowerCase())
        : data.vendors
      setResults(filtered)
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [excludeCity])

  useEffect(() => {
    const t = setTimeout(() => search(query), 350)
    return () => clearTimeout(t)
  }, [query, search])

  return (
    <div className="relative">
      <label className="input-label">{label}</label>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) onSelect(null) }}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search city (e.g. Varanasi)"
          className="input-field pl-9"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-brand-amber/40 border-t-brand-amber rounded-full animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-brand-slate border border-white/10 shadow-xl mt-1 max-h-52 overflow-y-auto">
          {results.map(v => (
            <button
              key={v.vendorId}
              type="button"
              onMouseDown={() => {
                onSelect({
                  name:          v.serviceName,
                  city:          v.city,
                  address:       v.address,
                  lat:           v.lat   || 0,
                  lng:           v.lng   || 0,
                  vendorId:      v.vendorId,
                  rentalService: v.serviceName,
                })
                setQuery(`${v.serviceName}, ${v.city}`)
                setShowResults(false)
              }}
              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <p className="text-sm text-brand-cream font-medium">{v.serviceName}</p>
              <p className="font-mono text-xs text-brand-muted">{v.city}{v.address ? ` · ${v.address}` : ''}</p>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !searching && (
        <div className="absolute top-full left-0 right-0 z-50 bg-brand-slate border border-white/10 shadow-xl mt-1 p-4">
          <p className="font-mono text-xs text-brand-muted text-center">No rental services found in "{query}"</p>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const BookingPage = () => {
  const { id }     = useParams()
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user, isKycVerified } = useAuth()

  const vehicle  = useSelector(selectSelectedVehicle)
  const creating = useSelector(selectBookingCreating)

  // Get min datetime (now + 30min)
  const getMinDateTime = () => {
    const d = new Date(Date.now() + 30 * 60 * 1000)
    d.setSeconds(0, 0)
    return d.toISOString().slice(0, 16)
  }

  const [form, setForm] = useState({
    startHub:      null,
    endHub:        null,
    startDateTime: '',
    endDateTime:   '',
    paymentMethod: 'wallet',
  })
  const [errors, setErrors] = useState({})
  const [pricing, setPricing] = useState(null)

  useEffect(() => {
    if (id) dispatch(fetchVehicleById(id))
  }, [id, dispatch])

  // Pre-fill startHub from vehicle's current location
  useEffect(() => {
    if (vehicle?.currentHub) {
      setForm(f => ({
        ...f,
        startHub: {
          name:          vehicle.currentHub.name,
          city:          vehicle.currentHub.city || vehicle.currentHub.name,
          lat:           vehicle.currentHub.lat  || 0,
          lng:           vehicle.currentHub.lng  || 0,
          vendorId:      vehicle.owner?._id || null,
          rentalService: vehicle.currentHub.rentalService || vehicle.currentHub.name,
        },
      }))
    }
  }, [vehicle])

  // Recalculate pricing when form changes
  useEffect(() => {
    if (!vehicle || !form.startDateTime || !form.endDateTime) {
      setPricing(null)
      return
    }
    try {
      const start    = new Date(form.startDateTime)
      const end      = new Date(form.endDateTime)
      if (end <= start) { setPricing(null); return }

      const ms         = end - start
      const totalHours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)))
      const totalDays  = Math.max(1, Math.ceil(totalHours / 24))
      const deposit    = vehicle.securityDeposit ?? 2000
      const rental     = vehicle.pricePerDay * totalDays
      const fee        = Math.round(rental * 0.10)

      setPricing({ totalHours, totalDays, rental, deposit, fee, total: rental + deposit })
    } catch {
      setPricing(null)
    }
  }, [form.startDateTime, form.endDateTime, vehicle])

  const validate = () => {
    const e = {}
    if (!form.startHub)      e.startHub      = 'Select pickup location'
    if (!form.endHub)        e.endHub        = 'Select drop-off location'
    if (!form.startDateTime) e.startDateTime = 'Select pickup date & time'
    if (!form.endDateTime)   e.endDateTime   = 'Select return date & time'
    if (form.startDateTime && form.endDateTime) {
      if (new Date(form.endDateTime) <= new Date(form.startDateTime)) {
        e.endDateTime = 'Return must be after pickup'
      }
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    if (!isKycVerified) {
      toast.error('Complete KYC verification before booking')
      navigate('/kyc'); return
    }

    if (form.paymentMethod === 'wallet') {
      const needed = (pricing?.total || 0)
      if ((user?.wallet?.balance || 0) < needed) {
        toast.error(`Insufficient wallet balance. Need ${formatINR(needed)}.`)
        navigate('/wallet'); return
      }
    }

    try {
      await dispatch(createBooking({
        vehicleId:     id,
        startHub:      form.startHub,
        endHub:        form.endHub,
        startDateTime: form.startDateTime,
        endDateTime:   form.endDateTime,
        paymentMethod: form.paymentMethod,
        endVendorId:   form.endHub?.vendorId || null,
      })).unwrap()

      dispatch(fetchProfile())  // refresh wallet
      toast.success('Booking confirmed! Awaiting vendor approval.')
      navigate('/bookings')
    } catch (err) {
      toast.error(err || 'Booking failed')
    }
  }

  if (!vehicle) return (
    <div className="flex justify-center py-20"><Loader label="Loading vehicle..." /></div>
  )

  const minDT = getMinDateTime()

  return (
    <div className="max-w-4xl animate-[fadeUp_0.5s_ease_forwards]">
      <span className="section-eyebrow">New Booking</span>
      <h1 className="font-display text-3xl sm:text-5xl text-brand-cream mb-6 sm:mb-8">
        Book <span className="text-brand-amber">{vehicle.make} {vehicle.model}</span>
      </h1>

      {/* KYC warning */}
      {!isKycVerified && (
        <div className="mb-6 p-4 border border-brand-red/30 bg-brand-red/5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-brand-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-cream">KYC Required</p>
            <p className="font-mono text-xs text-brand-muted mt-0.5">
              Complete identity verification before booking.{' '}
              <a href="/kyc" className="text-brand-amber hover:underline">Verify now →</a>
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">

          {/* Route */}
          <div className="space-y-4">
            <h2 className="font-mono text-xs tracking-widest uppercase text-brand-amber flex items-center gap-2">
              <MapPin size={14} /> Select Route
            </h2>

            <CitySearch
              label="Pickup — Rental Service"
              value={form.startHub}
              onSelect={hub => { setForm(f => ({ ...f, startHub: hub })); setErrors(e => ({ ...e, startHub: null })) }}
            />
            {errors.startHub && <p className="font-mono text-xs text-brand-red -mt-2">{errors.startHub}</p>}

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/8" />
              <ArrowRight size={16} className="text-brand-amber" />
              <div className="flex-1 h-px bg-white/8" />
            </div>

            <CitySearch
              label="Drop-off — Rental Service"
              value={form.endHub}
              excludeCity={form.startHub?.city}
              onSelect={hub => { setForm(f => ({ ...f, endHub: hub })); setErrors(e => ({ ...e, endHub: null })) }}
            />
            {errors.endHub && <p className="font-mono text-xs text-brand-red -mt-2">{errors.endHub}</p>}
          </div>

          {/* Date + Time */}
          <div className="space-y-4">
            <h2 className="font-mono text-xs tracking-widest uppercase text-brand-amber flex items-center gap-2">
              <Clock size={14} /> Pickup & Return Time
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Pickup Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.startDateTime}
                  min={minDT}
                  onChange={e => {
                    setForm(f => ({ ...f, startDateTime: e.target.value }))
                    setErrors(e2 => ({ ...e2, startDateTime: null }))
                  }}
                  className={"input-field " + (errors.startDateTime ? 'border-brand-red/50' : '')}
                />
                {errors.startDateTime && <p className="font-mono text-xs text-brand-red mt-1">{errors.startDateTime}</p>}
              </div>
              <div>
                <label className="input-label">Return Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.endDateTime}
                  min={form.startDateTime || minDT}
                  onChange={e => {
                    setForm(f => ({ ...f, endDateTime: e.target.value }))
                    setErrors(e2 => ({ ...e2, endDateTime: null }))
                  }}
                  className={"input-field " + (errors.endDateTime ? 'border-brand-red/50' : '')}
                />
                {errors.endDateTime && <p className="font-mono text-xs text-brand-red mt-1">{errors.endDateTime}</p>}
              </div>
            </div>

            {/* Duration preview */}
            {pricing && (
              <div className="flex items-center gap-2 px-3 py-2 bg-brand-amber/5 border border-brand-amber/20">
                <Clock size={13} className="text-brand-amber" />
                <p className="font-mono text-xs text-brand-amber">
                  Duration: {formatDuration(pricing.totalHours)} = {pricing.totalDays} day{pricing.totalDays > 1 ? 's' : ''} charged
                  {pricing.totalHours % 24 !== 0 && (
                    <span className="text-brand-muted ml-1">
                      (partial day rounds up)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-3">
            <h2 className="font-mono text-xs tracking-widest uppercase text-brand-amber">Payment Method</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'wallet',   label: '💰 Wallet'   },
                { value: 'razorpay', label: '📱 UPI/Card' },
                { value: 'cash',     label: '💵 Cash'     },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, paymentMethod: opt.value }))}
                  className={"py-2 font-mono text-xs border transition-colors " +
                    (form.paymentMethod === opt.value
                      ? 'bg-brand-amber/10 border-brand-amber text-brand-amber'
                      : 'border-white/10 text-brand-muted hover:border-white/30'
                    )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.paymentMethod === 'cash' && (
              <p className="font-mono text-xs text-brand-muted">
                Cash payment collected directly by vendor at pickup.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={creating || !isKycVerified}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating
              ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
              : <><ShieldCheck size={16} /> Confirm Booking</>
            }
          </button>
        </form>

        {/* ── Summary ──────────────────────────────────────────────────────── */}
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
            <p className="font-mono text-xs text-brand-muted">{vehicle.currentHub?.city || vehicle.currentHub?.name}</p>
            <div className="mt-3 pt-3 border-t border-white/8 flex items-baseline gap-1">
              <span className="font-display text-2xl text-brand-amber">{formatINR(vehicle.pricePerDay)}</span>
              <span className="font-mono text-xs text-brand-muted">/day</span>
            </div>
          </div>

          {/* Price breakdown */}
          {pricing && (
            <div className="card p-5 border border-brand-amber/20 bg-brand-amber/3 space-y-3">
              <h3 className="font-mono text-xs tracking-widest uppercase text-brand-amber">Price Summary</h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-brand-muted">
                  <span>{formatINR(vehicle.pricePerDay)} × {pricing.totalDays} day{pricing.totalDays > 1 ? 's' : ''}</span>
                  <span className="text-brand-cream">{formatINR(pricing.rental)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Security deposit (refundable)</span>
                  <span className="text-brand-cream">{formatINR(pricing.deposit)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/8 text-brand-cream">
                  <span className="font-bold">Total Payable</span>
                  <span className="font-display text-xl text-brand-amber">{formatINR(pricing.total)}</span>
                </div>
              </div>
              <p className="font-mono text-[10px] text-brand-muted leading-relaxed">
                Deposit of {formatINR(pricing.deposit)} is held and auto-released on trip completion.
                Partial day = full day charged.
              </p>
            </div>
          )}

          {/* Wallet balance */}
          {form.paymentMethod === 'wallet' && (
            <div className="card p-4 border border-white/8 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-brand-muted uppercase tracking-wider">Your Wallet</p>
                <p className={"font-display text-2xl mt-0.5 " +
                  ((user?.wallet?.balance || 0) >= (pricing?.total || 0)
                    ? 'text-green-400' : 'text-brand-red')}>
                  {formatINR(user?.wallet?.balance || 0)}
                </p>
              </div>
              {(user?.wallet?.balance || 0) < (pricing?.total || 0) && (
                <a href="/wallet" className="btn-primary text-xs py-1.5 px-3">Top Up</a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingPage