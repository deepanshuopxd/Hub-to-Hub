const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const User    = require('../models/User.model')
const Vehicle = require('../models/Vehicle.model')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ── GET /api/vendors/search?city=Ayodhya ─────────────────────────────────────
// Used by startVendor to find destination rental services in endHub city
// Also used by customers searching available hubs/cities
router.get('/search', asyncHandler(async (req, res) => {
  const { city, q } = req.query
  const search = city || q || ''

  if (!search.trim()) {
    return res.status(400).json({ message: 'Provide city name to search' })
  }

  const vendors = await User.find({
    role:                   'center_admin',
    isActive:               true,
    'rentalService.city':   { $regex: search.trim(), $options: 'i' },
    'rentalService.name':   { $exists: true },
  })
  .select('name rentalService')
  .lean()

  const results = vendors.map(v => ({
    vendorId:    v._id,
    vendorName:  v.name,
    serviceName: v.rentalService.name,
    city:        v.rentalService.city,
    address:     v.rentalService.address || '',
    lat:         v.rentalService.lat,
    lng:         v.rentalService.lng,
    hubCode:     v.rentalService.hubCode,
  }))

  res.status(200).json({ count: results.length, vendors: results })
}))

// ── GET /api/vendors/cities ───────────────────────────────────────────────────
// Returns all cities that have at least one registered vendor
// Used to populate city search suggestions
router.get('/cities', asyncHandler(async (req, res) => {
  const cities = await User.distinct('rentalService.city', {
    role:                 'center_admin',
    isActive:             true,
    'rentalService.city': { $exists: true, $ne: null },
  })

  res.status(200).json({ cities: cities.filter(Boolean).sort() })
}))

// ── GET /api/vendors/cities-with-vehicles ────────────────────────────────────
// Returns cities that have available vehicles right now
// Used on landing page and hub selector
router.get('/cities-with-vehicles', asyncHandler(async (req, res) => {
  const hubs = await Vehicle.aggregate([
    { $match: { isActive: true, isAvailable: true } },
    {
      $group: {
        _id:          '$currentHub.city',
        city:         { $first: '$currentHub.city' },
        vehicleCount: { $sum: 1 },
        minPrice:     { $min: '$pricePerDay' },
        categories:   { $addToSet: '$category' },
        vendorIds:    { $addToSet: '$homeService.vendorId' },
        // sample hub for lat/lng
        lat:          { $first: '$currentHub.lat' },
        lng:          { $first: '$currentHub.lng' },
      },
    },
    { $match: { city: { $ne: null } } },
    { $sort: { vehicleCount: -1 } },
  ])

  res.status(200).json({ count: hubs.length, hubs })
}))

// ── GET /api/vendors/my-hub ───────────────────────────────────────────────────
// Returns the logged-in vendor's own rental service details
router.get('/my-hub', protect, asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.user._id).select('rentalService name')
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' })

  res.status(200).json({ rentalService: vendor.rentalService })
}))

module.exports = router