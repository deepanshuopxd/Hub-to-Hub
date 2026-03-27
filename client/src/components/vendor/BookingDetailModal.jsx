import { useState, useEffect } from 'react'
import {
  User, Phone, Mail, Shield, FileText,
  MapPin, Clock, IndianRupee, Eye,
  CheckCircle, XCircle, AlertTriangle, Car, Search, Building,
} from 'lucide-react'
import Modal             from '../ui/Modal'
import api               from '../../services/api'
import { formatINR, formatDateTime, formatDuration } from '../../utils/formatters'
import toast             from 'react-hot-toast'

// ── KYC badge ─────────────────────────────────────────────────────────────────
const KYCBadge = ({ status }) => {
  const map = {
    verified:  { color: 'text-green-400 bg-green-400/10 border-green-400/20',        icon: CheckCircle,    label: 'KYC Verified'  },
    submitted: { color: 'text-brand-amber bg-brand-amber/10 border-brand-amber/20',  icon: AlertTriangle,  label: 'KYC Submitted' },
    pending:   { color: 'text-brand-muted bg-white/5 border-white/10',               icon: AlertTriangle,  label: 'KYC Pending'   },
    rejected:  { color: 'text-brand-red bg-brand-red/10 border-brand-red/20',        icon: XCircle,        label: 'KYC Rejected'  },
  }
  const cfg  = map[status] || map.pending
  const Icon = cfg.icon
  return (
    <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-mono " + cfg.color}>
      <Icon size={12} /> {cfg.label}
    </span>
  )
}

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <p className="font-mono text-[10px] tracking-widest uppercase text-brand-muted border-b border-white/8 pb-1">{title}</p>
    {children}
  </div>
)

const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3">
    <Icon size={14} className="text-brand-muted mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="font-mono text-[10px] text-brand-muted uppercase tracking-wider">{label}</p>
      <p className={"text-sm text-brand-cream mt-0.5 break-all " + (mono ? 'font-mono' : '')}>
        {value || <span className="text-brand-muted italic">Not provided</span>}
      </p>
    </div>
  </div>
)

