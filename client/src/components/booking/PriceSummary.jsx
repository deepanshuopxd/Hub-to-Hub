import { Receipt, ShieldCheck, Calendar, Car, Info } from 'lucide-react'
import { formatINR, calculateDays, formatDate } from '../../utils/formatters'

const DEPOSIT = Number(import.meta.env.VITE_DEPOSIT_AMOUNT) || 2000

/**
 * PriceSummary
 * Props:
 *  - vehicle     Vehicle object
 *  - startDate   string
 *  - endDate     string
 *  - startHub    Hub object
 *  - endHub      Hub object
 *  - walletBalance number
 */
const PriceSummary = ({
  vehicle,
  startDate,
  endDate,
  startHub,
  endHub,
  walletBalance = 0,
}) => {
  const hasRange     = startDate && endDate
  const days         = hasRange ? calculateDays(startDate, endDate) : 0
  const rentalCost   = days * (vehicle?.pricePerDay || 0)
  const totalPayable = rentalCost + DEPOSIT
  const canAfford    = walletBalance >= DEPOSIT

  const rows = [
    {
      icon: Car,
      label:    `Rental (${formatINR(vehicle?.pricePerDay || 0)} × ${days} day${days !== 1 ? 's' : ''})`,
      value:    formatINR(rentalCost),
      muted:    !hasRange,
    },
    {
      icon: ShieldCheck,
      label:    'Security Deposit',
      sublabel: 'Refundable on trip completion',
      value:    formatINR(DEPOSIT),
      muted:    false,
    },
  ]

  return (
    <div className="space-y-3">
      {/* Journey summary */}
      {(startHub || endHub) && (
        <div className="card p-4 border border-white/8 space-y-2">
          <h4 className="font-mono text-xs tracking-widest uppercase text-brand-muted mb-3">
            Journey
          </h4>
          {startHub && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-amber flex-shrink-0" />
              <span className="text-sm text-brand-cream">{startHub.name}</span>
            </div>
          )}
          {startHub && endHub && <div className="w-px h-4 bg-brand-amber/30 ml-1" />}
          {endHub && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-red flex-shrink-0" />
              <span className="text-sm text-brand-cream">{endHub.name}</span>
            </div>
          )}
          {hasRange && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/8">
              <Calendar size={12} className="text-brand-muted flex-shrink-0" />
              <span className="font-mono text-xs text-brand-muted">
                {formatDate(startDate)} – {formatDate(endDate)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Price breakdown */}
      <div className="card p-4 border border-brand-amber/15 bg-brand-amber/[0.02] space-y-3">
        <h4 className="font-mono text-xs tracking-widest uppercase text-brand-muted flex items-center gap-1.5">
          <Receipt size={12} />
          Price Breakdown
        </h4>

        {rows.map(({ icon: Icon, label, sublabel, value, muted }) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <Icon size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className={`text-sm ${muted ? 'text-brand-muted' : 'text-brand-cream'}`}>{label}</p>
                {sublabel && <p className="font-mono text-xs text-brand-muted">{sublabel}</p>}
              </div>
            </div>
            <span className={`font-mono text-sm flex-shrink-0 ${muted ? 'text-brand-muted' : 'text-brand-cream'}`}>
              {value}
            </span>
          </div>
        ))}

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="font-mono text-xs tracking-widest uppercase text-brand-muted">
            Total Payable
          </span>
          <span className="font-display text-3xl text-brand-amber">
            {formatINR(totalPayable)}
          </span>
        </div>

        {/* Wallet check */}
        <div className={`flex items-start gap-2 p-3 border ${
          canAfford
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-brand-red/5 border-brand-red/20'
        }`}>
          <Info size={13} className={`mt-0.5 flex-shrink-0 ${canAfford ? 'text-green-400' : 'text-brand-red'}`} />
          <div>
            <p className={`font-mono text-xs ${canAfford ? 'text-green-400' : 'text-brand-red'}`}>
              {canAfford
                ? `Wallet balance sufficient (${formatINR(walletBalance)})`
                : `Insufficient balance — need ${formatINR(DEPOSIT)} for deposit`
              }
            </p>
            {!canAfford && (
              <p className="font-mono text-xs text-brand-muted mt-0.5">
                Top up your wallet before booking.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceSummary