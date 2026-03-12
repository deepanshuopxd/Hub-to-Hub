import { useState } from 'react'
import {
  User, Phone, Mail, Shield, FileText,
  MapPin, Calendar, IndianRupee, Eye,
  CheckCircle, XCircle, AlertTriangle, Car,
} from 'lucide-react'
import Modal       from '../ui/Modal'
import { formatINR, formatDate } from '../../utils/formatters'

// ── KYC status badge ──────────────────────────────────────────────────────────
const KYCBadge = ({ status }) => {
  const map = {
    verified:  { color: 'text-green-400 bg-green-400/10 border-green-400/20',  icon: CheckCircle,    label: 'KYC Verified'  },
    submitted: { color: 'text-brand-amber bg-brand-amber/10 border-brand-amber/20', icon: AlertTriangle, label: 'KYC Submitted' },
    pending:   { color: 'text-brand-muted bg-white/5 border-white/10',         icon: AlertTriangle,  label: 'KYC Pending'   },
    rejected:  { color: 'text-brand-red bg-brand-red/10 border-brand-red/20',  icon: XCircle,        label: 'KYC Rejected'  },
  }
  const cfg  = map[status] || map.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-mono ${cfg.color}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div className="space-y-3">
    <p className="font-mono text-[10px] tracking-widest uppercase text-brand-muted border-b border-white/8 pb-1">
      {title}
    </p>
    {children}
  </div>
)