// ── Destination vendor search ─────────────────────────────────────────────────
const DestinationVendorSelector = ({ endCity, bookingId, onAssigned }) => {
  const [query,    setQuery]    = useState(endCity || '')
  const [results,  setResults]  = useState([])
  const [selected, setSelected] = useState(null)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (endCity) setQuery(endCity)
  }, [endCity])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/vendors/search?city=${encodeURIComponent(query)}`)
        setResults(data.vendors || [])
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  if (selected) {
    return (
      <div className="p-3 bg-green-500/10 border border-green-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            <div>
              <p className="text-sm text-green-400 font-medium">{selected.serviceName}</p>
              <p className="font-mono text-xs text-brand-muted">{selected.city}</p>
            </div>
          </div>
          <button onClick={() => { setSelected(null); onAssigned(null) }}
            className="font-mono text-xs text-brand-amber hover:underline">Change</button>
        </div>
        {selected.address && <p className="font-mono text-xs text-brand-muted">{selected.address}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-brand-red uppercase tracking-wider">
        * Select destination rental service (required before approving)
      </p>
      <p className="font-mono text-[10px] text-brand-muted">
        Search for a rental service in {endCity || 'destination city'} where the customer will drop the vehicle.
      </p>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder={`Search in ${endCity || 'destination city'}...`}
          className="input-field pl-8 text-sm" />
      </div>
      {results.length > 0 && (
        <div className="border border-white/10 bg-brand-mid/60 max-h-40 overflow-y-auto">
          {results.map(v => (
            <button key={v.vendorId} onClick={() => { setSelected(v); onAssigned(v) }}
              disabled={saving}
              className="w-full text-left px-3 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <Building size={14} className="text-brand-amber shrink-0" />
                <div>
                  <p className="text-sm text-brand-cream">{v.serviceName}</p>
                  <p className="font-mono text-xs text-brand-muted">{v.city}{v.address ? ` · ${v.address}` : ''}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && (
        <p className="font-mono text-xs text-brand-muted p-2">No services found in "{query}"</p>
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
const BookingDetailModal = ({ booking, onClose, onActionDone }) => {
  const [docView,      setDocView]      = useState(null)
  const [selectedDest, setSelectedDest] = useState(null)
  const [acting,       setActing]       = useState(false)

  if (!booking) return null

  const customer = booking.user
  const kyc      = customer?.kyc || {}
  const vehicle  = booking.vehicle
  const isReassign = booking.endVendorDeclined  // endVendor declined before — reassigning

  const handleApprove = async () => {
    if (!selectedDest) {
      return toast.error('Select a destination rental service first')
    }
    setActing(true)
    try {
      await api.patch(`/bookings/${booking._id}/start-vendor-action`, {
        action:      'approve',
        endVendorId: selectedDest.vendorId,
        note:        `Approved. Vehicle to be dropped at ${selectedDest.serviceName}, ${selectedDest.city}`,
      })
      toast.success('Booking approved! Waiting for destination vendor confirmation.')
      onActionDone?.()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve')
    } finally { setActing(false) }
  }

  const handleDecline = async () => {
    if (!confirm('Decline this booking? Customer will be fully refunded.')) return
    setActing(true)
    try {
      await api.patch(`/bookings/${booking._id}/start-vendor-action`, {
        action: 'decline',
        note:   'Declined by pickup vendor',
      })
      toast.success('Booking declined. Customer refunded.')
      onActionDone?.()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to decline')
    } finally { setActing(false) }
  }

  return (
    <>
      <Modal isOpen onClose={onClose} title={isReassign ? 'Reassign Destination' : 'Booking Request'} size="lg">
        <div className="space-y-6">

          {/* Reassign notice */}
          {isReassign && (
            <div className="flex items-start gap-2 p-3 bg-brand-red/5 border border-brand-red/20">
              <AlertTriangle size={14} className="text-brand-red shrink-0 mt-0.5" />
              <p className="font-mono text-xs text-brand-red">
                Destination vendor declined. Choose another rental service in {booking.endHub?.city}.
              </p>
            </div>
          )}

          {/* Trip details */}
          <Section title="Trip Details">
            <div className="p-4 bg-brand-mid/40 border border-white/6 space-y-3">
              <div className="flex items-center gap-3">
                <Car size={18} className="text-brand-amber shrink-0" />
                <div>
                  <p className="font-medium text-brand-cream">{vehicle?.make} {vehicle?.model} ({vehicle?.year})</p>
                  <p className="font-mono text-xs text-brand-muted">{vehicle?.plateNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-brand-muted shrink-0" />
                <p className="font-mono text-xs text-brand-cream">
                  <span className="text-green-400">{booking.startHub?.city}</span>
                  <span className="text-brand-muted mx-2">→</span>
                  <span className="text-brand-amber">{booking.endHub?.city}</span>
                </p>
              </div>
              {booking.startDateTime && (
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-brand-muted shrink-0" />
                  <p className="font-mono text-xs text-brand-cream">
                    {formatDateTime(booking.startDateTime)}
                    {booking.totalHours ? ` · ${booking.totalHours}h` : ''}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-white/8">
                <div>
                  <p className="font-mono text-xs text-brand-muted">Rental</p>
                  <p className="font-display text-2xl text-brand-amber">{formatINR(booking.rentalCost)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-brand-muted">Your Payout</p>
                  <p className="font-display text-2xl text-green-400">
                    {formatINR(booking.rentalCost - (booking.platformFee || 0))}
                  </p>
                  <p className="font-mono text-[9px] text-brand-muted">after platform fee</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Customer info */}
          <Section title="Customer Details">
            <div className="space-y-3">
              <InfoRow icon={User}  label="Full Name" value={customer?.name} />
              <InfoRow icon={Phone} label="Phone"     value={customer?.phone} mono />
              <InfoRow icon={Mail}  label="Email"     value={customer?.email} mono />
            </div>
          </Section>

          {/* KYC */}
          <Section title="KYC Verification">
            <div className="space-y-3">
              <KYCBadge status={kyc.status} />
              {!kyc.status?.includes('verified') && (
                <div className="flex items-start gap-2 p-3 bg-brand-red/5 border border-brand-red/20">
                  <AlertTriangle size={13} className="text-brand-red shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-brand-red">KYC not verified — proceed with caution</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {/* DL */}
                <div className="p-3 bg-brand-mid/40 border border-white/6 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileText size={13} className="text-brand-amber" />
                    <p className="font-mono text-[10px] text-brand-muted uppercase">Driving License</p>
                  </div>
                  {kyc.dlNumber && <p className="font-mono text-xs text-brand-cream">{kyc.dlNumber}</p>}
                  {kyc.dlUrl ? (
                    <button onClick={() => setDocView('dl')}
                      className="flex items-center gap-1 font-mono text-xs text-brand-amber hover:underline">
                      <Eye size={11} /> View
                    </button>
                  ) : <p className="font-mono text-[10px] text-brand-muted italic">Not uploaded</p>}
                </div>
                {/* Aadhaar */}
                <div className="p-3 bg-brand-mid/40 border border-white/6 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} className="text-brand-amber" />
                    <p className="font-mono text-[10px] text-brand-muted uppercase">Aadhaar</p>
                  </div>
                  {kyc.aadhaarNumber && <p className="font-mono text-xs text-brand-cream">{kyc.aadhaarNumber}</p>}
                  {kyc.aadhaarUrl ? (
                    <button onClick={() => setDocView('aadhaar')}
                      className="flex items-center gap-1 font-mono text-xs text-brand-amber hover:underline">
                      <Eye size={11} /> View
                    </button>
                  ) : <p className="font-mono text-[10px] text-brand-muted italic">Not uploaded</p>}
                </div>
              </div>
            </div>
          </Section>

          {/* Destination vendor selector */}
          <Section title="Destination Rental Service">
            <DestinationVendorSelector
              endCity={booking.endHub?.city}
              bookingId={booking._id}
              onAssigned={setSelectedDest}
            />
          </Section>

          {/* Actions */}
          {booking.status === 'pending' && (
            <div className="flex gap-3 pt-2 border-t border-white/8">
              <button onClick={handleDecline} disabled={acting}
                className="btn-danger flex-1 py-3 flex items-center justify-center gap-2">
                <XCircle size={15} /> Decline
              </button>
              <button onClick={handleApprove} disabled={acting || !selectedDest}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-40">
                {acting
                  ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                  : <><CheckCircle size={15} /> Approve & Forward</>
                }
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Document viewer */}
      {docView && (
        <Modal isOpen onClose={() => setDocView(null)}
          title={docView === 'dl' ? 'Driving License' : 'Aadhaar Card'} size="md">
          <div className="flex items-center justify-center">
            <img src={docView === 'dl' ? kyc.dlUrl : kyc.aadhaarUrl}
              alt={docView} className="max-w-full max-h-[60vh] object-contain border border-white/10"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
            <div className="hidden items-center justify-center p-8 text-brand-muted font-mono text-sm">
              Could not load image
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default BookingDetailModal