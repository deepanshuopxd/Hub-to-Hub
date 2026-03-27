const Vehicle = require('../models/Vehicle.model')
const Booking = require('../models/Booking.model')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// GET /api/vehicles
const getAllVehicles = asyncHandler(async (req, res) => {
  const { hub, category, minPrice, maxPrice, available = 'true', vendorId } = req.query
  const filter = { isActive: true }
  if (available === 'true') filter.isAvailable = true
  if (hub)      filter['currentHub.city'] = { $regex: hub, $options: 'i' }
  if (category) filter.category = category
  if (vendorId) {
    // Filter vehicles belonging to a specific vendor's rental service
    filter.$or = [
      { owner: vendorId },
      { 'homeService.vendorId': vendorId },
      { 'currentHub.vendorId': vendorId },
    ]
  }
  if (minPrice || maxPrice) {
    filter.pricePerDay = {}
    if (minPrice) filter.pricePerDay.$gte = Number(minPrice)
    if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice)
  }
  const vehicles = await Vehicle.find(filter)
    .populate('owner', 'name phone rentalService')
    .sort({ pricePerDay: 1 })
    .lean()
  res.status(200).json({ count: vehicles.length, vehicles })
})

// GET /api/vehicles/vendor/my-fleet
// Returns:
//   1. Vehicles originally registered by this vendor (homeService.vendorId)
//   2. Vehicles currently AT this vendor's hub (currentHub.vendorId) — relocated vehicles
// Both sets shown so vendor knows what's on their lot
const getVendorFleet = asyncHandler(async (req, res) => {
  const vendorId = req.user._id

  const vehicles = await Vehicle.find({
    isActive: true,
    $or: [
      { owner:                  vendorId },
      { 'homeService.vendorId': vendorId },
      { 'currentHub.vendorId':  vendorId },
    ],
  }).sort({ createdAt: -1 }).lean()

  // Deduplicate by _id
  const seen = new Set()
  const unique = vehicles.filter(v => {
    if (seen.has(v._id.toString())) return false
    seen.add(v._id.toString())
    return true
  })

  const withStats = await Promise.all(
    unique.map(async (v) => {
      const [activeCount, revenueResult] = await Promise.all([
        Booking.countDocuments({
          vehicle:     v._id,
          startVendor: vendorId,
          status:      { $in: ['pending','awaiting_destination_vendor','active','in_transit','dropped_at_destination','completed_by_destination'] },
        }),
        Booking.aggregate([
          { $match: { vehicle: v._id, startVendor: vendorId, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$rentalCost' } } },
        ]),
      ])

      const isOriginallyMine = v.owner?.toString() === vendorId.toString() ||
                               v.homeService?.vendorId?.toString() === vendorId.toString()
      const isCurrentlyHere  = v.currentHub?.vendorId?.toString() === vendorId.toString()

      return {
        ...v,
        activeBookings:   activeCount,
        totalRevenue:     revenueResult[0]?.total || 0,
        isOriginallyMine,
        isCurrentlyHere,
        // originalService = where this vehicle was originally registered
        originalService: v.homeService?.name || 'Unknown',
      }
    })
  )

  res.status(200).json({ count: withStats.length, vehicles: withStats })
})

// GET /api/vehicles/hubs
const getAvailableHubs = asyncHandler(async (req, res) => {
  const hubs = await Vehicle.aggregate([
    { $match: { isAvailable: true, isActive: true } },
    {
      $group: {
        _id:          '$currentHub.name',
        name:         { $first: '$currentHub.name' },
        city:         { $first: '$currentHub.city' },
        lat:          { $first: '$currentHub.lat' },
        lng:          { $first: '$currentHub.lng' },
        vehicleCount: { $sum: 1 },
        minPrice:     { $min: '$pricePerDay' },
        categories:   { $addToSet: '$category' },
      },
    },
    { $sort: { vehicleCount: -1 } },
  ])
  res.status(200).json({ count: hubs.length, hubs })
})

// GET /api/vehicles/:id
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('owner', 'name phone homeHub')
  if (!vehicle || !vehicle.isActive) {
    return res.status(404).json({ message: 'Vehicle not found' })
  }
  res.status(200).json({ vehicle })
})