// ── Info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3">
    <Icon size={15} className="text-brand-muted mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="font-mono text-[10px] text-brand-muted uppercase tracking-wider">{label}</p>
      <p className={`text-sm text-brand-cream mt-0.5 break-all ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-brand-muted italic">Not provided</span>}
      </p>
    </div>
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
const BookingDetailModal = ({ booking, onClose, onAccept, onDecline, loading }) => {
  const [docView, setDocView] = useState(null)   // 'dl' | 'aadhaar'

  if (!booking) return null

  const customer   = booking.user
  const kyc        = customer?.kyc || {}
  const vehicle    = booking.vehicle
  const days       = booking.totalDays || 1
  const isVerified = kyc.status === 'verified'

  return (
    <>
      <Modal isOpen onClose={onClose} title="Booking Request" size="lg">
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">

          {/* ── Trip Summary ──────────────────────────────────────────────── */}
          <Section title="Trip Details">
            <div className="p-4 bg-brand-mid/40 border border-white/6 space-y-3">
              {/* Vehicle */}
              <div className="flex items-center gap-3">
                <Car size={18} className="text-brand-amber shrink-0" />
                <div>
                  <p className="font-medium text-brand-cream">
                    {vehicle?.make} {vehicle?.model} ({vehicle?.year})
                  </p>
                  <p className="font-mono text-xs text-brand-muted">{vehicle?.plateNumber}</p>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-brand-muted shrink-0" />
                <p className="font-mono text-xs text-brand-cream">
                  <span className="text-green-400">{booking.startHub?.name}</span>
                  <span className="text-brand-muted mx-2">→</span>
                  <span className="text-brand-amber">{booking.endHub?.name}</span>
                </p>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand-muted shrink-0" />
                <p className="font-mono text-xs text-brand-cream">
                  {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                  <span className="text-brand-muted ml-2">({days} day{days > 1 ? 's' : ''})</span>
                </p>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between pt-2 border-t border-white/8">
                <div className="space-y-0.5">
                  <p className="font-mono text-xs text-brand-muted">Rental Cost</p>
                  <p className="font-display text-2xl text-brand-amber">{formatINR(booking.rentalCost)}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-mono text-xs text-brand-muted">Your Payout</p>
                  <p className="font-display text-2xl text-green-400">
                    {formatINR(booking.rentalCost - (booking.platformFee || 0))}
                  </p>
                  <p className="font-mono text-[9px] text-brand-muted">
                    after {booking.platformFee ? Math.round((booking.platformFee / booking.rentalCost) * 100) : 10}% platform fee
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Customer Info ─────────────────────────────────────────────── */}
          <Section title="Customer Information">
            <div className="space-y-3">
              <InfoRow icon={User}  label="Full Name" value={customer?.name} />
              <InfoRow icon={Phone} label="Phone"     value={customer?.phone} mono />
              <InfoRow icon={Mail}  label="Email"     value={customer?.email} mono />
            </div>
          </Section>

          {/* ── KYC Details ───────────────────────────────────────────────── */}
          <Section title="KYC Verification">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <KYCBadge status={kyc.status} />
                {kyc.extractedName && (
                  <p className="font-mono text-xs text-brand-muted">
                    Name on docs: <span className="text-brand-cream">{kyc.extractedName}</span>
                  </p>
                )}
              </div>

              {!isVerified && (
                <div className="flex items-start gap-2 p-3 bg-brand-red/5 border border-brand-red/20">
                  <AlertTriangle size={14} className="text-brand-red shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-brand-red">
                    Customer KYC is not verified. You can still accept but proceed with caution.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* DL */}
                <div className="p-3 bg-brand-mid/40 border border-white/6 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-brand-amber" />
                    <p className="font-mono text-xs text-brand-muted uppercase tracking-wider">Driving License</p>
                  </div>
                  {kyc.dlNumber && (
                    <p className="font-mono text-sm text-brand-cream">{kyc.dlNumber}</p>
                  )}
                  {kyc.dlUrl ? (
                    <button
                      onClick={() => setDocView('dl')}
                      className="flex items-center gap-1.5 font-mono text-xs text-brand-amber hover:text-brand-amber/80 transition-colors"
                    >
                      <Eye size={12} /> View Document
                    </button>
                  ) : (
                    <p className="font-mono text-xs text-brand-muted italic">Not uploaded</p>
                  )}
                </div>

                {/* Aadhaar */}
                <div className="p-3 bg-brand-mid/40 border border-white/6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-brand-amber" />
                    <p className="font-mono text-xs text-brand-muted uppercase tracking-wider">Aadhaar Card</p>
                  </div>
                  {kyc.aadhaarNumber && (
                    <p className="font-mono text-sm text-brand-cream">{kyc.aadhaarNumber}</p>
                  )}
                  {kyc.aadhaarUrl ? (
                    <button
                      onClick={() => setDocView('aadhaar')}
                      className="flex items-center gap-1.5 font-mono text-xs text-brand-amber hover:text-brand-amber/80 transition-colors"
                    >
                      <Eye size={12} /> View Document
                    </button>
                  ) : (
                    <p className="font-mono text-xs text-brand-muted italic">Not uploaded</p>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2 border-t border-white/8">
            <button
              onClick={() => onDecline(booking._id)}
              disabled={loading}
              className="btn-danger flex-1 py-3 flex items-center justify-center gap-2"
            >
              <XCircle size={16} /> Decline
            </button>
            <button
              onClick={() => onAccept(booking._id)}
              disabled={loading}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                : <><CheckCircle size={16} /> Accept Booking</>
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Document viewer modal ─────────────────────────────────────────── */}
      {docView && (
        <Modal
          isOpen
          onClose={() => setDocView(null)}
          title={docView === 'dl' ? 'Driving License' : 'Aadhaar Card'}
          size="md"
        >
          <div className="flex items-center justify-center">
            <img
              src={docView === 'dl' ? kyc.dlUrl : kyc.aadhaarUrl}
              alt={docView === 'dl' ? 'Driving License' : 'Aadhaar Card'}
              className="max-w-full max-h-[60vh] object-contain border border-white/10"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="hidden items-center justify-center p-8 text-brand-muted font-mono text-sm">
              Could not load document image
            </div>
          </div>
          {/* If PDF, show link instead */}
          {(docView === 'dl' ? kyc.dlUrl : kyc.aadhaarUrl)?.includes('.pdf') && (
            <a
              href={docView === 'dl' ? kyc.dlUrl : kyc.aadhaarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center mt-4 block"
            >
              Open PDF
            </a>
          )}
        </Modal>
      )}
    </>
  )
}

export default BookingDetailModal