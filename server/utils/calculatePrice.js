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
 * calculatePrice
 *
 * @param {number} pricePerDay
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @param {object} [startHub]   { lat, lng, name }
 * @param {object} [endHub]     { lat, lng, name }
 * @returns {object}
 */
const calculatePrice = (pricePerDay, startDate, endDate, startHub = null, endHub = null) => {
  const start = new Date(startDate)
  const end   = new Date(endDate)
  if (isNaN(start) || isNaN(end)) throw new Error('Invalid dates')
  if (end <= start)               throw new Error('End date must be after start date')

  const days        = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  const rentalCost  = Math.round(pricePerDay * days)
  const deposit     = Number(process.env.SECURITY_DEPOSIT)    || 2000
  const feePct      = Number(process.env.PLATFORM_FEE_PERCENT) || 10
  const platformFee = Math.round(rentalCost * feePct / 100)
  const vendorPayout= rentalCost - platformFee
  const totalPrice  = rentalCost + deposit

  const distanceKm = startHub && endHub
    ? haversineKm(startHub.lat, startHub.lng, endHub.lat, endHub.lng)
    : 0

  return {
    days,
    pricePerDay:         Number(pricePerDay),
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