// POST /api/vehicles
const createVehicle = asyncHandler(async (req, res) => {
  const {
    make, model, year, plateNumber, pricePerDay,
    category, description, currentHub, homeService, securityDeposit,
  } = req.body

  if (!make || !model || !year || !plateNumber || !pricePerDay) {
    return res.status(400).json({
      message: 'make, model, year, plateNumber and pricePerDay are all required',
    })
  }

  // currentHub — from vendor's rental service (sent as JSON string)
  let hub = null
  if (currentHub) {
    try {
      hub = typeof currentHub === 'string' ? JSON.parse(currentHub) : currentHub
    } catch {
      hub = { name: currentHub, city: 'Unknown', lat: 0, lng: 0 }
    }
  }

  // Fallback: build hub from vendor's rentalService if not sent
  if (!hub || !hub.name) {
    const vendor = await require('../models/User.model').findById(req.user._id).select('rentalService')
    if (vendor?.rentalService?.name) {
      hub = {
        name:          vendor.rentalService.name,
        city:          vendor.rentalService.city,
        address:       vendor.rentalService.address || '',
        lat:           vendor.rentalService.lat  || 0,
        lng:           vendor.rentalService.lng  || 0,
        vendorId:      req.user._id,
        rentalService: vendor.rentalService.name,
      }
    } else {
      return res.status(400).json({ message: 'currentHub required — complete rental service registration first' })
    }
  }

  // homeService — which vendor registered this vehicle
  let parsedHomeService = null
  if (homeService) {
    try {
      parsedHomeService = typeof homeService === 'string' ? JSON.parse(homeService) : homeService
    } catch { parsedHomeService = null }
  }
  if (!parsedHomeService) {
    const vendor = await require('../models/User.model').findById(req.user._id).select('rentalService')
    parsedHomeService = {
      vendorId: req.user._id,
      name:     vendor?.rentalService?.name || '',
      city:     vendor?.rentalService?.city || '',
      address:  vendor?.rentalService?.address || '',
      lat:      vendor?.rentalService?.lat || 0,
      lng:      vendor?.rentalService?.lng || 0,
    }
  }

  const images = req.files?.length > 0 ? req.files.map(f => f.path) : []

  const vehicle = await Vehicle.create({
    make:            make.trim(),
    model:           model.trim(),
    year:            Number(year),
    plateNumber:     plateNumber.trim().toUpperCase(),
    pricePerDay:     Number(pricePerDay),
    securityDeposit: securityDeposit ? Number(securityDeposit) : 2000,
    category:        category || 'sedan',
    description:     description?.trim(),
    currentHub:      hub,
    homeService:     parsedHomeService,
    images,
    owner:           req.user._id,
    hubHistory:      [{ hub, arrivedAt: new Date() }],
  })

  res.status(201).json({ message: 'Vehicle added to fleet', vehicle })
})

// PUT /api/vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
  if (vehicle.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised' })
  }

  // All editable fields including plateNumber
  const editable = ['make', 'model', 'year', 'plateNumber', 'pricePerDay', 'securityDeposit', 'category', 'description', 'isAvailable']
  editable.forEach(f => {
    if (req.body[f] !== undefined) vehicle[f] = req.body[f]
  })

  // Parse currentHub from JSON string (sent as FormData)
  if (req.body.currentHub) {
    try {
      vehicle.currentHub = typeof req.body.currentHub === 'string'
        ? JSON.parse(req.body.currentHub)
        : req.body.currentHub
    } catch {
      return res.status(400).json({ message: 'Invalid currentHub format' })
    }
  }

  // Replace images only if new ones uploaded
  if (req.files?.length > 0) {
    vehicle.images = req.files.map(f => f.path)
  }

  await vehicle.save()
  res.status(200).json({ message: 'Vehicle updated', vehicle })
})

// PATCH /api/vehicles/:id/availability
const toggleAvailability = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
  if (vehicle.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised' })
  }
  vehicle.isAvailable = req.body.isAvailable ?? !vehicle.isAvailable
  await vehicle.save()
  res.status(200).json({ message: 'Availability updated', isAvailable: vehicle.isAvailable })
})

// DELETE /api/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
  if (vehicle.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised' })
  }
  const activeBooking = await Booking.findOne({
    vehicle: req.params.id,
    status:  { $in: ['pending', 'active', 'in_transit'] },
  })
  if (activeBooking) {
    return res.status(400).json({ message: 'Cannot delete vehicle with active bookings' })
  }
  vehicle.isActive = false
  await vehicle.save()
  res.status(200).json({ message: 'Vehicle removed from fleet' })
})

module.exports = {
  getAllVehicles, getVendorFleet, getAvailableHubs,
  getVehicleById, createVehicle, updateVehicle,
  toggleAvailability, deleteVehicle,
}