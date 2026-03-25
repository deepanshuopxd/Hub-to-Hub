const haversineKm = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0
  const R    = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/**
 * calculatePrice — time-based billing
 *
 * Billing rules:
 *  - Charges are per 24-hour block, rounded UP
 *  - 1 hr trip   = 1 day charged
 *  - 24 hr trip  = 1 day charged
 *  - 25 hr trip  = 2 days charged  ← if returned 1hr late, full extra day
 *  - 48 hr trip  = 2 days charged
 *  - 49 hr trip  = 3 days charged
 *
 * @param {number} pricePerDay
 * @param {string|Date} startDateTime   — full datetime e.g. "2025-04-10T10:00"
 * @param {string|Date} endDateTime     — full datetime e.g. "2025-04-12T11:00"
 * @param {object} [startHub]           — { lat, lng, name }
 * @param {object} [endHub]             — { lat, lng, name }
 * @param {number} [securityDeposit]    — per-vehicle deposit set by vendor
 */
const calculatePrice = (
  pricePerDay,
  startDateTime,
  endDateTime,
  startHub        = null,
  endHub          = null,
  securityDeposit = null,
) => {
  const start = new Date(startDateTime)
  const end   = new Date(endDateTime)
  if (isNaN(start) || isNaN(end)) throw new Error('Invalid dates')
  if (end <= start)               throw new Error('End time must be after start time')

  // Time-based: exact hours → ceil to full days
  const ms          = end - start
  const totalHours  = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)))
  const totalDays   = Math.max(1, Math.ceil(totalHours / 24))   // rounds UP every partial day
  const pricePerHour= pricePerDay / 24

  const rentalCost  = Math.round(pricePerDay * totalDays)

  // Use vehicle's securityDeposit if provided, else env fallback
  const deposit     = securityDeposit !== null
    ? Number(securityDeposit)
    : (Number(process.env.SECURITY_DEPOSIT) || 2000)

  const feePct      = Number(process.env.PLATFORM_FEE_PERCENT) || 10
  const platformFee = Math.round(rentalCost * feePct / 100)
  const vendorPayout= rentalCost - platformFee
  const totalPrice  = rentalCost + deposit

  const distanceKm  = startHub && endHub
    ? haversineKm(startHub.lat, startHub.lng, endHub.lat, endHub.lng)
    : 0

  return {
    totalHours,
    totalDays,
    pricePerDay:         Number(pricePerDay),
    pricePerHour:        Math.round(pricePerHour),
    rentalCost,
    deposit,
    platformFee,
    vendorPayout,
    totalPrice,
    distanceKm,
    estimatedDriveHours: distanceKm ? Math.round(distanceKm / 60) : 0,
    isCrossHubTrip:      !!(distanceKm > 0 && startHub?.name !== endHub?.name),
  }
}

module.exports = { calculatePrice, haversineKm }